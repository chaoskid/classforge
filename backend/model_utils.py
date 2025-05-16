
import json
import random
import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify, session
from database.models import Students, Clubs, Users, Teachers, SurveyResponse, Relationships, Allocations, Affiliations, Unit, CalculatedScores, AllocationsSummary
import torch
from torch_geometric.data import Data
from model.rgcn.rgcn_linkpred import InductiveRGCN, LinkPredictor
from model.dqn.train_predict import *

def generate_dataframes(db, user_id):
    teacher = db.query(Teachers).filter_by(emp_id=user_id).first()
    if not teacher:
        return jsonify({"message": "Invalid teacher account"}), 401
    unit_id = teacher.manage_unit
    student_id_rows = db.query(Allocations.student_id).filter_by(unit_id=unit_id).all()
    student_ids = [row[0] for row in student_id_rows]
    if not student_ids:
        return jsonify({"message": "No students allocated to this unit"}), 401
    calculated_scores = db.query(CalculatedScores).filter(CalculatedScores.student_id.in_(student_ids)).all()
    if not calculated_scores:
        return jsonify({"message": "No students scores found"}), 401
    relationships = db.query(Relationships).filter(Relationships.source.in_(student_ids),Relationships.target.in_(student_ids)).all()
    if not relationships:
        return jsonify({"message": "No relationships found"}), 401
    print("\n------------  Creating list of dict from calculated scores")
    scores_list = [ obj.to_dict() for obj in calculated_scores ]
    print("\n------------  Creating list of dict from relationship scores")
    relationships_list = [ obj.to_dict() for obj in relationships ]
    rel_df = pd.DataFrame(relationships_list)
    scores_df = pd.DataFrame(scores_list)
    print("\n------------ Scores DataFrame columns: \n", scores_df.columns)
    print("\n------------ Scores DataFrame shape: \n", scores_df.shape)
    print("\n------------ Relationships DataFrame columns: \n", rel_df.columns)
    print("\n------------ Relationships DataFrame shape: \n", rel_df.shape)
    return unit_id,scores_df, rel_df

def map_link_types(rel_df):
    edge_types = {
    'friends' : 0,
    'influence' : 1,
    'feedback': 2,
    'more_time': 3,
    'advice': 4,
    'disrespect': 5
    }
    
    rel_df['edge_type'] = rel_df['link_type'].map(edge_types).astype(np.int64)

    return rel_df

def map_student_ids(student_df,edges_df):
    student_ids = set(student_df['student_id'].unique())
    student_ids.update(edges_df['source'].unique())
    student_ids.update(edges_df['target'].unique())
    print("\n------------ Number of student ids: ", len(student_ids))

    #convert this id into ordered from 0
    id_map = {id:new_id for new_id,id  in enumerate(sorted(student_ids))}

    #apply this new id in the df_out
    student_df['node_id'] = student_df['student_id'].map(id_map)
    #print(df_out.head())  
    edges_df['source'] = edges_df['source'].map(id_map)
    edges_df['target'] = edges_df['target'].map(id_map)
    #print(edges_df.head())

    feature_cols = [col for col in student_df.columns if col not in ['student_id']]
    #print(feature_cols)

    node_feature_df = student_df[feature_cols]

    return node_feature_df, edges_df, id_map

def create_data_object(student_df, edges_df):
    # Tensor for node features
    num_rows = student_df.shape[0]
    print('Number of rows: ', num_rows)
    feature_cols = [col for col in student_df.columns if col not in ['node_id']]
    num_features = len(feature_cols) #ignoring node_id column we created
    print('\n------------ Torch tensor will be created with rows: {} and cols: {}.'.format(num_rows,num_features))
    student_df[feature_cols] = student_df[feature_cols].apply(pd.to_numeric)
    node_feature_df=student_df.sort_values('node_id')
    print("\n------------ Node feature DataFrame columns: \n", node_feature_df.dtypes)
    x = torch.zeros(num_rows,num_features, dtype=torch.float)   
    for index, row in node_feature_df.iterrows():
        node_id = int(row['node_id'])
        #print(row[feature_cols[:-1]].values)
        x[node_id] = torch.tensor(row[feature_cols].values, dtype=torch.float)

    print("\n------------ Edge DataFrame columns: \n", edges_df.dtypes)
    #Tensor for edges - one row for source and one row for columns. this is because torch.geometric like it this way
    edges = torch.tensor([edges_df['source'].values,
                         edges_df['target'].values], dtype=torch.int64)
    #print(edges)

    #Tensor for edge attributes
    edge_features = torch.tensor(edges_df['edge_type'], dtype=torch.int64)
    #print(edge_features)

    #Creating a torch geometric data object for modelling
    data = Data(x=x, edge_index=edges, edge_attr=edge_features)
     
    return data

def save_allocation_summary(unit_id, allocation_summary, db):

    # convert each dict into an AllocationsSummary ORM instance
    objs = []
    for row in allocation_summary:
        # you may want to validate that r['unit_id']==unit_id, etc.
        objs.append(AllocationsSummary(**row))
    if objs:
        # first delete any existing summary for this unit
        (db.query(AllocationsSummary)
                   .filter_by(unit_id=unit_id)
                   .delete())
        # bulk save new rows
        db.bulk_save_objects(objs)
        db.commit()

    
def save_allocations(db_session, env, id_map, unit_id):
    
    # 1) Null‐out prior allocations for this unit
    db_session.query(Allocations) \
              .filter_by(unit_id=unit_id) \
              .update({'class_id': None}, synchronize_session=False)
    upserted = 0
    map_id = {v: int(k) for k, v in id_map.items()}
    # 2) Walk through your env.state to apply the new class assignments
    for class_idx, cls in enumerate(env.state):
        for internal_idx in cls['student_indices']:
            student_id = map_id[internal_idx]
            # Try to fetch an existing row
            alloc = (db_session.query(Allocations)
                              .filter_by(unit_id=unit_id, student_id=student_id)
                              .one_or_none())
            if alloc:
                # Update the cleared row
                alloc.class_id    = class_idx
                alloc.reallocation = 0
            else:
                # Insert a new one
                alloc = Allocations(
                    unit_id      = unit_id,
                    student_id   = student_id,
                    class_id     = class_idx,
                    reallocation = 0
                )
                db_session.add(alloc)
            
            upserted += 1
    
    db_session.commit()
    return upserted

def generate_target_matrix(target_values: list[dict]) -> np.ndarray:
    """
    Build a (num_classes × feature_dim) matrix from the list of target‐value dicts.
    Each dict has the 7 keys in `targetScores` mapping to floats (or numeric strings) in [0,1].
    """
    feature_keys = [
        'academic_engagement_score',
        'academic_wellbeing_score',
        'gender_norm_score',
        'growth_mindset_score',
        'mental_health_score',
        'school_environment_score',
        'social_attitude_score',
    ]
    num_classes = len(target_values)
    feature_dim = len(feature_keys)
    mat = np.zeros((num_classes, feature_dim), dtype=float)

    for i, class_dict in enumerate(target_values):
        for j, key in enumerate(feature_keys):
            raw = class_dict.get(key, 0.0)
            try:
                val = float(raw)
            except (ValueError, TypeError):
                val = 0.0
            mat[i, j] = round(val, 2)

    return mat

def returnRgcnLinkPred():
    ckpt = torch.load("model/rgcn/rgcn_linkpred_checkpoint.pth", map_location='cpu')
    in_channels      = ckpt['in_channels']
    hidden_channels  = ckpt['hidden_channels']
    out_channels     = ckpt['out_channels']
    num_relations    = ckpt['num_relations']
    link_hidden_dim  = ckpt['link_hidden_dim']

    model = InductiveRGCN(in_channels, hidden_channels, out_channels, num_relations)
    link_predictor = LinkPredictor(out_channels, link_hidden_dim, num_relations)

    model.load_state_dict(     ckpt['rgcn_state'])
    link_predictor.load_state_dict(ckpt['linkpred_state'])
    
    model.eval()
    link_predictor.eval()

    return model, link_predictor

def generate_dataframes_by_classid(db, user_id, class_id,student_id):
    teacher = db.query(Teachers).filter_by(emp_id=user_id).first()
    if not teacher:
        return jsonify({"message": "Invalid teacher account"}), 401
    unit_id = teacher.manage_unit
    student_id_rows = db.query(Allocations.student_id).filter_by(unit_id=unit_id, class_id=class_id).all()
    student_ids = [row[0] for row in student_id_rows]
    student_ids.append(student_id)
    print("\n------------  Student IDs: ", student_ids)
    if not student_ids:
        return jsonify({"message": "No students allocated to this unit"}), 401
    calculated_scores = db.query(CalculatedScores).filter(CalculatedScores.student_id.in_(student_ids)).all()
    if not calculated_scores:
        return jsonify({"message": "No students scores found"}), 401
    relationships = db.query(Relationships).filter(Relationships.source.in_(student_ids),Relationships.target.in_(student_ids)).all()
    if not relationships:
        return jsonify({"message": "No relationships found"}), 401
    print("\n------------  Creating list of dict from calculated scores")
    scores_list = [ obj.to_dict() for obj in calculated_scores ]
    print("\n------------  Creating list of dict from relationship scores")
    relationships_list = [ obj.to_dict() for obj in relationships ]
    rel_df = pd.DataFrame(relationships_list)
    scores_df = pd.DataFrame(scores_list)
    print("\n------------ Scores DataFrame columns: \n", scores_df.columns)
    print("\n------------ Scores DataFrame shape: \n", scores_df.shape)
    print("\n------------ Relationships DataFrame columns: \n", rel_df.columns)
    print("\n------------ Relationships DataFrame shape: \n", rel_df.shape)
    return unit_id,scores_df, rel_df

def get_non_relationship_ids(data, idmap, source_id):
    
    # map the actual source ID to its node index
    source_idx = int(idmap[source_id])

    # edge_index rows: [0] = source nodes, [1] = target nodes
    edge_index = data.edge_index
    if isinstance(edge_index, torch.Tensor):
        src, dst = edge_index
    else:
        # in case it's a numpy array or list
        src, dst = torch.tensor(edge_index[0]), torch.tensor(edge_index[1])

    # find all neighbors of source_idx (both directions)
    # out-edges:
    out_neigh = dst[src == source_idx].tolist()
    # in-edges:
    in_neigh  = src[dst == source_idx].tolist()
    neighbors = set(out_neigh + in_neigh)

    # build the full set of all node indices
    all_indices = set(idmap.values())

    # non-neighbors = everyone except source and its neighbors
    non_neighbors = sorted(all_indices - neighbors - {source_idx})

    return non_neighbors



def seed_env_from_existing_allocations(env, alloc_rows, id_map, student_data, pool_ids=None):

    env.state = env._init_state()
    for sid, cls in alloc_rows:
        # skip seeding any student who's up for reallocation
        if pool_ids and sid in pool_ids:
            continue
        idx = id_map[sid]
        features = student_data[idx]
        env._update_state(cls, features, idx)


def reallocate_pool_students(env, agent, pool_ids, id_map, student_data, unit_id):
    # now pool_ids is the set of real student_ids
    pool_idx = [id_map[sid] for sid in pool_ids if sid in id_map]
    updates = {}
    for idx in random.sample(pool_idx, len(pool_idx)):
        state_vec = env.get_state()
        new_class = agent.act(state_vec)
        env.step(student_data[idx], new_class, idx)
        updates[idx] = new_class

    # rebuild summary based on the *new* state
    allocation_summary = build_allocation_summary(
        env, env.target_feature_avgs, unit_id, env.E
    )
    return allocation_summary, updates


def save_reallocation_updates(db, unit_id, updates, id_map):

    inv_map = {v: int(k) for k, v in id_map.items()}
    count = 0

    for idx, new_class in updates.items():
        sid = inv_map[idx]
        print(type(sid), sid)
        print(type(new_class), new_class)
        alloc = (
            db.query(Allocations)
              .filter_by(unit_id=unit_id, student_id=sid)
              .one_or_none()
        )
        if alloc:
            alloc.class_id     = new_class
            alloc.reallocation = 0
        else:
            alloc = Allocations(
                unit_id      = unit_id,
                student_id   = sid,
                class_id     = new_class,
                reallocation = 0
            )
            db.add(alloc)
        count += 1

    db.commit()
    return count
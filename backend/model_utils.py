
import json
import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify, session
from database.models import Students, Clubs, Users, Teachers, SurveyResponse, Relationships, Allocations, Affiliations, Unit, CalculatedScores
import torch
from torch_geometric.data import Data

def generate_dataframes(db, user_id):
    teacher = db.query(Teachers).filter_by(emp_id=user_id).first()
    if not teacher:
        return jsonify({"message": "Invalid teacher account"}), 401
    unit_id = teacher.manage_unit
    student_id_rows = db.query(Allocations.student_id).filter_by(unit_id=unit_id, reallocation=0).all()
    student_ids = [row[0] for row in student_id_rows]
    if not student_ids:
        return jsonify({"message": "No students allocated to this unit"}), 401
    calculated_scores = db.query(CalculatedScores).filter(CalculatedScores.student_id.in_(student_ids)).all()
    if not calculated_scores:
        return jsonify({"message": "No students scores found"}), 401
    relationships = db.query(Relationships).filter(Relationships.source.in_(student_ids),Relationships.target.in_(student_ids)).all()
    if not relationships:
        return jsonify({"message": "No relationships found"}), 401
    print("\n-------------------- Creating list of dict from calculated scores")
    scores_list = [ obj.to_dict() for obj in calculated_scores ]
    print("\n-------------------- Creating list of dict from relationship scores")
    relationships_list = [ obj.to_dict() for obj in relationships ]
    rel_df = pd.DataFrame(relationships_list)
    scores_df = pd.DataFrame(scores_list)
    print("\n\n------------ Scores DataFrame columns: \n", scores_df.columns)
    print("------------ Scores DataFrame shape: \n", scores_df.shape)
    print("------------ Scores DataFrame sample: \n", scores_df.head())
    print("\n\n------------ Relationships DataFrame columns: \n", rel_df.columns)
    print("------------ Relationships DataFrame shape: \n", rel_df.shape)
    print("------------ Relationships DataFrame sample: \n", rel_df.head())
    return scores_df, rel_df

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
    print(len(student_ids))
    student_ids.update(edges_df['source'].unique())
    print(len(student_ids))
    student_ids.update(edges_df['target'].unique())
    print(len(student_ids))
    print("Number of student ids: ", len(student_ids))

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
    print('\nTorch tensor will be created with rows: {} and cols: {}.'.format(num_rows,num_features))
    student_df[feature_cols] = student_df[feature_cols].apply(pd.to_numeric)
    node_feature_df=student_df.sort_values('node_id')
    print("\n\n------------ Node feature DataFrame columns: \n", node_feature_df.dtypes)
    x = torch.zeros(num_rows,num_features, dtype=torch.float)   
    for index, row in node_feature_df.iterrows():
        node_id = int(row['node_id'])
        #print(row[feature_cols[:-1]].values)
        x[node_id] = torch.tensor(row[feature_cols].values, dtype=torch.float)

    print("\n\n------------ Edge DataFrame columns: \n", edges_df.dtypes)
    #Tensor for edges - one row for source and one row for columns. this is because torch.geometric like it this way
    edges = torch.tensor([edges_df['source'].values,
                         edges_df['target'].values], dtype=torch.int64)
    #print(edges)

    #Tensor for edge attributes
    edge_features = torch.tensor(edges_df['edge_type'], dtype=torch.int64)
    #print(edge_features)

    #Creating a torch geometric data object for modelling
    data = Data(x=x, edge_index=edges, edge_attr=edge_features)
    print(data) #Data(x=[275, 5], edge_index=[2, 2511], edge_attr=[2511])
    
    return data

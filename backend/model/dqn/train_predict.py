# train_predict.py
import numpy as np
import random
import torch

from model.dqn.dqn_agent import DQNAgent
from model.dqn.allocation_env import StudentAllocationEnv
from model.dqn.allocation_env import state_to_vector
from model.dqn.allocation_env import precompute_link_matrices

def print_link_summary(env, E):
    """
    Prints per‐class existing link counts (only for labels 0–5) in CSV format.

    Args:
      env: your allocation environment, with:
        - env.num_classes
        - env.state[cls_idx]['student_indices']  (list of student indices)
      E:   (N x N) numpy array of integer edge‐labels.
           Valid labels: 0=friends, 1=influential, 2=feedback, 3=more_time,
                         4=advice, 5=disrespect
           Any other value (e.g. -1 or >5) will be ignored.
    """
    # define your labels
    edge_types = {
        'friends'    : 0,
        'influential': 1,
        'feedback'   : 2,
        'more_time'  : 3,
        'advice'     : 4,
        'disrespect' : 5
    }
    # reverse lookup
    rev = {v: k for k, v in edge_types.items()}
    labels = [rev[i] for i in range(len(edge_types))]

    # CSV header
    print("Class," + ",".join(labels))

    # for each class
    for cls_idx in range(env.num_classes):
        counts = {lbl: 0 for lbl in labels}
        members = env.state[cls_idx]['student_indices']

        # count edges among members
        for i in members:
            for j in members:
                if i == j:
                    continue
                val = int(E[i, j])
                # only count if it's one of our six labels
                if val in rev:
                    counts[rev[val]] += 1

        # print CSV row
        row = ",".join(str(counts[lbl]) for lbl in labels)
        print(f"{cls_idx},{row}")


def build_allocation_summary(env, target_feature_avgs, unit_id,E):
    """
    Walks env.state to build a list of dicts, one per class,
    with all the metrics you need for AllocationsSummary.
    """
    summary = []
    # first get the link counts from your utility
    # but here we re-compute them into dicts:
    friends, influence, feedback, more_time, advice, disrespect = ([] for _ in range(6))
    # reuse the same logic from print_link_summary but accumulating into lists per class
    edge_types = {'friends':0,'influence':1,'feedback':2,'more_time':3,
                  'advice':4,'disrespect':5, 'no_link':-1}
    rev = {v:k for k,v in edge_types.items()}
    # precompute both existing and predicted per class into two lists of dicts
    existing_counts_list = []
    for cls_idx in range(env.num_classes):
        members = env.state[cls_idx]['student_indices']
        exc = {lbl:0 for lbl in edge_types}
        for i in members:
            for j in members:
                if i==j: continue
                lbl = int(E[i,j])
                exc[rev[lbl]] += 1
        existing_counts_list.append(exc)

    # now build per-class rows
    for i, tgt in enumerate(target_feature_avgs):
        cnt = env.state[i]['count']
        if cnt>0:
            avg = (env.state[i]['sum_features']/cnt).round(3)
        else:
            avg = [0.0]*len(tgt)

        row = {
            'unit_id':                 unit_id,
            'class_id':                i,
            'class_label':             f"Class {i+1}",
            'student_count':           int(cnt),

            # allocated averages:
            'alloc_academic_engagement_score': float(avg[0]),
            'alloc_academic_wellbeing_score':  float(avg[1]),
            'alloc_mental_health_score':       float(avg[2]),
            'alloc_growth_mindset_score':      float(avg[3]),
            'alloc_gender_norm_score':         float(avg[4]),
            'alloc_social_attitude_score':     float(avg[5]),
            'alloc_school_environment_score':  float(avg[6]),

            # target averages:
            'target_academic_engagement_score': float(round(tgt[0],3)),
            'target_academic_wellbeing_score':  float(round(tgt[1],3)),
            'target_mental_health_score':       float(round(tgt[2],3)),
            'target_growth_mindset_score':      float(round(tgt[3],3)),
            'target_gender_norm_score':         float(round(tgt[4],3)),
            'target_social_attitude_score':     float(round(tgt[5],3)),
            'target_school_environment_score':  float(round(tgt[6],3)),

            # link counts
            'num_friendships':   existing_counts_list[i]['friends'],
            'num_influence':     existing_counts_list[i]['influence'],
            'num_feedback':      existing_counts_list[i]['feedback'],
            'num_more_time':     existing_counts_list[i]['more_time'],
            'num_advice':        existing_counts_list[i]['advice'],
            'num_disrespect':    existing_counts_list[i]['disrespect'],
            # you can add predicted counts if you want...
        }
        summary.append(row)

    return summary


def train_and_allocate(unit_id,num_classes,
                       target_class_size,
                       target_feature_avgs,
                       student_data,
                       E,
                       num_episodes=250,
                       batch_size=32,
                       model_path=None):
    
    feature_dim = student_data.shape[1]
    state_dim = num_classes * (feature_dim + 1)
    action_dim = num_classes

    env = StudentAllocationEnv(num_classes,
                               target_class_size,
                               target_feature_avgs,
                               E)
    agent = DQNAgent(state_dim, action_dim)

    for ep in range(num_episodes):
        env.state = env._init_state()
        total_reward = 0.0
        idxs = list(range(len(student_data)))
        random.shuffle(idxs)
        for idx in idxs:
            feats = student_data[idx]
            s = state_to_vector(env.state, feature_dim)
            a = agent.act(s)
            r, _ = env.step(feats, a, idx)
            total_reward += r
            s_next = state_to_vector(env.state, feature_dim)
            agent.remember(s, a, r, s_next, False)
            agent.replay(batch_size)
        if ep % 10 == 0:
            if ep == 0:
                print(f"Episode 00{ep+1}: Total Reward = {total_reward:.2f}, Epsilon = {agent.epsilon:.3f}")
            elif ep < 100:
                print(f"Episode 0{ep+1}: Total Reward = {total_reward:.2f}, Epsilon = {agent.epsilon:.3f}")
            else:
                print(f"Episode {ep+1}: Total Reward = {total_reward:.2f}, Epsilon = {agent.epsilon:.3f}")
    print(f"\n---------------- Training completed after {num_episodes} episodes.")
    # Save the trained model for inference
    torch.save(agent.model.state_dict(), model_path)
    print(f"\n---------------- Model saved to {model_path} for later inference.")
    print(f"---------------- Allocating with the saved model: ")
    allocation_summary = allocate_with_existing_model(student_data, env, agent, unit_id,E)
    
    return allocation_summary

def returnEnvAndAgent(student_data, num_classes, target_class_size, target_feature_avgs, E,
                      model_path):
    """
    Initializes the environment & loads a pretrained agent for inference.

    Returns:
      env  -- a reset StudentAllocationEnv
      agent-- a DQNAgent with loaded weights and epsilon=0
    """
    feature_dim = student_data.shape[1]
    state_dim = num_classes * (2 + 2*feature_dim)
    action_dim = num_classes

    # 1) Build environment
    env = StudentAllocationEnv(num_classes,
                               target_class_size,
                               target_feature_avgs,
                               E)
    # reset state
    env.state = env._init_state()

    # 2) Build agent & load weights
    agent = DQNAgent(state_dim, action_dim)
    # load saved model
    checkpoint = torch.load(model_path)
    agent.model.load_state_dict(checkpoint)
    agent.model.eval()
    # deterministic policy
    agent.epsilon = 0.0
    return env, agent


def printSummary(env, target_feature_avgs):
    """
    Prints class counts, actual and target features rounded to 2 decimals.
    """
    feature_dim = target_feature_avgs.shape[1]
    print("\n------------ Final Class Summary:")
    for i, tgt in enumerate(target_feature_avgs):
        cnt = env.state[i]['count']
        if cnt > 0:
            avg = env.state[i]['sum_features'] / cnt
        else:
            avg = np.zeros(feature_dim)
        # round for readability
        avg_rounded = [round(float(x), 2) for x in avg]
        tgt_rounded = [round(float(x), 2) for x in tgt]
        print(
            f"Class {i}: Count = {cnt}, "
            f"AvgFeatures = {avg_rounded}, "
            f"TargetFeatures = {tgt_rounded}"
        )


def allocate_with_existing_model(student_data, env, agent, unit_id,E,target_class_size,target_feature_avgs):
    """
    Runs a single allocation pass with a loaded agent.

    Returns:
      allocations: list of class assignments per student index
    """
    feature_dim = student_data.shape[1]
    # reset environment state
    env.state = env._init_state()

    print(f"\n---------------- Allocating with the saved model: ")
    allocations = []
    idxs = list(range(len(student_data)))
    random.shuffle(idxs)
    for idx in idxs:
        feats = student_data[idx]
        s = state_to_vector(env.state,
                    feature_dim,
                    target_class_size,
                    target_feature_avgs)
        a = agent.act(s)
        allocations.append(a)
        env.step(feats, a, idx)

    allocation_summary = build_allocation_summary(env, env.target_feature_avgs, unit_id,E)
    # print summaries
    printSummary(env, env.target_feature_avgs)
    print_link_summary(env, env.E)

    return allocation_summary
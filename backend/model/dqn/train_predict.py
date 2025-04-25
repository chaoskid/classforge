# train_predict.py
import numpy as np
import math
import random
import torch

from model.dqn.dqn_agent import DQNAgent
from model.dqn.allocation_env import StudentAllocationEnv
from model.dqn.allocation_env import state_to_vector
from model.dqn.allocation_env import precompute_link_matrices

def print_link_summary(env, E):
    """
    Prints per-class existing and predicted link counts in CSV format.
    """
    edge_types = {
    'friends'    : 0,
    'influential': 1,
    'feedback'   : 2,
    'more_time'  : 3,
    'advice'     : 4,
    'disrespect' : 5,
    'no_link'    : 6
}
    # invert edge_types so we can go from integer → string
    rev = {v: k for k, v in edge_types.items()}
    n_labels = len(edge_types)

    # Prepare the ordered list of label names by their integer code
    labels_by_int = [rev[i] for i in range(n_labels)]

    # EXISTING LINKS
    print("Existing Links (CSV Format):")
    # header
    header = "Class," + ",".join(f"existing_label_{i}" for i in range(n_labels))
    print(header)
    # rows
    for cls_idx in range(env.num_classes):
        members = env.state[cls_idx]['student_indices']
        # count existing labels
        existing_counts = {lbl: 0 for lbl in labels_by_int}
        for i in members:
            for j in members:
                if i == j: 
                    continue
                lbl = int(E[i, j])
                existing_counts[ rev.get(lbl, 'no_link') ] += 1

        # build CSV row in order 0..n_labels-1
        row = [ str(existing_counts[ labels_by_int[i] ]) for i in range(n_labels) ]
        print(f"{cls_idx}," + ",".join(row))


def train_and_allocate(num_classes,
                       target_class_size,
                       target_feature_avgs,
                       student_data,
                       E,
                       num_episodes=250,
                       batch_size=32):
    
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

    # final allocation
    env.state = env._init_state()
    allocations = []
    idxs = list(range(len(student_data)))
    random.shuffle(idxs)
    for idx in idxs:
        feats = student_data[idx]
        s = state_to_vector(env.state, feature_dim)
        a = agent.act(s)
        allocations.append(a)
        env.step(feats, a, idx)

    print("\nFinal Class Summary:")
    for i, tgt in enumerate(target_feature_avgs):
        cnt = env.state[i]['count']
        if cnt > 0:
            avg = env.state[i]['sum_features'] / cnt
        else:
            avg = np.zeros(feature_dim)
        
        avg_rounded = [ round(float(x), 2) for x in avg ]
    
        print(
            f"Class {i}: "
            f"Count = {cnt}, "
            f"AvgFeatures= {avg_rounded}, "
            f"TargetFeatures = {np.round(tgt,2).tolist()}"
        )
    print_link_summary(env, E)
    # Save the trained model for inference
    model_path = f"dqn_model.pth"
    torch.save(agent.model.state_dict(), model_path)
    print(f"Model saved to {model_path} for later inference.")
    
    return allocations

def returnEnvAndAgent(student_data, num_classes, target_class_size, target_feature_avgs, E,
                      model_path='dqn_model.pth'):
    """
    Initializes the environment & loads a pretrained agent for inference.

    Returns:
      env  -- a reset StudentAllocationEnv
      agent-- a DQNAgent with loaded weights and epsilon=0
    """
    feature_dim = student_data.shape[1]
    state_dim = num_classes * (feature_dim + 1)
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
    print("\nFinal Class Summary:")
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


def allocate(student_data, env, agent):
    """
    Runs a single allocation pass with a loaded agent.

    Returns:
      allocations: list of class assignments per student index
    """
    feature_dim = student_data.shape[1]
    # reset environment state
    env.state = env._init_state()

    allocations = []
    idxs = list(range(len(student_data)))
    random.shuffle(idxs)
    for idx in idxs:
        feats = student_data[idx]
        s = state_to_vector(env.state, feature_dim)
        a = agent.act(s)
        allocations.append(a)
        env.step(feats, a, idx)

    # print summaries
    printSummary(env, env.target_feature_avgs)
    print_link_summary(env, env.E)

    return allocations
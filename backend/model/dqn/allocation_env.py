import numpy as np
import torch.nn as nn
import torch.nn.functional as F

class StudentAllocationEnv:
    def __init__(self, num_classes, target_class_size, target_feature_avgs, E):
        """
        Now accepts per‐class targets:
        
        - num_classes: Number of classes.
        - target_class_size: Desired size per class.
        - target_feature_avgs: np.array of shape (num_classes, feature_dim)
        - E, P: link matrices as before.
        """
        self.num_classes = num_classes
        self.target_class_size = target_class_size
        self.target_feature_avgs = target_feature_avgs
        self.E = E
        self.state = self._init_state()
    
    def _init_state(self):
        state = []
        for _ in range(self.num_classes):
            state.append({
                'count': 0,
                'sum_features': None,
                'student_indices': []
            })
        return state
    
    def _update_state(self, class_idx, student_features, student_index):
        if self.state[class_idx]['count'] == 0:
            self.state[class_idx]['sum_features'] = np.array(student_features, dtype=np.float32)
        else:
            self.state[class_idx]['sum_features'] += np.array(student_features, dtype=np.float32)
        self.state[class_idx]['count'] += 1
        self.state[class_idx]['student_indices'].append(student_index)
    
    def _get_class_avg(self, class_idx):
        count = self.state[class_idx]['count']
        if count == 0:
            # zero vector of same dim as target_feature_avgs[class_idx]
            return np.zeros_like(self.target_feature_avgs[class_idx])
        return self.state[class_idx]['sum_features'] / count

    def compute_link_reward(self, new_idx, cls, E):
        # unchanged
        positive_reward = 10
        negative_penalty = -1000
        no_link_penalty = -5

        members = self.state[cls]['student_indices']
        if not members:
            return 0.0

        total = 0.0
        for other in members:
            lbl = int(E[new_idx, other])
            if lbl in [0,1,2,3,4]:
                total += positive_reward
            elif lbl == 5:
                total += negative_penalty
            else:
                total += no_link_penalty
        return total / len(members)
    
    def compute_reward(self, student_features, action, student_index):
        # 1) size component
        curr_count = self.state[action]['count']
        new_count = curr_count + 1
        size_diff = abs(new_count - self.target_class_size) / self.target_class_size
        reward_size = -size_diff

        # 2) feature balance against per‐class target
        if curr_count == 0:
            new_avg = np.array(student_features, dtype=np.float32)
        else:
            new_avg = (self.state[action]['sum_features'] +
                       np.array(student_features, dtype=np.float32)) / new_count

        eps = 1e-6
        tgt = self.target_feature_avgs[action]
        norm_tgt = np.linalg.norm(tgt) + eps
        feature_diff = np.linalg.norm(new_avg - tgt) / norm_tgt
        reward_features = -feature_diff

        # 3) link reward
        reward_link = self.compute_link_reward(student_index, action, self.E)
        lambda_link = 1.0
        #print("feature_reward: ", reward_features," new_avg: ",new_avg, "   feature diff: ",np.linalg.norm(new_avg - tgt),"  norm_tgt", norm_tgt)
        return reward_size + 2 * reward_features + lambda_link * reward_link

    def step(self, student_features, action, student_index):
        # if full, huge penalty
        if self.state[action]['count'] >= self.target_class_size:
            return -1000.0, False

        r = self.compute_reward(student_features, action, student_index)
        self._update_state(action, student_features, student_index)
        return r, False


def state_to_vector(state, feature_dim):
    """
    Flattens state into [count, avg_feat…] for each class.
    Needs feature_dim to know how big avg vector is when count=0.
    """
    vec = []
    for c in state:
        cnt = c['count']
        vec.append(cnt)
        if cnt > 0:
            avg = c['sum_features'] / cnt
        else:
            avg = np.zeros(feature_dim)
        vec.extend(avg.tolist())
    return np.array(vec, dtype=np.float32)


def precompute_link_matrices(graph_data):
    num_nodes = graph_data.x.shape[0]
    #E = np.zeros((num_nodes, num_nodes))
    E = np.full((num_nodes, num_nodes), -1, dtype=int)
    for i in range(len(graph_data.edge_index[0])):
        u = int(graph_data.edge_index[0][i])
        v = int(graph_data.edge_index[1][i])
        E[u, v] = int(graph_data.edge_attr[i])

    return E
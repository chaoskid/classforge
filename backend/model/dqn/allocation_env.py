import numpy as np
import torch.nn as nn
import torch.nn.functional as F

class StudentAllocationEnv:
    def __init__(self, num_classes, target_class_size, target_feature_avgs, E):
        """
        Environment for student allocation with per-class targets.

        Args:
          num_classes: number of classes
          target_class_size: desired size per class (scalar)
          target_feature_avgs: np.array of shape (num_classes, feature_dim)
          E: link matrix (N x N) with integer edge labels
        """
        self.num_classes          = num_classes
        self.target_class_size    = target_class_size
        self.target_feature_avgs  = target_feature_avgs
        self.feature_dim          = target_feature_avgs.shape[1]
        self.E                    = E
        self.state                = self._init_state()

    def reset(self):
        """Clears assignment state and returns initial observation vector."""
        self.state = self._init_state()
        return self.get_state()

    def get_state(self):
        """Returns the flattened state vector including counts, avgs, and targets."""
        return state_to_vector(
            self.state,
            self.feature_dim,
            self.target_class_size,
            self.target_feature_avgs
        )

    def _init_state(self):
        return [
            {'count': 0,
             'sum_features': None,
             'student_indices': []}
            for _ in range(self.num_classes)
        ]

    def _update_state(self, class_idx, student_features, student_index):
        if self.state[class_idx]['count'] == 0:
            self.state[class_idx]['sum_features'] = np.array(student_features, dtype=np.float32)
        else:
            self.state[class_idx]['sum_features'] += np.array(student_features, dtype=np.float32)
        self.state[class_idx]['count'] += 1
        self.state[class_idx]['student_indices'].append(student_index)

    def _get_class_avg(self, class_idx):
        c = self.state[class_idx]
        if c['count'] == 0:
            return np.zeros(self.feature_dim, dtype=np.float32)
        return c['sum_features'] / c['count']

    def compute_link_reward(self, new_idx, cls, E):
        # unchanged from before
        positive_reward = 100
        negative_penalty = -700
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
        return total

    def compute_reward(self, student_features, action, student_index):
        # 1) size component
        curr_count = self.state[action]['count']
        new_count  = curr_count + 1
        size_diff  = abs(new_count - self.target_class_size) / self.target_class_size
        reward_size = -size_diff

        # 2) feature balance
        if curr_count == 0:
            new_avg = np.array(student_features, dtype=np.float32)
        else:
            new_avg = (self.state[action]['sum_features'] +
                       np.array(student_features, dtype=np.float32)) / new_count

        eps = 1e-6
        tgt = self.target_feature_avgs[action]
        feature_diff   = np.linalg.norm(new_avg - tgt) / (np.linalg.norm(tgt) + eps)
        reward_features = -feature_diff

        # 3) link reward
        reward_link = self.compute_link_reward(student_index, action, self.E)
        lambda_link = 1.0

        return reward_size + 2 * reward_features + lambda_link * reward_link

    def step(self, student_features, action, student_index):
        """
        Assigns student to a class, updates state, and computes reward.
        Over-fill penalty applied if count exceeds target.
        """
        # base reward
        r = self.compute_reward(student_features, action, student_index)
        # always record assignment
        self._update_state(action, student_features, student_index)
        # over-fill penalty
        if self.state[action]['count'] > self.target_class_size:
            r -= 20000.0
        return r, False


def state_to_vector(state,
                    feature_dim,
                    target_class_size,
                    target_feature_avgs):
    """
    Flattens state into a vector of length num_classes*(2 + 2*feature_dim):
      For each class idx:
        [ raw_count,
          target_class_size,
          avg_feat_1…avg_feat_D,
          target_feat_1…target_feat_D ]
    """
    vec = []
    for cls_idx, c in enumerate(state):
        cnt = c['count']
        # raw count
        vec.append(float(cnt))
        # target size
        vec.append(float(target_class_size))
        # average features
        if cnt > 0:
            avg = c['sum_features'] / cnt
        else:
            avg = np.zeros(feature_dim, dtype=np.float32)
        vec.extend(avg.tolist())
        # target features for this class
        vec.extend(target_feature_avgs[cls_idx].tolist())
    return np.array(vec, dtype=np.float32)


def precompute_link_matrices(graph_data):
    """Builds an (N x N) matrix of edge labels from a PyG Data object."""
    num_nodes = graph_data.x.shape[0]
    E = np.full((num_nodes, num_nodes), -1, dtype=int)
    for i in range(graph_data.edge_index.shape[1]):
        u = int(graph_data.edge_index[0, i])
        v = int(graph_data.edge_index[1, i])
        E[u, v] = int(graph_data.edge_attr[i])
    return E
import torch
from torch_geometric.data import Data
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import RGCNConv

class InductiveRGCN(nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels, num_relations):
        super().__init__()
        # the original RGCN path
        self.conv1 = RGCNConv(in_channels, hidden_channels, num_relations)
        self.conv2 = RGCNConv(hidden_channels, out_channels, num_relations)
        # a pure‐feature MLP path
        self.mlp1  = nn.Linear(in_channels, hidden_channels)
        self.mlp2  = nn.Linear(hidden_channels, out_channels)

    def forward(self, x, edge_index=None, edge_type=None):
        if edge_index is None:
            # ---- inference / distillation time: no graph, just MLP ----
            h = F.relu(self.mlp1(x))
            return self.mlp2(h)

        # ---- training time: full RGCN conv path ----
        h = F.relu(self.conv1(x, edge_index, edge_type))
        h =        self.conv2(h, edge_index, edge_type)
        return h

class LinkPredictor(nn.Module):
    def __init__(self,emb_dim,hidden_dim,num_edge_types):
        super(LinkPredictor, self).__init__()
        output_dim = num_edge_types
        self.fc1 = nn.Linear(2 * emb_dim,hidden_dim)
        self.fc2 = nn.Linear(hidden_dim,output_dim)

    def forward(self, emb_u, emb_v):
        x = torch.concat([emb_u,emb_v], dim=1)
        x= self.fc1(x)
        x = F.relu(x)
        logits = self.fc2(x)
        return logits   
import torch
import torch.nn as nn
import torch.optim as optim
import random
from collections import deque

class DQN(nn.Module):
    def __init__(self, state_dim, action_dim):
        """
        state_dim: Dimension of the flattened state vector.
        action_dim: Number of possible actions (classes).
        """
        super(DQN, self).__init__()
        self.fc1 = nn.Linear(state_dim, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, action_dim)
    
    def forward(self, x):
        """
        Forward pass: Returns a tensor of shape (batch_size, action_dim) representing Q-values.
        """
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

class DQNAgent:
    def __init__(self, state_dim, action_dim, lr=0.001, gamma=0.9, epsilon=0.2, epsilon_decay=0.999, min_epsilon=0.01):
        """
        Initializes the DQN agent.
        
        Parameters:
          state_dim: Dimension of the state vector.
          action_dim: Number of discrete actions (classes).
          lr: Learning rate.
          gamma: Discount factor.
          epsilon: Initial exploration rate.
          epsilon_decay: Factor by which epsilon decays.
          min_epsilon: Minimum exploration rate.
        """
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.min_epsilon = min_epsilon
        self.lr = lr
        self.model = DQN(state_dim, action_dim)
        self.optimizer = optim.Adam(self.model.parameters(), lr=self.lr)
        self.criterion = nn.MSELoss()
        self.memory = deque(maxlen=10000)
    
    def remember(self, state, action, reward, next_state, done):
        """Stores a transition (state, action, reward, next_state, done) in replay memory."""
        self.memory.append((state, action, reward, next_state, done))
    
    def act(self, state):
        """
        Selects an action using an epsilon-greedy policy.
        Returns an integer in [0, action_dim-1].
        """
        if random.random() < self.epsilon:
            return random.randrange(self.action_dim)
        state_tensor = torch.FloatTensor(state).unsqueeze(0)  # add batch dimension
        with torch.no_grad():
            q_values = self.model(state_tensor)
        return int(torch.argmax(q_values).item())
    
    def replay(self, batch_size):
        """
        Samples a random mini-batch from replay memory and trains the network.
        """
        if len(self.memory) < batch_size:
            return
        batch = random.sample(self.memory, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        states = torch.FloatTensor(states)
        actions = torch.LongTensor(actions).unsqueeze(1)
        rewards = torch.FloatTensor(rewards).unsqueeze(1)
        next_states = torch.FloatTensor(next_states)
        dones = torch.FloatTensor(dones).unsqueeze(1)
        
        current_q = self.model(states).gather(1, actions)
        next_q = self.model(next_states).max(1)[0].unsqueeze(1)
        target_q = rewards + self.gamma * next_q * (1 - dones)
        
        loss = self.criterion(current_q, target_q.detach())
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        if self.epsilon > self.min_epsilon:
            self.epsilon *= self.epsilon_decay
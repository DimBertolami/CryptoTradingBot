import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Tuple, Optional, Union
import numpy as np
from .utils import validate_tensor, ValidationError, logger

class DQNNetwork(nn.Module):
    """Enhanced DQN Network with validation and safety features"""
    
    def __init__(self, input_size: int, hidden_size: int, output_size: int):
        super(DQNNetwork, self).__init__()
        self._validate_init_params(input_size, hidden_size, output_size)
        
        self.input_size = input_size
        self.output_size = output_size
        
        # Initialize layers with Xavier/Glorot initialization
        self.layers = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),  # Add dropout for regularization
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, output_size)
        )
        
        self._init_weights()
        
    def _validate_init_params(self, input_size: int, hidden_size: int, output_size: int) -> None:
        """Validate initialization parameters"""
        if not all(isinstance(x, int) and x > 0 for x in [input_size, hidden_size, output_size]):
            raise ValidationError("All sizes must be positive integers")
        
        if input_size > 1000 or hidden_size > 1000 or output_size > 100:
            raise ValidationError("Network sizes are suspiciously large")
    
    def _init_weights(self) -> None:
        """Initialize network weights with Xavier/Glorot initialization"""
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                nn.init.zeros_(module.bias)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass with input validation and gradient clipping"""
        try:
            # Validate input
            validate_tensor(x, (x.size(0), self.input_size), "Input")
            
            # Forward pass with gradient clipping
            for layer in self.layers:
                if isinstance(layer, nn.Linear):
                    x = layer(x)
                    torch.nn.utils.clip_grad_norm_(layer.parameters(), max_norm=1.0)
                else:
                    x = layer(x)
            
            # Validate output
            validate_tensor(x, (x.size(0), self.output_size), "Output")
            
            return x
            
        except Exception as e:
            logger.error(f"Forward pass failed: {str(e)}")
            raise
    
    def predict(self, state: np.ndarray) -> Tuple[int, float]:
        """Make prediction with error handling and confidence score"""
        try:
            self.eval()  # Set to evaluation mode
            with torch.no_grad():
                state_tensor = torch.FloatTensor(state).unsqueeze(0)
                q_values = self(state_tensor)
                
                # Get action and confidence
                action = q_values.argmax(1).item()
                confidence = F.softmax(q_values, dim=1)[0][action].item()
                
                return action, confidence
                
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            # Return safe default values
            return 0, 0.0  # Action 0 (hold) with zero confidence
        finally:
            self.train()  # Set back to training mode
    
    def get_gradient_norms(self) -> Dict[str, float]:
        """Monitor gradient norms for debugging"""
        norms = {}
        for name, param in self.named_parameters():
            if param.grad is not None:
                norms[name] = param.grad.norm().item()
        return norms

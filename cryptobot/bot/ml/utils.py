import logging
import numpy as np
from typing import Any, Dict, Optional
import torch
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trading_bot.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('trading_bot')

class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass

def validate_tensor(tensor: torch.Tensor, shape: tuple, name: str) -> None:
    """Validate tensor shape and content"""
    if not isinstance(tensor, torch.Tensor):
        raise ValidationError(f"{name} must be a torch.Tensor")
    if tensor.shape != shape:
        raise ValidationError(f"{name} shape must be {shape}, got {tensor.shape}")
    if torch.isnan(tensor).any():
        raise ValidationError(f"{name} contains NaN values")
    if torch.isinf(tensor).any():
        raise ValidationError(f"{name} contains infinite values")

def validate_network_input(state: np.ndarray, expected_size: int) -> None:
    """Validate network input state"""
    if not isinstance(state, np.ndarray):
        raise ValidationError("State must be a numpy array")
    if state.size != expected_size:
        raise ValidationError(f"State size must be {expected_size}, got {state.size}")
    if np.isnan(state).any():
        raise ValidationError("State contains NaN values")
    if np.isinf(state).any():
        raise ValidationError("State contains infinite values")

class ExperienceBuffer:
    """Thread-safe experience replay buffer with validation"""
    def __init__(self, max_size: int = 10000):
        self.buffer = []
        self.max_size = max_size
        self._lock = threading.Lock()

    def add(self, experience: tuple) -> None:
        """Add experience to buffer with validation"""
        if len(experience) != 5:
            raise ValidationError("Experience must be a tuple of (state, action, reward, next_state, done)")
        
        with self._lock:
            self.buffer.append(experience)
            if len(self.buffer) > self.max_size:
                self.buffer.pop(0)

    def sample(self, batch_size: int) -> list:
        """Sample experiences from buffer with validation"""
        if batch_size > len(self.buffer):
            raise ValidationError(f"Requested batch size {batch_size} larger than buffer size {len(self.buffer)}")
        
        with self._lock:
            return random.sample(self.buffer, batch_size)

    def __len__(self) -> int:
        return len(self.buffer)

class ModelCheckpoint:
    """Handle model checkpointing with validation"""
    def __init__(self, base_path: str):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)

    def save(self, model_state: Dict[str, Any], metrics: Dict[str, float], step: int) -> str:
        """Save model checkpoint with validation"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"checkpoint_{step}_{timestamp}.pt"
        path = os.path.join(self.base_path, filename)
        
        # Validate model state
        required_keys = {'policy_net_state_dict', 'target_net_state_dict', 
                        'optimizer_state_dict', 'training_step', 'epsilon'}
        if not all(key in model_state for key in required_keys):
            raise ValidationError(f"Model state missing required keys: {required_keys}")

        try:
            torch.save({
                **model_state,
                'metrics': metrics,
                'timestamp': timestamp
            }, path)
            logger.info(f"Saved checkpoint to {path}")
            return path
        except Exception as e:
            logger.error(f"Failed to save checkpoint: {str(e)}")
            raise

    def load(self, path: str) -> Dict[str, Any]:
        """Load model checkpoint with validation"""
        if not os.path.exists(path):
            raise ValidationError(f"Checkpoint file not found: {path}")

        try:
            checkpoint = torch.load(path)
            logger.info(f"Loaded checkpoint from {path}")
            return checkpoint
        except Exception as e:
            logger.error(f"Failed to load checkpoint: {str(e)}")
            raise

"""
Data Persistence Manager for trading bot
Handles state saving, backup, recovery, and validation
"""

import os
import json
import logging
import shutil
from datetime import datetime
import hashlib
from typing import Dict, Optional, List
import time

logger = logging.getLogger("persistence_manager")

class PersistenceManager:
    def __init__(self, config: Dict):
        """Initialize Persistence Manager"""
        self.config = config
        self.state_dir = config.get('state_dir', 'trading_data')
        self.backup_dir = config.get('backup_dir', 'trading_data/backups')
        self.max_backups = config.get('max_backups', 10)
        self.cleanup_interval = config.get('cleanup_interval', 86400)  # 24 hours
        self.last_cleanup = time.time()
        
        # Create directories if they don't exist
        os.makedirs(self.state_dir, exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
        
        # Initialize state files
        self.state_files = {
            'trading_state': 'paper_trading_state.json',
            'config': 'trading_config.json',
            'api_keys': 'api_keys.json',
            'risk_metrics': 'risk_metrics.json'
        }
        
    def save_state(self, state: Dict, state_type: str) -> bool:
        """
        Save trading state to disk
        Returns True if successful, False otherwise
        """
        try:
            # Get the correct file name
            if state_type not in self.state_files:
                logger.error(f"Unknown state type: {state_type}")
                return False
                
            file_path = os.path.join(self.state_dir, self.state_files[state_type])
            
            # Validate state data
            if not self._validate_state(state, state_type):
                logger.error(f"Invalid state data for {state_type}")
                return False
                
            # Add metadata
            state['metadata'] = {
                'timestamp': datetime.now().isoformat(),
                'version': self.config.get('version', '1.0.0'),
                'hash': self._calculate_hash(state)
            }
            
            # Write to temporary file first
            temp_path = file_path + '.tmp'
            with open(temp_path, 'w') as f:
                json.dump(state, f, indent=2, sort_keys=True)
            
            # Atomically replace the original file
            shutil.move(temp_path, file_path)
            
            # Create backup
            self._create_backup(file_path, state_type)
            
            # Clean up old backups if needed
            self._cleanup_old_backups()
            
            logger.info(f"Saved {state_type} state successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error saving {state_type} state: {str(e)}")
            return False
            
    def load_state(self, state_type: str) -> Optional[Dict]:
        """
        Load trading state from disk
        Returns None if state is invalid or doesn't exist
        """
        try:
            if state_type not in self.state_files:
                logger.error(f"Unknown state type: {state_type}")
                return None
                
            file_path = os.path.join(self.state_dir, self.state_files[state_type])
            
            if not os.path.exists(file_path):
                logger.info(f"No existing {state_type} state found")
                return None
                
            with open(file_path, 'r') as f:
                state = json.load(f)
                
            # Validate loaded state
            if not self._validate_state(state, state_type):
                logger.error(f"Invalid {state_type} state found")
                return None
                
            logger.info(f"Loaded {state_type} state successfully")
            return state
            
        except Exception as e:
            logger.error(f"Error loading {state_type} state: {str(e)}")
            return None
            
    def _validate_state(self, state: Dict, state_type: str) -> bool:
        """Validate state data before saving/loading"""
        try:
            # Basic validation
            if not isinstance(state, dict):
                return False
                
            # Type-specific validation
            if state_type == 'trading_state':
                required_keys = ['balance', 'holdings', 'trade_history']
                if not all(key in state for key in required_keys):
                    return False
                    
                # Validate numerical values
                if not isinstance(state['balance'], (int, float)):
                    return False
                    
                # Validate holdings format
                if not all(isinstance(v, (int, float)) for v in state['holdings'].values()):
                    return False
                    
            elif state_type == 'config':
                required_keys = ['symbols', 'trading_interval', 'mode']
                if not all(key in state for key in required_keys):
                    return False
                    
            # Add more type-specific validations as needed
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating {state_type} state: {str(e)}")
            return False
            
    def _create_backup(self, file_path: str, state_type: str) -> None:
        """Create a backup of the state file"""
        try:
            # Create timestamped backup
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = os.path.join(
                self.backup_dir,
                f"{state_type}_backup_{timestamp}.json"
            )
            
            # Copy file to backup location
            shutil.copy2(file_path, backup_path)
            logger.info(f"Created backup: {backup_path}")
            
        except Exception as e:
            logger.error(f"Error creating backup for {state_type}: {str(e)}")
            
    def _cleanup_old_backups(self) -> None:
        """Clean up old backups if they exceed max count"""
        try:
            # Only run cleanup every 24 hours
            current_time = time.time()
            if current_time - self.last_cleanup < self.cleanup_interval:
                return
                
            # Get list of backup files
            backup_files = []
            for state_type in self.state_files:
                backup_dir = os.path.join(self.backup_dir, f"{state_type}_backup_")
                backup_files.extend([
                    f for f in os.listdir(self.backup_dir)
                    if f.startswith(backup_dir)
                ])
                
            # Sort by modification time and keep only the newest ones
            backup_files.sort(key=lambda x: os.path.getmtime(os.path.join(self.backup_dir, x)))
            
            if len(backup_files) > self.max_backups:
                # Remove oldest backups
                for file in backup_files[:-self.max_backups]:
                    os.remove(os.path.join(self.backup_dir, file))
                    logger.info(f"Removed old backup: {file}")
                    
            self.last_cleanup = current_time
            
        except Exception as e:
            logger.error(f"Error cleaning up old backups: {str(e)}")
            
    def _calculate_hash(self, data: Dict) -> str:
        """Calculate SHA-256 hash of state data"""
        try:
            # Convert to string and encode
            json_str = json.dumps(data, sort_keys=True)
            encoded = json_str.encode('utf-8')
            
            # Calculate hash
            return hashlib.sha256(encoded).hexdigest()
            
        except Exception as e:
            logger.error(f"Error calculating hash: {str(e)}")
            return ""
            
    def get_latest_backup(self, state_type: str) -> Optional[str]:
        """Get path to latest backup for a state type"""
        try:
            backups = [
                f for f in os.listdir(self.backup_dir)
                if f.startswith(f"{state_type}_backup_")
            ]
            
            if not backups:
                return None
                
            # Sort by modification time and return newest
            backups.sort(key=lambda x: os.path.getmtime(os.path.join(self.backup_dir, x)))
            return os.path.join(self.backup_dir, backups[-1])
            
        except Exception as e:
            logger.error(f"Error getting latest backup: {str(e)}")
            return None
            
    def recover_from_backup(self, state_type: str) -> bool:
        """Recover state from the latest backup"""
        try:
            backup_path = self.get_latest_backup(state_type)
            if not backup_path:
                logger.error(f"No backup found for {state_type}")
                return False
                
            # Get target file path
            target_path = os.path.join(self.state_dir, self.state_files[state_type])
            
            # Copy backup to target location
            shutil.copy2(backup_path, target_path)
            logger.info(f"Recovered {state_type} from backup: {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error recovering {state_type} from backup: {str(e)}")
            return False

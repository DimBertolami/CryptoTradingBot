"""
Data Persistence configuration settings
"""

class PersistenceConfig:
    # State Directory Configuration
    STATE_DIR = 'trading_data'
    BACKUP_DIR = 'trading_data/backups'
    
    # Backup Settings
    MAX_BACKUPS = 10  # Keep last 10 backups
    BACKUP_INTERVAL = 3600  # Backup every hour
    CLEANUP_INTERVAL = 86400  # Clean up old backups every 24 hours
    
    # State Files
    STATE_FILES = {
        'trading_state': 'paper_trading_state.json',
        'config': 'trading_config.json',
        'api_keys': 'api_keys.json',
        'risk_metrics': 'risk_metrics.json',
        'trade_history': 'trade_history.json',
        'performance_metrics': 'performance_metrics.json'
    }
    
    # Data Validation
    VALIDATION_INTERVAL = 300  # Validate data every 5 minutes
    MAX_VALIDATION_ERRORS = 5  # Maximum allowed validation errors before shutdown
    
    # Error Handling
    MAX_RETRIES = 3  # Maximum retry attempts for failed operations
    RETRY_DELAY = 5  # Delay between retries in seconds
    
    # Logging
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'persistence.log'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Recovery Settings
    AUTO_RECOVERY = True  # Enable automatic recovery from backup
    RECOVERY_DELAY = 60  # Delay before attempting recovery in seconds
    MAX_RECOVERY_ATTEMPTS = 3  # Maximum recovery attempts
    
    # State Versioning
    VERSION = '1.0.0'
    BACKUP_VERSION_PREFIX = 'v1_'  # Prefix for versioned backups
    
    # Data Integrity
    ENABLE_HASHING = True  # Enable data integrity checking
    HASH_ALGORITHM = 'sha256'  # Hash algorithm for data integrity
    
    # Backup Naming
    TIMESTAMP_FORMAT = '%Y%m%d_%H%M%S'  # Format for backup timestamps
    BACKUP_PREFIX = 'backup_'  # Prefix for backup files
    
    # State Cleanup
    MAX_STATE_AGE = 86400  # Maximum age of state data in seconds (24 hours)
    CLEANUP_THRESHOLD = 0.5  # Clean up if disk usage exceeds this percentage
    
    # Recovery Priority
    RECOVERY_PRIORITY = [
        'trading_state',  # Most important - current trading state
        'config',        # Configuration settings
        'api_keys',      # API authentication
        'trade_history'  # Historical trades
    ]

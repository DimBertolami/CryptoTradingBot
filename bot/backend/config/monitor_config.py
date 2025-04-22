"""
Monitoring configuration settings
"""

class MonitorConfig:
    # Monitoring Intervals
    CHECK_INTERVAL = 60  # Check every minute
    ALERT_INTERVAL = 300  # Send alerts every 5 minutes
    METRICS_RETENTION = 86400  # Keep metrics for 24 hours
    
    # Health Checks
    HEALTH_CHECKS = {
        'api': {
            'timeout': 5,  # 5 second timeout
            'max_retries': 3,
            'retry_delay': 2
        },
        'memory': {
            'warning_threshold': 80,  # %
            'critical_threshold': 90
        },
        'disk': {
            'warning_threshold': 85,  # %
            'critical_threshold': 95
        },
        'cpu': {
            'warning_threshold': 80,  # %
            'critical_threshold': 90
        }
    }
    
    # Performance Metrics
    PERFORMANCE_METRICS = {
        'latency': {
            'warning_threshold': 500,  # ms
            'critical_threshold': 1000
        },
        'success_rate': {
            'warning_threshold': 95,  # %
            'critical_threshold': 90
        },
        'api_response_times': {
            'warning_threshold': 200,  # ms
            'critical_threshold': 500
        }
    }
    
    # Error Monitoring
    ERROR_THRESHOLDS = {
        'api': {
            'max_errors': 5,
            'time_window': 300  # 5 minutes
        },
        'trade': {
            'max_errors': 3,
            'time_window': 600  # 10 minutes
        },
        'system': {
            'max_errors': 10,
            'time_window': 600  # 10 minutes
        }
    }
    
    # Alert Configuration
    ALERT_METHODS = {
        'email': {
            'enabled': True,
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'email_from': 'tradingbot@yourdomain.com',
            'email_to': 'admin@yourdomain.com',
            'subject_prefix': '[TRADING BOT]'
        },
        'slack': {
            'enabled': True,
            'webhook_url': 'https://hooks.slack.com/services/...',
            'channel': '#trading-bot-alerts',
            'username': 'Trading Bot'
        },
        'telegram': {
            'enabled': True,
            'bot_token': 'YOUR_TELEGRAM_BOT_TOKEN',
            'chat_id': 'YOUR_CHAT_ID',
            'message_prefix': '[TRADING BOT]'
        }
    }
    
    # Alert Priorities
    ALERT_PRIORITIES = {
        'critical': {
            'channels': ['email', 'slack', 'telegram'],
            'thresholds': {
                'health': 90,  # %
                'performance': 95,  # %
                'errors': 5  # count
            }
        },
        'warning': {
            'channels': ['slack', 'telegram'],
            'thresholds': {
                'health': 80,  # %
                'performance': 90,  # %
                'errors': 3  # count
            }
        },
        'info': {
            'channels': ['telegram'],
            'thresholds': {
                'health': 70,  # %
                'performance': 85,  # %
                'errors': 1  # count
            }
        }
    }
    
    # Logging Configuration
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'monitor.log'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Metrics Storage
    METRICS_STORAGE = {
        'type': 'file',  # or 'database'
        'path': 'monitoring/metrics.json',
        'max_size': 10485760,  # 10MB
        'compression': True
    }
    
    # Alert Suppression
    ALERT_SUPPRESSION = {
        'window': 3600,  # 1 hour
        'max_alerts': 5,
        'reset_interval': 86400  # 24 hours
    }
    
    # Recovery Actions
    RECOVERY_ACTIONS = {
        'restart_service': True,
        'notify_admin': True,
        'create_ticket': False,
        'escalation_delay': 300  # 5 minutes
    }
    
    # Monitoring Endpoints
    ENDPOINTS = {
        'health': '/health',
        'metrics': '/metrics',
        'alerts': '/alerts',
        'status': '/status'
    }
    
    # Security
    SECURITY = {
        'api_key_required': True,
        'rate_limit': 100,  # requests per minute
        'ip_whitelist': [],
        'encryption_enabled': True
    }

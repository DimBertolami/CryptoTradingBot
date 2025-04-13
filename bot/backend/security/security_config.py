import os
from typing import Dict, Any


class SecurityConfig:
    def __init__(self):
        self._config = {
            "api": {
                "jwt_secret": os.getenv("JWT_SECRET", "your-secret-key-here"),
                "token_expiration": 3600,  # 1 hour
                "rate_limit": {
                    "window": 60,  # seconds
                    "max_requests": 100
                }
            },
            "cors": {
                "allowed_origins": ["http://localhost:3000", "https://localhost:3000"],
                "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allowed_headers": ["Content-Type", "Authorization", "X-Requested-With"]
            },
            "encryption": {
                "algorithm": "AES-256-CBC",
                "key_length": 32,
                "iv_length": 16
            },
            "file_permissions": {
                "config_files": 0o640,
                "log_files": 0o640,
                "data_files": 0o640
            },
            "logging": {
                "level": "INFO",
                "max_file_size": 10485760,  # 10MB
                "backup_count": 5
            }
        }

    def get_config(self) -> Dict[str, Any]:
        return self._config

    def get_api_config(self) -> Dict[str, Any]:
        return self._config["api"]

    def get_cors_config(self) -> Dict[str, Any]:
        return self._config["cors"]

    def get_encryption_config(self) -> Dict[str, Any]:
        return self._config["encryption"]

    def get_file_permissions(self) -> Dict[str, Any]:
        return self._config["file_permissions"]

    def get_logging_config(self) -> Dict[str, Any]:
        return self._config["logging"]

# Singleton instance
security_config = SecurityConfig()

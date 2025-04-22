"""
Security configuration settings
"""

class SecurityConfig:
    # Rate limiting
    MAX_REQUESTS_PER_MINUTE = 120
    RATE_LIMIT_WINDOW = 60  # seconds
    
    # API key validation
    MIN_API_KEY_LENGTH = 20
    MIN_API_SECRET_LENGTH = 30
    
    # Error handling
    MAX_ERROR_LOGS = 1000
    ERROR_LOG_RETENTION_DAYS = 30
    
    # Signature validation
    SIGNATURE_ALGORITHM = 'sha256'
    SIGNATURE_EXPIRATION = 300  # seconds
    
    # Security headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'"
    }
    
    # IP blocking
    MAX_FAILED_ATTEMPTS = 5
    BLOCK_DURATION = 3600  # seconds
    
    # Logging
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'security.log'
    
    # Cache settings
    CACHE_TTL = 300  # seconds
    MAX_CACHE_SIZE = 1000
    
    # API versioning
    API_VERSION = '1.0.0'
    VERSION_HEADER = 'X-API-Version'
    
    # Response headers
    RESPONSE_HEADERS = {
        'X-API-Version': API_VERSION,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
    
    # Request validation
    MAX_REQUEST_SIZE = 1024 * 1024  # 1MB
    ALLOWED_CONTENT_TYPES = ['application/json']
    
    # Rate limiting exceptions
    WHITELISTED_IPS = []  # IPs that bypass rate limiting
    WHITELISTED_ROUTES = ['/health', '/version']  # Routes that bypass rate limiting
    
    # Security audit settings
    AUDIT_LOG_ENABLED = True
    AUDIT_LOG_FILE = 'audit.log'
    AUDIT_LOG_RETENTION_DAYS = 90

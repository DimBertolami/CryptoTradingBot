"""
API Security module for handling authentication, rate limiting, and error handling
"""

import os
import time
import hashlib
import hmac
from typing import Dict, Optional
from datetime import datetime
import logging
from functools import wraps
from flask import request, jsonify

logger = logging.getLogger("api_security")

class APISecurity:
    def __init__(self):
        self.rate_limits = {}  # Store rate limits per IP
        self.max_requests_per_minute = 120  # Default rate limit
        self.api_key_cache = {}  # Cache for API key validation
        self.last_cleanup = time.time()
        
    def _cleanup_old_entries(self):
        """Cleanup old rate limit entries"""
        current_time = time.time()
        if current_time - self.last_cleanup > 300:  # Cleanup every 5 minutes
            self.rate_limits = {
                ip: count for ip, count in self.rate_limits.items()
                if current_time - self.rate_limits[ip]['timestamp'] < 60
            }
            self.last_cleanup = current_time

    def _validate_api_key(self, api_key: str, api_secret: str) -> bool:
        """Validate API key and secret"""
        # In a real implementation, this would check against a secure storage
        # For now, we'll use a simple validation
        if not api_key or not api_secret:
            return False
            
        # Check if in cache
        cache_key = f"{api_key}:{api_secret}"
        if cache_key in self.api_key_cache:
            return True
            
        # Validate API key format (basic validation)
        if len(api_key) < 20 or len(api_secret) < 30:
            return False
            
        # Add to cache for 5 minutes
        self.api_key_cache[cache_key] = time.time() + 300
        return True

    def _check_rate_limit(self, ip: str) -> bool:
        """Check if IP has exceeded rate limit"""
        current_time = time.time()
        
        if ip not in self.rate_limits:
            self.rate_limits[ip] = {
                'count': 1,
                'timestamp': current_time
            }
            return True
            
        # Check if we need to reset the counter
        if current_time - self.rate_limits[ip]['timestamp'] > 60:
            self.rate_limits[ip] = {
                'count': 1,
                'timestamp': current_time
            }
            return True
            
        # Check if we've exceeded the limit
        if self.rate_limits[ip]['count'] >= self.max_requests_per_minute:
            return False
            
        # Increment counter
        self.rate_limits[ip]['count'] += 1
        return True

    def require_api_key(self, f):
        """Decorator to require API key authentication"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Get API credentials from headers or query parameters
                api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
                api_secret = request.headers.get('X-API-Secret') or request.args.get('api_secret')
                
                if not api_key or not api_secret:
                    return jsonify({
                        'error': 'API key and secret are required'
                    }), 401
                    
                # Validate API key
                if not self._validate_api_key(api_key, api_secret):
                    return jsonify({
                        'error': 'Invalid API credentials'
                    }), 401
                    
                # Check rate limit
                ip = request.remote_addr
                if not self._check_rate_limit(ip):
                    return jsonify({
                        'error': 'Rate limit exceeded. Please wait a minute.'
                    }), 429
                    
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"API security error: {str(e)}")
                return jsonify({
                    'error': 'Internal server error'
                }), 500
                
        return decorated_function

    def handle_api_error(self, f):
        """Decorator to handle API errors gracefully"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                return f(*args, **kwargs)
                
            except Exception as e:
                error_type = type(e).__name__
                error_msg = str(e)
                logger.error(f"API error - Type: {error_type}, Message: {error_msg}")
                
                # Map error types to HTTP status codes
                status_code = 500
                if isinstance(e, ValueError):
                    status_code = 400
                elif isinstance(e, KeyError):
                    status_code = 400
                elif isinstance(e, PermissionError):
                    status_code = 403
                
                return jsonify({
                    'error': error_type,
                    'message': error_msg,
                    'timestamp': datetime.now().isoformat()
                }), status_code
                
        return decorated_function

    def validate_signature(self, payload: Dict, signature: str, secret: str) -> bool:
        """Validate request signature"""
        try:
            # Create message from payload
            message = json.dumps(payload, sort_keys=True)
            
            # Create HMAC signature
            hmac_obj = hmac.new(
                secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            )
            
            # Compare signatures
            return hmac.compare_digest(
                hmac_obj.hexdigest(),
                signature.lower()
            )
            
        except Exception as e:
            logger.error(f"Signature validation error: {str(e)}")
            return False

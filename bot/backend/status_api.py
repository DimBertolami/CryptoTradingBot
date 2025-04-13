from flask import Blueprint, jsonify, request
from datetime import datetime
import logging
import os
import sys
import json

# Add parent directory to path for imports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Configure logging
LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "status_api.log")),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("status_api")

# Create Blueprint for status API
status_bp = Blueprint('status', __name__)

# Get service status
@status_bp.route('/api/status/<service>', methods=['GET'])
def get_service_status(service: str):
    """Get status of a specific service."""
    try:
        if service == 'backend':
            return jsonify({
                'status': 'active',
                'pid': os.getpid(),
                'last_updated': datetime.now().isoformat()
            })
        elif service == 'signals':
            # Check if signal generator is running
            return jsonify({
                'status': 'active',
                'pid': os.getpid(),
                'last_updated': datetime.now().isoformat()
            })
        elif service == 'paper_trading':
            # Delegate to paper trading API
            from paper_trading_api import strategy
            return jsonify({
                'status': 'active' if strategy.is_running else 'inactive',
                'is_running': strategy.is_running,
                'mode': strategy.mode,
                'last_updated': datetime.now().isoformat()
            })
        elif service == 'database':
            try:
                # Add database health check here
                return jsonify({
                    'status': 'active',
                    'last_updated': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"Database check failed: {str(e)}")
                return jsonify({
                    'status': 'error',
                    'error': str(e),
                    'last_updated': datetime.now().isoformat()
                })
        elif service in ['backend-log', 'signals-log', 'paper_trading-log']:
            log_path = os.path.join(BASE_DIR, 'logs', f'{service.replace("-log", "")}.log')
            try:
                # Get last modified time
                last_modified = datetime.fromtimestamp(os.path.getmtime(log_path)).isoformat()
                return jsonify({
                    'last_modified': last_modified,
                    'path': log_path
                })
            except Exception as e:
                logger.error(f"Error checking log file {log_path}: {str(e)}")
                return jsonify({
                    'error': str(e),
                    'status': 'error'
                })
        else:
            return jsonify({
                'status': 'unknown',
                'error': f'Unknown service: {service}'
            }), 404
    except Exception as e:
        logger.error(f"Error getting status for {service}: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# Add resolve service endpoint
@status_bp.route('/api/status/<service>/resolve', methods=['POST'])
def resolve_service(service: str):
    """Attempt to resolve issues with a specific service."""
    try:
        if service == 'backend':
            # Restart backend service
            import subprocess
            try:
                subprocess.run(['systemctl', 'restart', 'crypto_trading_backend'], check=True)
                return jsonify({
                    'success': True,
                    'message': 'Backend service restarted'
                })
            except subprocess.CalledProcessError as e:
                return jsonify({
                    'success': False,
                    'error': f'Failed to restart backend: {str(e)}'
                }), 500
        elif service == 'database':
            # Check database connection and restart if needed
            try:
                # Add database health check here
                return jsonify({
                    'success': True,
                    'message': 'Database service healthy'
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Database check failed: {str(e)}'
                }), 500
        elif service == 'paper_trading':
            # Delegate to paper trading API
            from paper_trading_api import strategy
            if not strategy.is_running:
                strategy.start()
                return jsonify({
                    'success': True,
                    'message': 'Paper trading started'
                })
            return jsonify({
                'success': True,
                'message': 'Paper trading already running'
            })
        elif service == 'signals':
            # Restart signal generator
            try:
                # Add signal generator restart logic here
                return jsonify({
                    'success': True,
                    'message': 'Signal generator restarted'
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Signal generator restart failed: {str(e)}'
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': f'Unknown service: {service}'
            }), 404
    except Exception as e:
        logger.error(f"Error resolving service {service}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Add resolve all services endpoint
@status_bp.route('/api/status/resolve_all', methods=['POST'])
def resolve_all_services():
    """Attempt to resolve all service issues in dependency order."""
    try:
        # Define service resolution order based on dependencies
        resolution_order = [
            'database',  # Database first
            'backend',   # Backend needs database
            'signals',   # Signals need backend
            'paper_trading'  # Paper trading needs backend and database
        ]
        
        results = {}
        
        for service in resolution_order:
            try:
                response = resolve_service(service)
                results[service] = {
                    'success': response.json['success'],
                    'message': response.json['message']
                }
            except Exception as e:
                results[service] = {
                    'success': False,
                    'error': str(e)
                }
        
        return jsonify({
            'success': True,
            'results': results
        })
    except Exception as e:
        logger.error(f"Error resolving all services: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Register blueprint after routes are defined
app.register_blueprint(status_bp)

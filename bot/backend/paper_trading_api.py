#!/usr/bin/env python3
"""
Paper Trading API Handler
This script provides API endpoints for the frontend to interact with the paper trading system.
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS

# Add parent directory to path for imports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Import PaperTradingStrategy
from strategies.paper_trading import PaperTradingStrategy

# Configure logging
LOG_DIR = os.path.join(BASE_DIR, 'logs')

# Create logs directory if it doesn't exist
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "paper_trading_api.log")),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("paper_trading_api")

# Create Blueprint for paper trading API
paper_trading_bp = Blueprint('paper_trading', __name__)

# Create Flask app
app = Flask(__name__)

# Initialize the paper trading strategy
config_file = os.path.join(BASE_DIR, 'frontend/trading_data/trading_config.json')
strategy = PaperTradingStrategy(config_file=config_file)

# Initialize strategy instance
trading_thread = None
last_status_update = None

# Path for storing the status JSON
status_file = os.path.join(BASE_DIR, 'frontend/public/trading_data/paper_trading_state.json')

# Create an initial status file if it doesn't exist
if not os.path.exists(status_file):
    update_status_file()

def update_status_file():
    """Update the status JSON file for the frontend"""
    global last_status_update
    
    try:
        status = {
            'is_running': strategy.is_running,
            'mode': strategy.mode,
            'balance': strategy.balance,
            'holdings': strategy.holdings,
            'base_currency': strategy.base_currency,
            'portfolio_value': strategy.calculate_portfolio_value(),
            'performance': strategy.calculate_performance_metrics(),
            'trade_history': strategy.trade_history,
            'last_prices': strategy.last_prices,
            'last_updated': datetime.now().isoformat(),
            'api_keys_configured': bool(strategy.config.get('api_key') and strategy.config.get('api_secret')),
            'api_keys_valid': strategy.validate_api_keys(),
            'auto_execute_suggested_trades': strategy.auto_execute_suggested_trades,
            'min_confidence_threshold': strategy.min_confidence_threshold,
            'suggested_trade_refresh_interval': strategy.suggested_trade_refresh_interval
        }
        
        os.makedirs(os.path.dirname(status_file), exist_ok=True)
        with open(status_file, 'w') as f:
            json.dump(status, f, indent=2)
        
        last_status_update = datetime.now()
        logger.info(f"Status file updated at {last_status_update.isoformat()}")
        
    except Exception as e:
        logger.error(f"Error updating status file: {str(e)}")

def get_status():
    """Get the current paper trading status."""
    try:
        if not strategy:
            return jsonify({
                'success': False,
                'message': 'Paper trading strategy not initialized'
            }), 500
            
        # Get API key status
        api_key = strategy.config.get('api_key', '')
        api_secret = strategy.config.get('api_secret', '')
        keys_configured = bool(api_key and api_secret)
        
        # Simple validation - in a real app you'd want to verify with the actual API
        keys_valid = False
        if keys_configured:
            try:
                keys_valid = (len(api_key) >= 20 and len(api_secret) >= 30)
            except Exception as e:
                logger.error(f"Error validating API keys: {e}")
                
        status_data = {
            'is_running': strategy.is_running,
            'mode': strategy.mode,
            'balance': strategy.balance,
            'holdings': strategy.holdings,
            'base_currency': strategy.base_currency,
            'portfolio_value': strategy.calculate_portfolio_value(),
            'performance': strategy.calculate_performance_metrics(),
            'trade_history': strategy.trade_history,
            'last_prices': strategy.last_prices,
            'last_updated': datetime.now().isoformat(),
            'api_keys_configured': keys_configured,
            'api_keys_valid': keys_valid,
            'auto_execute_suggested_trades': strategy.auto_execute_suggested_trades,
            'min_confidence_threshold': strategy.min_confidence_threshold,
            'suggested_trade_refresh_interval': strategy.suggested_trade_refresh_interval
        }
        
        return jsonify({
            'success': True,
            'data': status_data
        })
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

def handle_command():
    """Handle commands from frontend"""
    try:
        command = request.json.get('command')
        if command == 'start':
            if not strategy.is_running:
                strategy.start()
                update_status_file()
                return jsonify({
                    'success': True,
                    'message': 'Paper trading started'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Paper trading is already running'
                }), 400
        elif command == 'stop':
            if strategy.is_running:
                strategy.stop()
                update_status_file()
                return jsonify({
                    'success': True,
                    'message': 'Paper trading stopped'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Paper trading is not running'
                }), 400
        else:
            return jsonify({
                'success': False,
                'message': 'Unknown command'
            }), 400
    except Exception as e:
        logger.error(f"Error handling command: {str(e)}")
        return jsonify({
            'error': 'Failed to execute command',
            'timestamp': datetime.now().isoformat()
        }), 500

# Define routes
@paper_trading_bp.route('/trading/paper', methods=['GET', 'POST'])
def handle_paper_requests():
    """Handle all paper trading related requests"""
    try:
        if request.method == 'GET':
            return get_status()
        else:  # POST request
            return handle_command()
    except Exception as e:
        logger.error(f"Error handling paper trading request: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# Register blueprint after routes are defined
app.register_blueprint(paper_trading_bp)

def attempt_to_recover_api_keys():
    """Attempt to recover API keys from backup locations if they're missing."""
    if strategy.config.get('api_key') and strategy.config.get('api_secret'):
        return True  # Keys already exist, no need to recover
        
    recovery_sources = [
        # Check dedicated backup file
        os.path.join(os.path.dirname(strategy.config_file), 'api_keys_backup.json'),
        # Check state file
        os.path.join(os.path.dirname(strategy.config_file), '..', 'paper_trading_state.json')
    ]
    
    for source in recovery_sources:
        try:
            if os.path.exists(source):
                with open(source, 'r') as f:
                    data = json.load(f)
                    
                # Extract keys based on file type
                if source.endswith('api_keys_backup.json'):
                    api_key = data.get('api_key')
                    api_secret = data.get('api_secret')
                else:  # state file
                    api_keys = data.get('api_keys', {})
                    api_key = api_keys.get('key')
                    api_secret = api_keys.get('secret')
                
                if api_key and api_secret:
                    logger.info(f"Recovering API keys from {source}")
                    strategy.config['api_key'] = api_key
                    strategy.config['api_secret'] = api_secret
                    strategy.save_config()
                    return True
        except Exception as e:
            logger.error(f"Error trying to recover API keys from {source}: {e}")
    
    return False

def init_app(app):
    """Initialize the Flask app with the paper trading blueprint"""
    # Enable CORS for all routes
    CORS(app)
    
    app.register_blueprint(paper_trading_bp)
    
    # Create an initial status file if it doesn't exist
    if not os.path.exists(status_file):
        update_status_file()
    
    return app


if __name__ == "__main__":
    # This can be run as a standalone service
    app.run(host='0.0.0.0', port=5001, debug=True)

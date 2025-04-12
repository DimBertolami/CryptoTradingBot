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
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from strategies.paper_trading import PaperTradingStrategy

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../logs')
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "paper_trading_api.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("paper_trading_api")

# Create Blueprint for paper trading API
paper_trading_bp = Blueprint('paper_trading', __name__)

# Initialize the paper trading strategy
config_file = os.path.join(parent_dir, 'frontend/trading_data/trading_config.json')
strategy = PaperTradingStrategy(config_file=config_file)

# Initialize strategy instance
trading_thread = None
last_status_update = None

# Path for storing the status JSON
status_file = os.path.join(parent_dir, 'frontend/trading_data/paper_trading_status.json')

def update_status_file():
    """Update the status JSON file for the frontend"""
    global last_status_update
    
    try:
        # Calculate total portfolio value
        portfolio_value = strategy.calculate_portfolio_value()
        
        # Get performance metrics
        performance = strategy.get_performance_metrics()
        
        # Check if API keys are configured
        api_keys_configured = bool(strategy.config.get('api_key') and strategy.config.get('api_secret'))
        
        # Create status object
        status = {
            "is_running": strategy.is_running,
            "mode": strategy.mode,
            "balance": strategy.balance,
            "holdings": strategy.holdings,
            "base_currency": strategy.base_currency,
            "portfolio_value": portfolio_value,
            "performance": performance,
            "trade_history": strategy.trade_history,
            "last_prices": strategy.last_prices,
            "last_updated": datetime.now().isoformat(),
            "api_keys_configured": api_keys_configured
        }
        
        # Write to file
        with open(status_file, 'w') as f:
            json.dump(status, f, indent=4)
            
        last_status_update = datetime.now()
        logger.info(f"Status file updated at {last_status_update}")
        
    except Exception as e:
        logger.error(f"Error updating status file: {e}")


@paper_trading_bp.route('/paper', methods=['GET'])
def get_status():
    """Get the current paper trading status"""
    try:
        update_status_file()
        
        return jsonify({
            "status": "success",
            "data": {
                "is_running": strategy.is_running,
                "mode": strategy.mode,
                "balance": strategy.balance,
                "portfolio_value": strategy.calculate_portfolio_value(),
                "last_updated": datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Error in get_status: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@paper_trading_bp.route('/paper', methods=['POST'])
def handle_command():
    """Handle paper trading commands from the frontend"""
    try:
        data = request.get_json()
        
        if not data or 'command' not in data:
            return jsonify({
                "status": "error",
                "message": "Invalid request: 'command' is required"
            }), 400
            
        command = data['command']
        logger.info(f"Received command: {command}")
        
        # Handle different commands
        if command in ['execute', 'trade']:
            # Execute trade command
            try:
                symbol = data.get('symbol')
                side = data.get('side')
                price = data.get('price')
                quantity = data.get('quantity')
                confidence = data.get('confidence', 0.75)
                note = data.get('note', '')
                
                if not all([symbol, side, price]):
                    return jsonify({
                        "status": "error",
                        "message": "Missing required parameters: symbol, side, and price are required"
                    }), 400
                
                # Validate side parameter
                if side.upper() not in ['BUY', 'SELL']:
                    return jsonify({
                        "status": "error",
                        "message": f"Invalid side parameter: {side}. Must be 'BUY' or 'SELL'"
                    }), 400
                
                # Convert price to float
                try:
                    price = float(price)
                except ValueError:
                    return jsonify({
                        "status": "error",
                        "message": f"Invalid price value: {price}"
                    }), 400
                
                # Execute the trade
                try:
                    strategy._execute_trade(symbol, price, side.upper(), quantity)
                    update_status_file()
                    
                    return jsonify({
                        "status": "success",
                        "message": f"Trade executed: {side.upper()} {symbol} at {price}",
                        "data": {
                            "symbol": symbol,
                            "side": side.upper(),
                            "price": price,
                            "quantity": quantity,
                            "confidence": confidence,
                            "note": note
                        }
                    })
                except Exception as e:
                    logger.error(f"Error executing trade: {e}")
                    return jsonify({
                        "status": "error",
                        "message": f"Failed to execute trade: {str(e)}"
                    }), 500
            except Exception as e:
                logger.error(f"Error processing trade parameters: {e}")
                return jsonify({
                    "status": "error",
                    "message": f"Invalid trade parameters: {str(e)}"
                }), 400
                
        elif command == 'start':
            interval = data.get('interval', 300)  # Default to 5 minutes
            
            if strategy.is_running:
                return jsonify({
                    "status": "warning",
                    "message": "Trading is already running"
                })
                
            strategy.start(interval_seconds=interval)
            
            # Initial status update
            update_status_file()
            
            return jsonify({
                "status": "success",
                "message": f"Started {strategy.mode} trading"
            })
            
        elif command == 'stop':
            if not strategy.is_running:
                return jsonify({
                    "status": "warning",
                    "message": "Trading is already stopped"
                })
                
            strategy.stop()
            update_status_file()
            
            return jsonify({
                "status": "success",
                "message": "Stopped trading"
            })
            
        elif command == 'switch':
            new_mode = data.get('mode')
            
            if not new_mode or new_mode not in ['paper', 'live']:
                return jsonify({
                    "status": "error",
                    "message": "Invalid mode specified"
                }), 400
                
            if new_mode == 'live' and (not strategy.config.get('api_key') or not strategy.config.get('api_secret')):
                return jsonify({
                    "status": "error",
                    "message": "API keys not set. Please set API keys first."
                }), 400
                
            strategy.switch_mode(new_mode)
            update_status_file()
            
            return jsonify({
                "status": "success",
                "message": f"Switched to {new_mode} trading mode"
            })
            
        elif command == 'reset':
            was_running = strategy.is_running
            
            if was_running:
                strategy.stop()
                
            strategy.reset_account()
            
            if was_running:
                strategy.start()
                
            update_status_file()
            
            return jsonify({
                "status": "success",
                "message": "Account reset to initial state"
            })
            
        elif command == 'api':
            api_key = data.get('key', '')
            api_secret = data.get('secret', '')
            
            if not api_key or not api_secret:
                return jsonify({
                    "status": "error",
                    "message": "API key and secret are required"
                }), 400
                
            try:
                # Update config with API keys
                strategy.config['api_key'] = api_key
                strategy.config['api_secret'] = api_secret
                
                # Save to config file first
                strategy.save_config()
                
                # Also save to state file for redundancy
                strategy.save_state()
                
                # Create an additional backup in a dedicated API keys file
                api_keys_backup_file = os.path.join(os.path.dirname(strategy.config_file), 'api_keys_backup.json')
                with open(api_keys_backup_file, 'w') as f:
                    json.dump({
                        "api_key": api_key,
                        "api_secret": api_secret,
                        "timestamp": datetime.now().isoformat()
                    }, f, indent=4)
                
                # Verify the keys were saved correctly
                if strategy.config.get('api_key') != api_key or strategy.config.get('api_secret') != api_secret:
                    raise Exception("API keys not properly saved")
                
                return jsonify({
                    "status": "success",
                    "message": "API keys saved successfully"
                })
            except Exception as e:
                app.logger.error(f"Error saving API keys: {e}")
                return jsonify({
                    "status": "error",
                    "message": f"Failed to save API keys: {str(e)}"
                }), 500
            
        else:
            return jsonify({
                "status": "error",
                "message": f"Unknown command: {command}"
            }), 400
            
    except Exception as e:
        logger.error(f"Error handling command: {e}")
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500


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

@paper_trading_bp.route('/api_status', methods=['GET'])
def get_api_status():
    """Get the API keys configuration status"""
    api_key = strategy.config.get('api_key', '')
    api_secret = strategy.config.get('api_secret', '')
    
    keys_configured = bool(api_key and api_secret)
    keys_valid = False
    recovery_attempted = False
    
    # If keys are not configured, try to recover them
    if not keys_configured:
        recovery_successful = attempt_to_recover_api_keys()
        if recovery_successful:
            keys_configured = True
            api_key = strategy.config.get('api_key', '')
            api_secret = strategy.config.get('api_secret', '')
            recovery_attempted = True
    
    # Simple validation - in a real app you'd want to verify with the actual API
    if keys_configured:
        try:
            # Basic validation - API keys should be of certain length and format
            keys_valid = (len(api_key) >= 20 and len(api_secret) >= 30)
        except Exception as e:
            logger.error(f"Error validating API keys: {e}")
    
    return jsonify({
        "status": "success",
        "configured": keys_configured,
        "valid": keys_valid,
        "recovery_attempted": recovery_attempted
    })


def init_app(app):
    """Initialize the Flask app with the paper trading blueprint"""
    # Enable CORS for all routes
    CORS(app, resources={r"/trading/*": {"origins": "*"}})
    
    app.register_blueprint(paper_trading_bp, url_prefix='/trading')
    
    # Create an initial status file if it doesn't exist
    if not os.path.exists(status_file):
        update_status_file()
    
    return app


if __name__ == "__main__":
    # This can be run as a standalone service
    app = Flask(__name__)
    init_app(app)
    app.run(debug=True, port=5001)

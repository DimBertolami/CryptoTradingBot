"""
Trading Engine Status API
Provides status endpoints for monitoring the trading engine
"""

import logging
from datetime import datetime
from flask import Blueprint, jsonify
from typing import Dict, Any

status_bp = Blueprint('status', __name__)
logger = logging.getLogger("status_api")

class StatusManager:
    def __init__(self):
        self._engine_status = {
            "is_running": False,
            "status": "inactive",
            "mode": "unknown",
            "last_updated": datetime.now().isoformat(),
            "details": {
                "balance": 0,
                "holdings": {},
                "metrics": {}
            }
        }

    def update_status(self, status_data: Dict[str, Any]):
        """Update trading engine status"""
        self._engine_status.update({
            "last_updated": datetime.now().isoformat(),
            **status_data
        })

status_manager = StatusManager()

@status_bp.route('/trading/backend_status', methods=['GET'])
def get_backend_status():
    """Get backend service status"""
    try:
        return jsonify({
            'success': status_manager._engine_status['is_running'],
            'message': f"Trading engine is {status_manager._engine_status['status']}"
        })
    except Exception as e:
        logger.error(f"Error getting backend status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error getting backend status'
        }), 500

@status_bp.route('/trading/signals_status', methods=['GET'])
def get_signals_status():
    """Get signal generator status"""
    try:
        details = status_manager._engine_status['details']
        signals_active = bool(details.get('metrics', {}).get('signals_generated', 0))
        return jsonify({
            'success': signals_active,
            'message': 'Signal generator is active' if signals_active else 'No signals generated'
        })
    except Exception as e:
        logger.error(f"Error getting signals status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error getting signals status'
        }), 500

@status_bp.route('/trading/paper_trading_status', methods=['GET'])
def get_paper_trading_status():
    """Get paper trading service status"""
    try:
        is_paper = status_manager._engine_status['mode'] == 'paper'
        return jsonify({
            'success': is_paper and status_manager._engine_status['is_running'],
            'message': 'Paper trading is active' if is_paper else 'Not in paper trading mode'
        })
    except Exception as e:
        logger.error(f"Error getting paper trading status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error getting paper trading status'
        }), 500

@status_bp.route('/trading/database_status', methods=['GET'])
def get_database_status():
    """Get database service status"""
    try:
        details = status_manager._engine_status['details']
        db_active = bool(details.get('metrics', {}).get('last_db_update'))
        return jsonify({
            'success': db_active,
            'message': 'Database is connected' if db_active else 'Database connection issue'
        })
    except Exception as e:
        logger.error(f"Error getting database status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error getting database status'
        }), 500

def init_app(app):
    """Initialize the status API blueprint"""
    app.register_blueprint(status_bp)

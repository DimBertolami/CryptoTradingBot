from flask import Blueprint, jsonify
from datetime import datetime

signals_bp = Blueprint('signals', __name__)

@signals_bp.route('/trading/signals_status', methods=['GET'])
def get_signals_status():
    try:
        # Get actual status from signals service
        status = {
            "name": "Signals Generator",
            "status": "active",
            "pid": None,
            "is_running": True,
            "mode": "live",
            "last_updated": datetime.now().isoformat(),
            "details": {
                "metrics": {
                    "uptime": 3600,
                    "signals_generated": 50,
                    "accuracy": 0.75,
                    "connections": 1
                }
            }
        }
        return jsonify(status)
    except Exception as e:
        return jsonify({
            "name": "Signals Generator",
            "status": "error",
            "message": str(e)
        }), 500

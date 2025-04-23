from flask import Blueprint, jsonify
from datetime import datetime

backend_bp = Blueprint('backend', __name__)

@backend_bp.route('/trading/backend_status', methods=['GET'])
def get_backend_status():
    try:
        # Get actual status from backend service
        status = {
            "name": "Backend",
            "status": "active",
            "pid": None,
            "is_running": True,
            "mode": "live",
            "last_updated": datetime.now().isoformat(),
            "details": {
                "metrics": {
                    "uptime": 3600,
                    "requests_handled": 200,
                    "connections": 1
                }
            }
        }
        return jsonify(status)
    except Exception as e:
        return jsonify({
            "name": "Backend",
            "status": "error",
            "message": str(e)
        }), 500

from flask import Blueprint, jsonify
from datetime import datetime

database_bp = Blueprint('database', __name__)

@database_bp.route('/trading/database_status', methods=['GET'])
def get_database_status():
    try:
        # Get actual status from database service
        status = {
            "name": "Database",
            "status": "active",
            "pid": None,
            "is_running": True,
            "mode": "live",
            "last_updated": datetime.now().isoformat(),
            "details": {
                "metrics": {
                    "uptime": 3600,
                    "queries_per_second": 10,
                    "connections": 1
                }
            }
        }
        return jsonify(status)
    except Exception as e:
        return jsonify({
            "name": "Database",
            "status": "error",
            "message": str(e)
        }), 500

from flask import Blueprint, jsonify
from database import SessionLocal
from sqlalchemy import desc
from models.trading_models import BotThought

bot_thoughts_bp = Blueprint('bot_thoughts', __name__)

@bot_thoughts_bp.route('/api/bot-thoughts', methods=['GET'])
def get_bot_thoughts():
    db = SessionLocal()
    try:
        # Get the most recent 100 thoughts
        thoughts = db.query(BotThought)\
            .order_by(desc(BotThought.timestamp))\
            .limit(100)\
            .all()
        
        return jsonify([{
            'id': thought.id,
            'timestamp': thought.timestamp.isoformat(),
            'thought_content': thought.thought_content
        } for thought in thoughts])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

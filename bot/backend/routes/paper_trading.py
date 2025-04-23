from flask import Blueprint, jsonify, request
from datetime import datetime
import json
import os

# Import the strategy
from ..strategies.paper_trading import PaperTradingStrategy

# Initialize strategy instance
strategy = PaperTradingStrategy()

paper_trading_bp = Blueprint('paper_trading', __name__)

@paper_trading_bp.route('/trading/paper_trading_status', methods=['GET'])
def get_paper_trading_status():
    try:
        status = strategy.get_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({
            "name": "Paper Trading",
            "status": "error",
            "message": str(e)
        }), 500

@paper_trading_bp.route('/trading/paper', methods=['POST'])
def handle_paper_trading_command():
    try:
        data = request.get_json()
        command = data.get('command')
        
        if command == 'start':
            result = strategy.start()
            return jsonify(result)
        elif command == 'stop':
            result = strategy.stop()
            return jsonify(result)
        elif command == 'trade':
            symbol = data.get('symbol')
            side = data.get('side')
            amount = data.get('amount')
            price = data.get('price')
            
            if not all([symbol, side, amount, price]):
                return jsonify({
                    'success': False,
                    'message': 'Missing required trade parameters'
                }), 400
            
            result = strategy.execute_trade(symbol, side, amount, price)
            return jsonify(result)
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid command'
            }), 400
    except Exception as e:
        logger.error(f"Error handling paper trading command: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@paper_trading_bp.route('/trading/paper/last_prices', methods=['POST'])
def update_last_prices():
    try:
        data = request.get_json()
        prices = data.get('prices', {})
        
        for symbol, price in prices.items():
            strategy.last_prices[symbol] = float(price)
            
        strategy.save_state()
        return jsonify({
            'success': True,
            'message': 'Prices updated successfully'
        })
    except Exception as e:
        logger.error(f"Error updating last prices: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

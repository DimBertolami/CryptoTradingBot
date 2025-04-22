from flask import Flask
from flask_cors import CORS
from paper_trading_api import paper_trading_bp
from status_api import status_bp

app = Flask(__name__)
CORS(app)

# Register both blueprints
app.register_blueprint(paper_trading_bp, url_prefix='/trading')
app.register_blueprint(status_bp, url_prefix='/trading')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
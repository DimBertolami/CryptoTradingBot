from flask import Flask
from flask_cors import CORS
from routes.bot_thoughts_api import bot_thoughts_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(bot_thoughts_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

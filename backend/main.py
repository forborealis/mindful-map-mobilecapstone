from flask import Flask
from flask_cors import CORS
import logging
import os

from recommendation_sentiment import bp as sentiment_bp
from prediction import bp as prediction_bp
from concordance import ccc_bp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

app.register_blueprint(sentiment_bp)
app.register_blueprint(ccc_bp)
app.register_blueprint(prediction_bp)


@app.route('/', methods=['GET'])
def root():
    return {'message': 'Backend is running!'}

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy', 'service': 'combined-python-services'}


if __name__ == '__main__':
    print("Starting Combined Python Services on port 5003...")
    port = int(os.environ.get("PORT", 5003))
    app.run(host='0.0.0.0', port=port)
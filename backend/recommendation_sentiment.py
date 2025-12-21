from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

analyzer = SentimentIntensityAnalyzer()

MIN_COMMENT_LENGTH = 10 

def normalize_filipino_shortcuts(text: str) -> str:
    t = f" {str(text)} ".lower()
    replacements = {
        " lng ": " lang ",
        " dn ": " din ",
        " nmn ": " naman ",
        " nman ": " naman ",
        " kc ": " kasi ",
        " ksi ": " kasi ",
        " pra ": " para ",
        " dpt ": " dapat ",
        " dko ": " di ko ",
        " dka ": " di ka ",
        " ndi ": " hindi ",
        " hndi ": " hindi ",
        " hnd ": " hindi ",
        " ok ": " okay ",
        " tnx ": " salamat ",
        " ty ": " salamat ",
        " pls ": " please ",
        " plz ": " please ",
        " wlang ": " walang ",
        " wla ": " wala ",
        " panu ": " paano ",
        " pano ": " paano ",
        " ung ": " yung ",
        " kng ": " kung ",
        " nakakastress ": " stressful ",
        " mas nakakastress ": " more stressful "
    }
    for k, v in replacements.items():
        t = t.replace(k, f" {v.strip()} ")
    return " ".join(t.split())

def clean_text(text: str) -> str:
    """Clean and preprocess text for sentiment analysis."""
    txt = normalize_filipino_shortcuts(text)
    txt = re.sub(r'\s+', ' ', txt).strip()
    return txt

def get_sentiment_score(text: str):
    """Get sentiment using TextBlob and VADER, return combined in [-1, 1]."""
    try:
        clean_text_input = clean_text(text)

        blob = TextBlob(clean_text_input)
        textblob_polarity = float(blob.sentiment.polarity)        # [-1, 1]
        textblob_subjectivity = float(blob.sentiment.subjectivity) # [0, 1]

        vader_scores = analyzer.polarity_scores(clean_text_input)  # compound in [-1, 1]

        combined = (0.4 * textblob_polarity) + (0.6 * vader_scores['compound'])

        if combined >= 0.1:
            sentiment = 'positive'
        elif combined <= -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'

        return {
            'sentiment': sentiment,
            'confidence': abs(combined),
            'scores': {
                'textblob': {
                    'polarity': textblob_polarity,
                    'subjectivity': textblob_subjectivity
                },
                'vader': vader_scores,
                'combined': combined
            }
        }
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        raise

def effective_hint(score: float) -> str:
    return 'positive' if score > 0.25 else ('negative' if score < -0.25 else 'neutral')

@app.route('/api/sentiment', methods=['POST'])
def api_sentiment():
    """Endpoint compatible with Node: returns sentimentScore and sentimentUsed."""
    try:
        body = request.get_json(silent=True) or {}
        comment = body.get('comment', '') or ''
        debug = bool(body.get('debug', False))

        # If empty or too short, skip sentiment (return 0 and sentimentUsed=false)
        if len(comment.strip()) < MIN_COMMENT_LENGTH:
            resp = {
                'success': True,
                'sentimentScore': 0.0,
                'sentimentUsed': False,
                'effectiveHint': 'neutral',
                'error': 'comment_too_short'
            }
            if debug:
                resp['normalizedText'] = clean_text(comment)
            return jsonify(resp), 200

        result = get_sentiment_score(comment)
        sentiment_score = float(result['scores']['combined'])

        resp = {
            'success': True,
            'sentimentScore': sentiment_score,
            'sentimentUsed': True,
            'effectiveHint': effective_hint(sentiment_score)
        }

        if debug:
            resp['normalizedText'] = clean_text(comment)
            resp['scores'] = result['scores']
            resp['sentiment'] = result['sentiment']
            resp['confidence'] = round(result['confidence'], 3)

        return jsonify(resp), 200
    except Exception as e:
        logger.error(f"/api/sentiment error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sentiment/batch', methods=['POST'])
def api_sentiment_batch():
    try:
        body = request.get_json(silent=True) or {}
        comments = body.get('comments', [])
        if not isinstance(comments, list):
            return jsonify({'success': False, 'error': 'comments must be an array'}), 400

        results = []
        for c in comments:
            if not c or len(str(c).strip()) < MIN_COMMENT_LENGTH:
                results.append({
                    'comment': c,
                    'sentimentScore': 0.0,
                    'sentimentUsed': False,
                    'effectiveHint': 'neutral',
                    'error': 'comment_too_short'
                })
                continue
            r = get_sentiment_score(c)
            score = float(r['scores']['combined'])
            results.append({
                'comment': c,
                'sentimentScore': score,
                'sentimentUsed': True,
                'effectiveHint': effective_hint(score)
            })

        return jsonify({'success': True, 'results': results}), 200
    except Exception as e:
        logger.error(f"/api/sentiment/batch error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'sentiment-analysis', 'minCommentLength': MIN_COMMENT_LENGTH})

if __name__ == '__main__':
    print("Starting Sentiment Analysis Service on port 5003...")
    app.run(debug=True, host='0.0.0.0', port=5003)
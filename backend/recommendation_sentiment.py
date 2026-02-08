from flask import Blueprint, request, jsonify
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('recommendation_sentiment', __name__)

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
  """
  Clean and preprocess text for sentiment analysis.
  Mirrors web service behavior but keeps Filipino shortcut normalization.
  """
  txt = normalize_filipino_shortcuts(text)
  txt = re.sub(r'\s+', ' ', txt).strip()
  return txt


def get_sentiment_score(text: str):
  """
  Get sentiment using TextBlob and VADER, combined like the web service:
  - VADER compound (70%) + TextBlob polarity (30%)
  - Clipped to [-1, 1]
  - Thresholds at 0.05 / -0.05 for sentiment label
  """
  try:
    clean_text_input = clean_text(text)

    # TextBlob analysis
    blob = TextBlob(clean_text_input)
    textblob_polarity = float(blob.sentiment.polarity)         # [-1, 1]
    textblob_subjectivity = float(blob.sentiment.subjectivity) # [0, 1]

    # VADER analysis
    vader_scores = analyzer.polarity_scores(clean_text_input)  # compound in [-1, 1]
    vader_compound = float(vader_scores['compound'])

    # Combine scores (VADER weighted more, per Hutto & Gilbert 2014)
    combined_score = 0.7 * vader_compound + 0.3 * textblob_polarity

    # Clip to [-1, 1]
    combined_score = max(-1.0, min(1.0, combined_score))

    # Sentiment label using VADER-style thresholds
    if combined_score >= 0.05:
      sentiment = 'positive'
    elif combined_score <= -0.05:
      sentiment = 'negative'
    else:
      sentiment = 'neutral'

    return {
        'sentiment': sentiment,
        'confidence': abs(combined_score),
        'scores': {
            'textblob': {
                'polarity': textblob_polarity,
                'subjectivity': textblob_subjectivity
            },
            'vader': vader_scores,
            'combined': combined_score
        }
    }
  except Exception as e:
    logger.error(f"Error in sentiment analysis: {str(e)}")
    raise


def effective_hint(score: float) -> str:
  return 'positive' if score > 0.25 else ('negative' if score < -0.25 else 'neutral')


@bp.route('/api/sentiment', methods=['POST'])
def api_sentiment():
  """
  Endpoint compatible with Node: returns sentimentScore and sentimentUsed.
  Uses the same scoring logic as the web sentiment_analysis service.
  """
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


@bp.route('/api/sentiment/batch', methods=['POST'])
def api_sentiment_batch():
  """
  Batch endpoint analogous to the web batch-analyze route,
  but returning only the fields needed by the Node backend.
  """
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


@bp.route('/health', methods=['GET'])
def health():
  return jsonify({
      'status': 'healthy',
      'service': 'sentiment-analysis',
      'minCommentLength': MIN_COMMENT_LENGTH
  })
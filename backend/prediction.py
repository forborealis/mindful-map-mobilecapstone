from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from datetime import datetime, timedelta, time
import pandas as pd
import numpy as np
import requests
import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
NODE_API_URL = os.getenv('NODE_API_URL', 'http://localhost:5002')

class CategoryMoodPredictor:
    def __init__(self):
        self.categories = ['activity', 'social', 'health', 'sleep']
        self.days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        # Define emotion categories
        self.negative_emotions = ['bored', 'sad', 'disappointed', 'angry', 'tense']
        self.positive_emotions = ['calm', 'relaxed', 'pleased', 'happy', 'excited']
        self.all_emotions = self.negative_emotions + self.positive_emotions
        
        # Week weights: most recent week = 4, oldest week = 1
        self.week_weights = [1, 2, 3, 4]

    def get_current_week_date(self, day_name):
        """Get the date for a specific day in the current week"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        today = datetime.now().date()
        target_day = days.index(day_name)
        current_day = today.weekday()
        
        # Calculate days difference from Monday (start of week)
        days_from_monday = target_day - 0  # 0 is Monday
        current_monday = today - timedelta(days=current_day)
        
        return current_monday + timedelta(days=days_from_monday)

    def prepare_category_data(self, mood_logs, category):
        """
        Prepare and analyze data for a specific category using weighted mean algorithm
        """
        try:
            # Convert to DataFrame
            df = pd.DataFrame(mood_logs)
            
            if df.empty:
                return None, f"No mood logs data received", None
            
            # Ensure proper data types
            if 'afterIntensity' in df.columns:
                df['afterIntensity'] = pd.to_numeric(df['afterIntensity'], errors='coerce')
            if 'afterValence' in df.columns:
                df['afterValence'] = df['afterValence'].astype(str)
            if 'afterEmotion' in df.columns:
                df['afterEmotion'] = df['afterEmotion'].astype(str)
                
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp', ascending=False)

            # Filter by category
            category_df = df[df['category'] == category].copy()
            
            if category_df.empty:
                return None, f"No data found for {category} category", None
            
            # Debug logging
            logger.info(f"Found {len(category_df)} entries for {category} category")
            logger.info(f"Sample data types: afterValence={type(category_df['afterValence'].iloc[0])}, afterIntensity={type(category_df['afterIntensity'].iloc[0])}")
            logger.info(f"Sample afterValence values: {category_df['afterValence'].unique()}")
            logger.info(f"Sample afterIntensity values: {category_df['afterIntensity'].unique()[:5]}")

            # Get current week boundaries
            most_recent = category_df['timestamp'].max()
            current_date = pd.Timestamp.now(tz=most_recent.tz).date()
            current_week_monday = current_date - pd.Timedelta(days=current_date.weekday())
            current_week_start = pd.Timestamp.combine(current_week_monday, time.min).tz_localize(most_recent.tz)

            # Exclude current week data
            category_df = category_df[category_df['timestamp'] < current_week_start]

            # Include data from four weeks before the current week
            four_weeks_ago = current_week_start - pd.Timedelta(days=28)
            category_df = category_df[category_df['timestamp'] >= four_weeks_ago]

            if len(category_df) < 14:  
                return None, f"Insufficient data for {category}. Need at least 14 entries, found {len(category_df)}", None

            # Group by weeks (oldest to newest)
            category_df['week_number'] = ((category_df['timestamp'] - four_weeks_ago).dt.days // 7).astype(int)
            category_df = category_df[category_df['week_number'] < 4]  # Only 4 weeks
            
            # Validate required fields exist and have valid data
            required_fields = ['afterEmotion', 'afterValence', 'afterIntensity']
            for field in required_fields:
                if field not in category_df.columns:
                    return None, f"Missing required field '{field}' in {category} data", None
                
                # Remove entries with null values in required fields
                before_count = len(category_df)
                category_df = category_df.dropna(subset=[field])
                after_count = len(category_df)
                if before_count != after_count:
                    logger.warning(f"Removed {before_count - after_count} entries with null {field} values")

            # Calculate actual date range used for predictions
            start_date = category_df['timestamp'].min()
            end_date = category_df['timestamp'].max()
            
            # Format as "Month Day - Month Day, Year" (e.g., "October 15 - November 5, 2025")
            if start_date.year == end_date.year and start_date.month == end_date.month:
                # Same month: "October 15 - 25, 2025"
                formatted_range = f"{start_date.strftime('%B %d')} - {end_date.strftime('%d, %Y')}"
            elif start_date.year == end_date.year:
                # Same year: "October 15 - November 5, 2025"
                formatted_range = f"{start_date.strftime('%B %d')} - {end_date.strftime('%B %d, %Y')}"
            else:
                # Different years: "December 15, 2024 - January 5, 2025"
                formatted_range = f"{start_date.strftime('%B %d, %Y')} - {end_date.strftime('%B %d, %Y')}"
            
            date_range_info = {
                'start_date': start_date.strftime('%B %d, %Y'),
                'end_date': end_date.strftime('%B %d, %Y'),
                'formatted_range': formatted_range,
                'total_entries': len(category_df),
                'weeks_of_data': len(category_df['week_number'].unique())
            }

            # Calculate weighted mean predictions for each day of the week
            day_predictions = {}
            
            for day in self.days_of_week:
                day_data = category_df[category_df['timestamp'].dt.day_name() == day]
                
                if day_data.empty:
                    day_predictions[day] = {
                        'prediction': 'No data available',
                        'confidence': 0,
                        'emotion_breakdown': {},
                        'valence_avg': 0,
                        'activity': 'No data available',
                        'date': 'No data available'
                    }
                    continue

                # Group by date and calculate daily averages (matching web logic)
                daily_data = {}
                for _, entry in day_data.iterrows():
                    date_key = entry['timestamp'].date()
                    week_number = entry['week_number']
                    after_emotion = str(entry['afterEmotion']).strip()
                    after_intensity = float(entry['afterIntensity']) if pd.notna(entry['afterIntensity']) else 0
                    after_valence = str(entry['afterValence']).strip().lower()
                    
                    # Handle activity field - for sleep it might be hours (numeric), for others it's activity name
                    if category == 'sleep':
                        # For sleep, use hours if available, otherwise use 'Unknown'
                        activity = str(entry.get('hrs', entry.get('activity', 'Unknown')))
                    else:
                        activity = str(entry.get('activity', 'Unknown'))
                    
                    # Ensure activity is never NaN
                    if activity == 'nan' or activity == 'None':
                        activity = 'Unknown'
                    
                    if after_emotion == 'nan' or not after_emotion:
                        continue
                        
                    if date_key not in daily_data:
                        daily_data[date_key] = {
                            'emotions': defaultdict(list),
                            'week_number': week_number,
                            'activities': defaultdict(list)
                        }
                    
                    daily_data[date_key]['emotions'][after_emotion].append(after_intensity)
                    daily_data[date_key]['activities'][after_emotion].append({
                        'activity': activity,
                        'timestamp': entry['timestamp']
                    })

                # Calculate weighted intensities using the web algorithm
                mood_week_weighted_intensities = defaultdict(lambda: [0, 0, 0, 0])  # 4 weeks
                
                for date_key, data in daily_data.items():
                    week_number = data['week_number']
                    week_weight = self.week_weights[week_number]
                    
                    for emotion, intensities in data['emotions'].items():
                        # Calculate average daily intensity
                        avg_daily_intensity = sum(intensities) / len(intensities)
                        weighted_intensity = week_weight * avg_daily_intensity
                        mood_week_weighted_intensities[emotion][week_number] += weighted_intensity

                # Calculate total weighted intensities and probabilities
                total_weighted_sum = 0
                for emotion, week_values in mood_week_weighted_intensities.items():
                    total_weighted_sum += sum(week_values)

                if total_weighted_sum == 0:
                    day_predictions[day] = {
                        'prediction': 'No data available',
                        'confidence': 0,
                        'emotion_breakdown': {},
                        'valence_avg': 0,
                        'activity': 'No data available',
                        'date': 'No data available'
                    }
                    continue

                # Calculate probabilities and find the most likely emotion
                emotion_probabilities = {}
                max_probability = 0
                predicted_emotion = None
                
                for emotion, week_values in mood_week_weighted_intensities.items():
                    emotion_sum = sum(week_values)
                    probability = emotion_sum / total_weighted_sum
                    # Cap at 90% as per web logic
                    capped_probability = min(probability * 100, 90.0)
                    emotion_probabilities[emotion] = round(capped_probability / 100, 3)
                    
                    if capped_probability > max_probability:
                        max_probability = capped_probability
                        predicted_emotion = emotion

                # Get the latest activity for the predicted emotion
                predicted_activity = 'Unknown'
                latest_timestamp = None
                
                for date_key, data in daily_data.items():
                    if predicted_emotion in data['activities']:
                        for activity_data in data['activities'][predicted_emotion]:
                            if latest_timestamp is None or activity_data['timestamp'] > latest_timestamp:
                                latest_timestamp = activity_data['timestamp']
                                activity_value = activity_data.get('activity', 'Unknown')
                                # Ensure activity is never NaN or None
                                if pd.isna(activity_value) or str(activity_value) in ['nan', 'None', '']:
                                    predicted_activity = 'Unknown'
                                else:
                                    predicted_activity = str(activity_value)

                # Calculate average valence
                valence_total = 0
                valence_count = 0
                for _, entry in day_data.iterrows():
                    after_valence = str(entry['afterValence']).strip().lower()
                    valence_numeric = 1 if after_valence == 'positive' else 0
                    valence_total += valence_numeric
                    valence_count += 1
                
                avg_valence = valence_total / valence_count if valence_count > 0 else 0

                # Format date for current week (e.g., "November 11, 2025")
                current_week_date = self.get_current_week_date(day)
                formatted_date = current_week_date.strftime("%B %d, %Y")

                # Create emotion breakdown for all emotions
                emotion_breakdown = {}
                for emotion in self.all_emotions:
                    emotion_breakdown[emotion] = emotion_probabilities.get(emotion, 0)

                # Ensure no NaN values in the response
                safe_activity = str(predicted_activity) if pd.notna(predicted_activity) else 'Unknown'
                safe_confidence = round(max_probability / 100, 3) if pd.notna(max_probability) else 0
                safe_valence = round(avg_valence, 2) if pd.notna(avg_valence) else 0
                
                day_predictions[day] = {
                    'prediction': predicted_emotion or 'No prediction',
                    'confidence': safe_confidence,
                    'emotion_breakdown': emotion_breakdown,
                    'valence_avg': safe_valence,
                    'activity': safe_activity,
                    'date': formatted_date
                }

            return day_predictions, None, date_range_info

        except Exception as e:
            logger.error(f"Error in prepare_category_data for {category}: {str(e)}")
            return None, f"Error processing data for {category}: {str(e)}", None

    def check_category_data_availability(self, mood_logs):
        """
        Check which categories have sufficient data (at least 2 weeks)
        """
        available_categories = {}
        
        for category in self.categories:
            category_data, error, date_range = self.prepare_category_data(mood_logs, category)
            available_categories[category] = {
                'available': category_data is not None,
                'message': error if category_data is None else 'Sufficient data available'
            }
        
        return available_categories

def predict_category_moods(mood_logs, category):
    """
    Predict moods for a specific category using weighted probability
    """
    try:
        predictor = CategoryMoodPredictor()
        predictions, error, date_range_info = predictor.prepare_category_data(mood_logs, category)
        
        if error:
            return {'error': error}
        
        return {'predictions': predictions, 'date_range': date_range_info}
    except Exception as e:
        logger.error(f"Error in predict_category_moods: {str(e)}")
        return {'error': str(e)}

def check_data_availability(mood_logs):
    """
    Check data availability for all categories
    """
    try:
        predictor = CategoryMoodPredictor()
        return predictor.check_category_data_availability(mood_logs)
    except Exception as e:
        logger.error(f"Error in check_data_availability: {str(e)}")
        return {'error': str(e)}
   
@app.route('/api/predict-category-mood', methods=['GET'])
def get_category_prediction():
    try:
        token = request.headers.get('Authorization')
        category = request.args.get('category')
        
        if not token or not token.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authorization token required'
            }), 401
            
        if not category or category not in ['activity', 'social', 'health', 'sleep']:
            return jsonify({
                'success': False,
                'message': 'Invalid category. Must be one of: activity, social, health, sleep'
            }), 400
            
        # Forward the token to Node backend to validate and get mood logs
        logger.info(f"Connecting to Node API at: {NODE_API_URL}/api/mood-logs-category")
        response = requests.get(
            f"{NODE_API_URL}/api/mood-logs-category", 
            headers={
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        )
        
        if response.status_code != 200:
            return jsonify({
                'success': False,
                'message': 'Failed to fetch mood logs from backend'
            }), 500
            
        mood_logs = response.json().get('logs', [])
        
        # Get predictions for the specific category
        result = predict_category_moods(mood_logs, category)
        
        if 'error' in result:
            return jsonify({
                'success': False,
                'message': result['error']
            }), 400
            
        return jsonify({
            'success': True,
            'category': category,
            'predictions': result['predictions'],
            'date_range': result.get('date_range')
        })
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@app.route('/api/check-category-data', methods=['GET'])
def check_category_data():
    try:
        token = request.headers.get('Authorization')
        
        if not token or not token.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authorization token required'
            }), 401
            
        # Forward the token to Node backend to validate and get mood logs
        logger.info(f"Connecting to Node API at: {NODE_API_URL}/api/mood-logs-category")
        response = requests.get(
            f"{NODE_API_URL}/api/mood-logs-category", 
            headers={
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        )
        
        if response.status_code != 200:
            return jsonify({
                'success': False,
                'message': 'Failed to fetch mood logs from backend'
            }), 500
            
        mood_logs = response.json().get('logs', [])
        
        # Check data availability for all categories
        availability = check_data_availability(mood_logs)
        
        return jsonify({
            'success': True,
            'availability': availability
        })
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@app.route('/api/predict-mood', methods=['GET'])
def get_prediction_from_node():
    try:
        token = request.headers.get('Authorization')
        
        if not token or not token.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authorization token required'
            }), 401
            
        # Simple prediction logic for general mood prediction
        return jsonify({
            'success': True,
            'predictions': {
                'general': 'Based on your recent patterns, you might feel more positive in the afternoon.',
                'confidence': 0.75
            },
            'insights': [
                'Your mood tends to improve after physical activities',
                'Social interactions have a positive impact on your wellbeing'
            ]
        })
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@app.route('/api/debug-mood-data', methods=['GET'])
def debug_mood_data():
    """Debug endpoint to check data format"""
    try:
        token = request.headers.get('Authorization')
        
        if not token or not token.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authorization token required'
            }), 401
            
        # Forward the token to Node backend to validate and get mood logs
        logger.info(f"Connecting to Node API at: {NODE_API_URL}/api/mood-logs-category")
        response = requests.get(
            f"{NODE_API_URL}/api/mood-logs-category", 
            headers={
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        )
        
        if response.status_code != 200:
            return jsonify({
                'success': False,
                'message': 'Failed to fetch mood logs from backend'
            }), 500
            
        mood_logs = response.json().get('logs', [])
        
        # Return debug information about the data
        debug_info = {
            'total_logs': len(mood_logs),
            'sample_log': mood_logs[0] if mood_logs else None,
            'data_types': {},
            'unique_categories': [],
            'unique_after_valences': [],
            'sample_after_intensities': []
        }
        
        if mood_logs:
            sample = mood_logs[0]
            for key, value in sample.items():
                debug_info['data_types'][key] = str(type(value))
            
            debug_info['unique_categories'] = list(set(log.get('category') for log in mood_logs))
            debug_info['unique_after_valences'] = list(set(log.get('afterValence') for log in mood_logs))
            debug_info['sample_after_intensities'] = [log.get('afterIntensity') for log in mood_logs[:5]]
        
        return jsonify({
            'success': True,
            'debug_info': debug_info
        })
        
    except Exception as e:
        logger.error(f"Debug API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5003)
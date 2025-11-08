import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { predictionService } from '../../../services/predictionService';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';

const { width } = Dimensions.get('window');

const CategoryPrediction = ({ navigation, route }) => {
  const { category } = route.params;
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const categoryInfo = {
    activity: { name: 'Activity', icon: 'fitness', color: '#FF6B6B' },
    social: { name: 'Social', icon: 'people', color: '#4ECDC4' },
    health: { name: 'Health', icon: 'heart', color: '#45B7D1' },
    sleep: { name: 'Sleep', icon: 'moon', color: '#96CEB4' },
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const emotionColors = {
    // Negative emotions
    bored: '#95A5A6',
    sad: '#3498DB',
    disappointed: '#E67E22',
    angry: '#E74C3C',
    tense: '#9B59B6',
    
    // Positive emotions
    calm: '#27AE60',
    relaxed: '#1ABC9C',
    pleased: '#F39C12',
    happy: '#F1C40F',
    excited: '#E91E63',
  };

  useEffect(() => {
    fetchCategoryPrediction();
  }, [category]);

  const fetchCategoryPrediction = async () => {
    setLoading(true);
    try {
      const response = await predictionService.predictCategoryMood(category);
      
      if (response.success) {
        setPredictions(response.predictions);
        setDateRange(response.dateRange);
        Toast.show({
          type: 'success',
          text1: 'Prediction Generated',
          text2: `${categoryInfo[category].name} prediction is ready!`,
          position: 'top',
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to generate prediction');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error generating category prediction:', error);
      Alert.alert('Error', error.message || 'Failed to generate prediction');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getEmotionColor = (emotion) => {
    return emotionColors[emotion] || colors.primary;
  };

  const getValenceLabel = (valence) => {
    // Since there are 5 negative and 5 positive emotions, valence > 0.5 means more positive
    return valence > 0.5 ? 'Positive' : 'Negative';
  };

  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      // Negative emotions
      'bored': '😑',
      'sad': '😢',
      'disappointed': '😞',
      'angry': '😠',
      'tense': '😰',
      
      // Positive emotions
      'calm': '😌',
      'relaxed': '😊',
      'pleased': '🙂',
      'happy': '😄',
      'excited': '🤩'
    };
    
    return emojiMap[emotion.toLowerCase()] || '😐';
  };

  const getActivityDisplayName = (activityId) => {
    const activityMap = {
      // Activity category
      'study': 'Study',
      'read': 'Read',
      'extracurricular': 'Extracurricular Activities',
      'relax': 'Relax',
      'watch-movie': 'Watch Movie',
      'listen-music': 'Listen to Music',
      'gaming': 'Gaming',
      'browse-internet': 'Browse the Internet',
      'shopping': 'Shopping',
      'travel': 'Travel',
      
      // Social category
      'alone': 'Alone',
      'friends': 'Friend/s',
      'family': 'Family',
      'classmates': 'Classmate/s',
      'relationship': 'Relationship',
      'online': 'Online Interaction',
      'pet': 'Pet',
      
      // Health category
      'jog': 'Jog',
      'walk': 'Walk',
      'exercise': 'Exercise',
      'meditate': 'Meditate',
      'eat-healthy': 'Eat Healthy',
      'no-physical': 'No Physical Activity',
      'eat-unhealthy': 'Eat Unhealthy',
      'drink-alcohol': 'Drink Alcohol',
      
      // Sleep category (sleep uses hours, not activities like others)
      'sleep': 'Sleep Hours'
    };
    
    return activityMap[activityId] || activityId || 'Unknown Activity';
  };

  const renderDayCard = (day) => {
    const dayData = predictions[day];
    
    if (!dayData) return null;

    return (
      <View key={day} style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleContainer}>
            <Text style={styles.dayTitle}>{day}</Text>
            {dayData.date && dayData.date !== 'No data available' && (
              <Text style={styles.dayDate}>{dayData.date}</Text>
            )}
          </View>
          {dayData.prediction !== 'No data available' && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {(dayData.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {dayData.prediction === 'No data available' ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="information-circle" size={24} color={colors.textSecondary} />
            <Text style={styles.noDataText}>No data for this day</Text>
          </View>
        ) : (
          <View style={styles.predictionContent}>
            {/* Main Prediction */}
            <View style={styles.mainPrediction}>
              <Text style={styles.emotionEmoji}>{getEmotionEmoji(dayData.prediction)}</Text>
              <Text style={styles.emotionText}>{dayData.prediction}</Text>
            </View>

            {/* Valence and Activity */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Valence:</Text>
                <Text style={styles.metricValue}>
                  {getValenceLabel(dayData.valence_avg)}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Likely Cause:</Text>
                <Text style={styles.metricValue}>
                  {category === 'sleep' 
                    ? `${dayData.activity || 'Unknown'} hours`
                    : getActivityDisplayName(dayData.activity)
                  }
                </Text>
              </View>
            </View>

            {/* Emotion Breakdown */}
            <View style={styles.emotionBreakdown}>
              <Text style={styles.breakdownTitle}>Emotion Probabilities:</Text>
              <View style={styles.emotionsList}>
                {Object.entries(dayData.emotion_breakdown || {})
                  .filter(([_, probability]) => probability > 0)
                  .sort(([_, a], [__, b]) => b - a)
                  .slice(0, 3)
                  .map(([emotion, probability]) => (
                    <View key={emotion} style={styles.emotionItem}>
                      <View style={[
                        styles.emotionColorDot,
                        { 
                          backgroundColor: categoryInfo[category].color,
                          opacity: emotion.toLowerCase() === dayData.prediction.toLowerCase() ? 1 : 0.6
                        }
                      ]} />
                      <Text style={styles.emotionName}>{emotion}</Text>
                      <Text style={styles.emotionProbability}>
                        {(probability * 100).toFixed(1)}%
                      </Text>
                    </View>
                  ))
                }
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderDataRangeInfo = () => {
    if (!dateRange) return null;

    return (
      <View style={styles.dataRangeCard}>
        <View style={styles.dataRangeHeader}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={styles.dataRangeTitle}>Date Range</Text>
        </View>
        <Text style={styles.dataRangeText}>
          Based on {dateRange.total_entries} entries from <Text style={styles.dateHighlight}>{dateRange.formatted_range}</Text>
        </Text>
        <Text style={styles.dataRangeSubtext}>
          {dateRange.weeks_of_data} weeks of data analyzed
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating prediction...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: categoryInfo[category].color }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Ionicons name={categoryInfo[category].icon} size={32} color={colors.white} />
          <Text style={styles.headerTitle}>{categoryInfo[category].name} Prediction</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderDataRangeInfo()}
        
        <View style={styles.predictionSection}>
          <Text style={styles.sectionTitle}>Weekly Mood Predictions</Text>
          <Text style={styles.sectionSubtitle}>
            How you might feel during {categoryInfo[category].name.toLowerCase()} activities
          </Text>
          
          {predictions && daysOfWeek.map(renderDayCard)}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.infoText}>
              Predictions are based on your historical mood patterns during {categoryInfo[category].name.toLowerCase()} activities. 
              The confidence percentage indicates how reliable the prediction is based on your data patterns.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    marginLeft: 12,
  },
  scrollContent: {
    flex: 1,
  },
  dataRangeCard: {
    backgroundColor: colors.white,
    margin: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dataRangeTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginLeft: 8,
  },
  dataRangeText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
    textAlign: 'center',
  },
  dateHighlight: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  dataRangeSubtext: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  predictionSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitleContainer: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  dayDate: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  noDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  predictionContent: {
    // Content styling
  },
  mainPrediction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emotionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  emotionText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textTransform: 'capitalize',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  emotionBreakdown: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  emotionsList: {
    // Emotion list styling
  },
  emotionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  emotionName: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text,
    textTransform: 'capitalize',
  },
  emotionProbability: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  infoSection: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default CategoryPrediction;
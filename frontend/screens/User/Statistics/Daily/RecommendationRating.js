import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { 
  getWeeklyRecommendations, 
  generateRecommendations,
  submitRecommendationFeedback,
  getUserFeedbackForRecommendation
} from '../../../../services/recommendationService';

export default function RecommendationRating() {
  const route = useRoute();
  const navigation = useNavigation();
  const { 
    recommendationId, 
    hasExistingFeedback,
    moodScoreId, 
    date, 
    category, 
    activity 
  } = route.params || {};

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let foundRec = null;

        // Strategy 1: Try weekly recommendations
        try {
          const weekData = await getWeeklyRecommendations();
          foundRec = Array.isArray(weekData?.recommendations)
            ? weekData.recommendations.find((r) => r?._id === recommendationId)
            : null;
        } catch (e) {
          console.log('Weekly recommendations not available:', e);
        }

        // Strategy 2: Generate recommendations using original params
        if (!foundRec && (moodScoreId || (date && category))) {
          try {
            const payload = moodScoreId 
              ? { moodScoreId } 
              : { date, category, activity: activity || null };
            
            const recs = await generateRecommendations(payload);
            const list = Array.isArray(recs) ? recs : (recs?.recommendations || []);
            
            foundRec = list.find(r => r?._id === recommendationId);
            
            // Fallback to first recommendation
            if (!foundRec && list.length > 0) {
              foundRec = list[0];
            }
          } catch (e) {
            console.log('Generate recommendations failed:', e);
          }
        }

        setRecommendation(foundRec);

        // Load existing feedback if updating
        if (foundRec && hasExistingFeedback) {
          try {
            const feedbackData = await getUserFeedbackForRecommendation(recommendationId);
            if (feedbackData?.feedback) {
              setRating(feedbackData.feedback.rating || 0);
              setComment(feedbackData.feedback.comment || '');
            }
          } catch (error) {
            console.error('Error loading existing feedback:', error);
          }
        }
      } catch (error) {
        console.error('Error loading recommendation:', error);
        setRecommendation(null);
      }
      setLoading(false);
    };

    loadData();
  }, [recommendationId, moodScoreId, date, category, activity, hasExistingFeedback]);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!recommendationId) {
      Alert.alert('Error', 'Cannot submit feedback without a recommendation ID.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitRecommendationFeedback(recommendationId, rating, comment);

      Alert.alert(
        'Success!',
        hasExistingFeedback 
          ? 'Your feedback has been updated successfully!'
          : 'Thank you for your feedback! This helps us improve your recommendations.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ViewRecommendation', {
                recommendationId,
                recommendation: recommendation,
                feedback: {
                  rating: rating,
                  comment: comment
                },
                sentimentScore: result?.sentimentScore || 0,
                combinedScore: result?.combinedScore || 0,
                effective: result?.effective || false,
                moodScoreId,
                date,
                category,
                activity,
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit feedback. Please try again.');
    }
    setSubmitting(false);
  };

  const formatText = (text) => {
    if (!text) return '';
    return text
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const ratingEmojis = ['😟', '😐', '🙂', '😊', '🤩'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 8,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#1b5f52' }}>
              {hasExistingFeedback ? 'Update Rating' : 'Rate Recommendation'}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                  padding: 16,
                  height: 100,
                  justifyContent: 'center',
                }}
              >
                <View style={{ height: 12, width: '70%', backgroundColor: '#E6F4EA', borderRadius: 6, marginBottom: 10 }} />
                <View style={{ height: 12, width: '50%', backgroundColor: '#F7FBF9', borderRadius: 6 }} />
              </View>
            ))}
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <ActivityIndicator size="large" color="#55AD9B" />
            </View>
          </View>
        ) : recommendation ? (
          <View style={{ gap: 16 }}>
            {/* Info Banner */}
            <View
              style={{
                backgroundColor: '#FFF9E6',
                borderRadius: 16,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <MaterialIcons name="info-outline" size={22} color="#B45309" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: '#92400e', lineHeight: 18 }}>
                  {hasExistingFeedback 
                    ? 'Update your feedback to help us improve.' 
                    : 'Rate how helpful this recommendation was.'}
                </Text>
              </View>
            </View>

            {/* Recommendation Card */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 18,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <View
                  style={{
                    height: 44,
                    width: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="bulb" size={22} color="#55AD9B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: '#1b5f52', marginBottom: 6 }}>
                    Your Recommendation
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: '#4B5563', lineHeight: 20 }}>
                    {recommendation.recommendation}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {recommendation.category && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor: 'rgba(85, 173, 155, 0.1)',
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#55AD9B' }} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: '#1b5f52' }}>
                      {formatText(recommendation.category)}
                    </Text>
                  </View>
                )}
                {recommendation.activity && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor: 'rgba(149, 210, 179, 0.1)',
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#95D2B3' }} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: '#1b5f52' }}>
                      {formatText(recommendation.activity)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Rating Selector */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 18,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#1b5f52', marginBottom: 4 }}>
                How effective was this?
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
                Tap a rating from 1 (not helpful) to 5 (very helpful)
              </Text>

              <View style={{ alignItems: 'center', gap: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = n === rating;
                    return (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setRating(n)}
                        style={{
                          height: 52,
                          width: 52,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: active ? '#55AD9B' : '#F7FBF9',
                          borderWidth: active ? 0 : 1,
                          borderColor: '#E5E7EB',
                          transform: active ? [{ scale: 1.05 }] : [{ scale: 1 }],
                          shadowColor: active ? '#55AD9B' : 'transparent',
                          shadowOpacity: 0.3,
                          shadowOffset: { width: 0, height: 2 },
                          shadowRadius: 4,
                          elevation: active ? 3 : 0,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.bold,
                            fontSize: 18,
                            color: active ? '#fff' : '#55AD9B',
                          }}
                        >
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {rating > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 16,
                      backgroundColor: '#F7FBF9',
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{ratingEmojis[rating - 1]}</Text>
                    <View>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: '#1b5f52' }}>
                        {ratingLabels[rating - 1]}
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: '#6B7280' }}>
                        You rated this {rating}/5
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Comment Box */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 18,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#1b5f52' }}>
                  Share your thoughts
                </Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  }}
                >
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 10, color: '#92400e' }}>
                    OPTIONAL
                  </Text>
                </View>
              </View>

              <TextInput
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  padding: 12,
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: '#272829',
                  backgroundColor: '#FAFAFA',
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                placeholder="How did this recommendation help you?"
                placeholderTextColor="#9CA3AF"
              />

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10 }}>
                <MaterialIcons name="info-outline" size={16} color="#9CA3AF" />
                <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 11, color: '#9CA3AF', lineHeight: 16 }}>
                  Comments help us improve. Feel free to write in English or Filipino!
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !rating}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: submitting || !rating ? '#CBD5E1' : colors.secondary,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  shadowColor: submitting || !rating ? 'transparent' : '#55AD9B',
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: submitting || !rating ? 0 : 4,
                }}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#fff' }}>
                      Submitting...
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="send" size={18} color="#fff" />
                    <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: '#fff' }}>
                      {hasExistingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#fff',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#6B7280' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Note */}
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 }}>
                Your feedback helps us personalize recommendations for you
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 28,
              alignItems: 'center',
              marginTop: 40,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View
              style={{
                height: 70,
                width: 70,
                borderRadius: 35,
                backgroundColor: 'rgba(85, 173, 155, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <MaterialIcons name="search-off" size={36} color="#55AD9B" />
            </View>
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#1b5f52', marginBottom: 8, textAlign: 'center' }}>
              Recommendation Not Found
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20, lineHeight: 19 }}>
              We couldn't find this recommendation. Please try again from the recommendations screen.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: '#55AD9B',
                shadowColor: '#55AD9B',
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#fff' }}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
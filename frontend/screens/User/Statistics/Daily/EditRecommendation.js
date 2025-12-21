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
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { 
  getWeeklyRecommendations, 
  getRecommendationById,
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
    const loadRecommendation = async () => {
      setLoading(true);
      try {
        // Strategy 1: Try weekly recommendations first
        try {
          const weekData = await getWeeklyRecommendations();
          const byId = Array.isArray(weekData?.recommendations)
            ? weekData.recommendations.find((r) => r?._id === recommendationId)
            : null;

          if (byId) {
            setRecommendation(byId);
            
            // Load existing feedback if updating
            if (hasExistingFeedback) {
              await loadExistingFeedback();
            }
            
            setLoading(false);
            return;
          }
        } catch (e) {
          console.log('Weekly recommendations not available:', e);
        }

        // Strategy 2: Try direct recommendation fetch
        if (recommendationId) {
          try {
            const singleData = await getRecommendationById(recommendationId);
            if (singleData?.recommendation) {
              setRecommendation(singleData.recommendation);
              
              // Load existing feedback if updating
              if (hasExistingFeedback) {
                await loadExistingFeedback();
              }
              
              setLoading(false);
              return;
            }
          } catch (e) {
            console.log('Direct fetch failed:', e);
          }
        }

        // Strategy 3: Generate recommendations using original params
        if (moodScoreId || (date && category)) {
          try {
            const payload = moodScoreId 
              ? { moodScoreId } 
              : { date, category, activity: activity || null };
            
            const recs = await generateRecommendations(payload);
            const list = Array.isArray(recs) ? recs : (recs?.recommendations || []);
            
            // Find the specific recommendation by ID
            const foundRec = list.find(r => r?._id === recommendationId);
            
            if (foundRec) {
              setRecommendation(foundRec);
              
              // Load existing feedback if updating
              if (hasExistingFeedback) {
                await loadExistingFeedback();
              }
              
              setLoading(false);
              return;
            }
            
            // If no ID match, use the first recommendation as fallback
            if (list.length > 0) {
              setRecommendation(list[0]);
              
              // Load existing feedback if updating
              if (hasExistingFeedback) {
                await loadExistingFeedback();
              }
              
              setLoading(false);
              return;
            }
          } catch (e) {
            console.log('Generate recommendations failed:', e);
          }
        }

        // All strategies failed
        setRecommendation(null);
      } catch (error) {
        console.error('Error loading recommendation:', error);
        setRecommendation(null);
      }
      setLoading(false);
    };

    const loadExistingFeedback = async () => {
      try {
        const feedbackData = await getUserFeedbackForRecommendation(recommendationId);
        if (feedbackData?.feedback) {
          setRating(feedbackData.feedback.rating || 0);
          setComment(feedbackData.feedback.comment || '');
        }
      } catch (error) {
        console.error('Error loading existing feedback:', error);
      }
    };

    loadRecommendation();
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

      // Show success message
      Alert.alert(
        'Success!',
        hasExistingFeedback 
          ? 'Your feedback has been updated successfully!'
          : 'Thank you for your feedback! This helps us improve your recommendations.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Recommendation screen with refresh trigger
              navigation.navigate('Recommendation', {
                moodScoreId,
                date,
                category,
                activity,
                refresh: Date.now() // Force refresh
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
          paddingTop: 30,
          paddingBottom: 18,
          backgroundColor: '#fff',
          borderBottomWidth: 2,
          borderBottomColor: '#CBE7DC',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.8)',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: '#1b5f52' }}>
              {hasExistingFeedback ? 'Update Rating' : 'Rate Effectiveness'}
            </Text>
          </View>

          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <View style={{ gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: '#E6F4EA',
                }}
              >
                <View style={{ height: 16, width: '75%', backgroundColor: '#E6F4EA', borderRadius: 8, marginBottom: 12 }} />
                <View style={{ height: 16, width: '50%', backgroundColor: '#F7FBF9', borderRadius: 8 }} />
              </View>
            ))}
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          </View>
        ) : recommendation ? (
          <View style={{ gap: 16 }}>
            {/* Info Banner */}
            <View
              style={{
                backgroundColor: '#FEF3C7',
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderColor: 'rgba(251, 191, 36, 0.3)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <MaterialIcons name="info-outline" size={24} color="#92400e" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#92400e', marginBottom: 4 }}>
                    {hasExistingFeedback ? 'Update Your Rating' : 'Rate This Recommendation'}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#78350f', lineHeight: 20 }}>
                    {hasExistingFeedback 
                      ? 'You can update your rating and feedback for this recommendation.'
                      : 'Share how effective this recommendation was for you to help improve future suggestions.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Recommendation Card */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: '#D8EFD3',
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 999,
                    backgroundColor: 'rgba(85, 173, 155, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: 'rgba(85, 173, 155, 0.3)',
                  }}
                >
                  <Ionicons name="star" size={24} color="#55AD9B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#1b5f52', marginBottom: 8 }}>
                    Your Recommendation
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: '#272829', lineHeight: 22 }}>
                    {recommendation.recommendation}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {recommendation.category && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: 'rgba(85, 173, 155, 0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(85, 173, 155, 0.3)',
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#55AD9B' }} />
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: '#1b5f52' }}>
                      {formatText(recommendation.category)}
                    </Text>
                  </View>
                )}
                {recommendation.activity && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: 'rgba(149, 210, 179, 0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(149, 210, 179, 0.3)',
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#95D2B3' }} />
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: '#1b5f52' }}>
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
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: '#D8EFD3',
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#1b5f52', marginBottom: 4 }}>
                  How effective was this recommendation?
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#6b7280' }}>
                  Select a rating from 1 (not helpful) to 5 (very helpful)
                </Text>
              </View>

              <View style={{ alignItems: 'center', gap: 20 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = n === rating;
                    return (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setRating(n)}
                        style={{
                          height: 56,
                          width: 56,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 2,
                          backgroundColor: active ? '#55AD9B' : '#fff',
                          borderColor: active ? '#55AD9B' : '#D8EFD3',
                          transform: active ? [{ scale: 1.1 }] : [{ scale: 1 }],
                          shadowColor: active ? '#55AD9B' : '#000',
                          shadowOpacity: active ? 0.3 : 0.05,
                          shadowOffset: { width: 0, height: 2 },
                          shadowRadius: 6,
                          elevation: active ? 4 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.bold,
                            fontSize: 20,
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
                      gap: 12,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 999,
                      backgroundColor: '#F7FBF9',
                      borderWidth: 2,
                      borderColor: '#D8EFD3',
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{ratingEmojis[rating - 1]}</Text>
                    <View>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#1b5f52' }}>
                        {ratingLabels[rating - 1]}
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#6b7280' }}>
                        You rated this {rating} out of 5
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
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: '#D8EFD3',
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#1b5f52' }}>
                  Share your thoughts
                </Text>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(251, 191, 36, 0.3)',
                  }}
                >
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 12, color: '#92400e' }}>
                    Optional
                  </Text>
                </View>
              </View>

              <TextInput
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                style={{
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#E6F4EA',
                  padding: 12,
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: '#272829',
                  backgroundColor: 'rgba(247, 251, 249, 0.5)',
                  minHeight: 120,
                  textAlignVertical: 'top',
                }}
                placeholder="e.g., This helped me feel more relaxed and focused. Nakatulong talaga siya sa akin!"
                placeholderTextColor="#9CA3AF"
              />

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
                <MaterialIcons name="info-outline" size={18} color="#6b7280" />
                <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 12, color: '#6b7280', lineHeight: 18 }}>
                  Comments with at least 10 characters will be analyzed to better understand your experience. 
                  Feel free to write in Filipino, English, or a mix of both!
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: '#D8EFD3',
                  backgroundColor: '#fff',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#1b5f52' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !rating}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 999,
                  backgroundColor: submitting || !rating ? '#94A3B8' : '#55AD9B',
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
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#fff' }}>
                      {hasExistingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Note */}
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 }}>
                Your feedback helps us understand what works best for you and helps improve future recommendations.
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 32,
              borderWidth: 2,
              borderColor: '#D8EFD3',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View
              style={{
                height: 80,
                width: 80,
                borderRadius: 999,
                backgroundColor: 'rgba(85, 173, 155, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                borderWidth: 2,
                borderColor: 'rgba(85, 173, 155, 0.3)',
              }}
            >
              <MaterialIcons name="info-outline" size={40} color="#55AD9B" />
            </View>
            <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: '#1b5f52', marginBottom: 12, textAlign: 'center' }}>
              Recommendation Not Found
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              We couldn't find this recommendation. Please try again from the recommendations screen.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: '#55AD9B',
                shadowColor: '#55AD9B',
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: '#fff' }}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
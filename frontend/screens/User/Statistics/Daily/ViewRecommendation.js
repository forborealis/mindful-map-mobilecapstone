import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';

export default function ViewRecommendation() {
  const route = useRoute();
  const navigation = useNavigation();
  const {
    recommendationId,
    recommendation: passedRecommendation,
    feedback: passedFeedback,
    sentimentScore: passedSentiment,
    combinedScore: passedCombined,
    effective: passedEffective,
    moodScoreId,
    date,
    category,
    activity,
  } = route.params || {};

  const [recommendation, setRecommendation] = useState(passedRecommendation || null);
  const [feedback, setFeedback] = useState(passedFeedback || null);
  const [sentimentScore, setSentimentScore] = useState(passedSentiment ?? 0);
  const [combinedScore, setCombinedScore] = useState(passedCombined ?? 0);
  const [effective, setEffective] = useState(!!passedEffective);
  const [loading, setLoading] = useState(false);

  // Keep combinedScore / effective / sentimentScore in sync with feedback if present
  useEffect(() => {
    if (feedback) {
      if (typeof feedback.combinedScore === 'number') {
        setCombinedScore(feedback.combinedScore);
      }
      if (typeof feedback.effective === 'boolean') {
        setEffective(feedback.effective);
      }
      if (typeof feedback.sentimentScore === 'number') {
        setSentimentScore(feedback.sentimentScore);
      } else if (typeof feedback.scores?.combined === 'number') {
        setSentimentScore(feedback.scores.combined);
      }
    }
  }, [feedback]);

  // Helper function to format text: capitalize first letters and remove dashes
  const formatText = (text) => {
    if (!text) return '';
    return text
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const scorePct = Math.round(Math.max(0, Math.min(1, combinedScore)) * 100);
  const ratingEmojis = ['😟', '😐', '🙂', '😊', '🤩'];
  const ratingLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  // Sentiment label (VADER-style thresholds) derived from numeric sentimentScore
  const sentimentLabel = (() => {
    const s = Number(sentimentScore);
    if (Number.isNaN(s)) return 'Neutral';
    if (s >= 0.05) return 'Positive';
    if (s <= -0.05) return 'Negative';
    return 'Neutral';
  })();

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
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MoodHabitAnalysis')}
            style={{
              padding: 8,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#55AD9B" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#1b5f52' }}>
              Feedback Submitted
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
            {[1, 2].map((i) => (
              <View
                key={i}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  height: 100,
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    height: 12,
                    width: '70%',
                    backgroundColor: '#E6F4EA',
                    borderRadius: 6,
                    marginBottom: 10,
                  }}
                />
                <View
                  style={{
                    height: 12,
                    width: '50%',
                    backgroundColor: '#F7FBF9',
                    borderRadius: 6,
                  }}
                />
              </View>
            ))}
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <ActivityIndicator size="large" color="#55AD9B" />
            </View>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Success Banner */}
            <View
              style={{
                backgroundColor: '#55AD9B',
                borderRadius: 16,
                padding: 18,
                shadowColor: '#55AD9B',
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="check-circle" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 16,
                      color: '#fff',
                      marginBottom: 4,
                    }}
                  >
                    Feedback Submitted!
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    Your input helps us improve
                  </Text>
                </View>
              </View>
            </View>

            {/* Recommendation Card */}
            {recommendation && (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      height: 44,
                      width: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="star" size={22} color="#55AD9B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 15,
                        color: '#1b5f52',
                        marginBottom: 6,
                      }}
                    >
                      Your Recommendation
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        color: '#272829',
                        lineHeight: 20,
                      }}
                    >
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
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#55AD9B',
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: fonts.semiBold,
                          fontSize: 11,
                          color: '#1b5f52',
                        }}
                      >
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
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#95D2B3',
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: fonts.semiBold,
                          fontSize: 11,
                          color: '#1b5f52',
                        }}
                      >
                        {formatText(recommendation.activity)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Rating and Effectiveness Cards */}
            <View style={{ gap: 16 }}>
              {/* Your Rating */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 18,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 16,
                    color: '#1b5f52',
                    marginBottom: 14,
                  }}
                >
                  Your Rating
                </Text>

                {feedback?.rating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Text style={{ fontSize: 52 }}>
                      {ratingEmojis[feedback.rating - 1]}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 36,
                          fontFamily: fonts.bold,
                          color: '#55AD9B',
                        }}
                      >
                        {feedback.rating}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#6b7280',
                          marginBottom: 3,
                        }}
                      >
                        out of 5
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: fonts.semiBold,
                          color: '#1b5f52',
                        }}
                      >
                        {ratingLabels[feedback.rating - 1]}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 13,
                      color: '#6b7280',
                    }}
                  >
                    No rating provided
                  </Text>
                )}
              </View>

              {/* Effectiveness */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 18,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 16,
                    color: '#1b5f52',
                    marginBottom: 14,
                  }}
                >
                  Effectiveness
                </Text>

                <View style={{ gap: 14 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      alignSelf: 'flex-start',
                      backgroundColor: effective
                        ? 'rgba(85, 173, 155, 0.1)'
                        : 'rgba(255, 152, 0, 0.1)',
                      borderWidth: 1.5,
                      borderColor: effective
                        ? 'rgba(85, 173, 155, 0.3)'
                        : 'rgba(255, 152, 0, 0.3)',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 14,
                        color: effective ? '#1b5f52' : '#92400e',
                      }}
                    >
                      {effective ? '✓ Effective' : '✗ Needs Improvement'}
                    </Text>
                  </View>

                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 13,
                          color: '#6b7280',
                        }}
                      >
                        Combined Score
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 13,
                          color: '#1b5f52',
                        }}
                      >
                        {scorePct}%
                      </Text>
                    </View>
                    <View
                      style={{
                        width: '100%',
                        height: 10,
                        backgroundColor: '#E6F4EA',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${scorePct}%`,
                          backgroundColor: '#55AD9B',
                          borderRadius: 999,
                        }}
                      />
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="emoticon-happy-outline"
                      size={18}
                      color="#6b7280"
                    />
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 13,
                        color: '#6b7280',
                      }}
                    >
                      Sentiment Analysis: {sentimentLabel}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Comment */}
            {feedback?.comment && (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 18,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <MaterialIcons name="comment" size={20} color="#55AD9B" />
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 16,
                      color: '#1b5f52',
                    }}
                  >
                    Your Thoughts
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 14,
                    color: '#272829',
                    lineHeight: 20,
                  }}
                >
                  {feedback.comment}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('MoodHabitAnalysis')}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: colors.secondary,
                  alignItems: 'center',
                  shadowColor: '#55AD9B',
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 15,
                    color: '#fff',
                  }}
                >
                  Back to Daily Analysis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Recommendation', {
                    recommendationId,
                    moodScoreId,
                    date,
                    category,
                    activity,
                  })
                }
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#fff',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 14,
                    color: '#1b5f52',
                  }}
                >
                  View Recommendations
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Note */}
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: '#f1f3f6ff',
                  textAlign: 'center',
                  lineHeight: 18,
                }}
              >
                Thank you for sharing your feedback! Your insights help us personalize your
                experience.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
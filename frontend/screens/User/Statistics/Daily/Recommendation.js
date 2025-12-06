import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { generateRecommendations } from '../../../../services/recommendationService';

export default function Recommendation() {
  const route = useRoute();
  const navigation = useNavigation();
  const { moodScoreId, date, category, activity } = route.params || {};

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchRecommendations = async () => {
      setLoading(true);
      setErrorText('');

      const hasKey = !!(date && category);
      const hasId = !!moodScoreId;

      if (!hasId && !hasKey) {
        if (mounted) {
          setRecommendations([]);
          setLoading(false);
        }
        return;
      }

      try {
        // Always send an object payload
        const payload = hasId ? { moodScoreId } : { date, category, activity: activity || null };
        const recs = await generateRecommendations(payload);

        const list = Array.isArray(recs) ? recs : (recs?.recommendations || []);

        if (mounted) {
          setRecommendations(Array.isArray(list) ? list : []);
          if (!list || list.length === 0) {
            setErrorText('No recommendation found for the selected input.');
          }
        }
      } catch (e) {
        if (mounted) {
          setRecommendations([]);
          setErrorText('Failed to load recommendations.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => { mounted = false; };
  }, [moodScoreId, date, category, activity]);

  const items = Array.isArray(recommendations) ? recommendations : [];
  const noParams = !moodScoreId && !(date && category);

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: 30,
          height: 74, // 56 + 18
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          zIndex: 101,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Ionicons name="arrow-back" size={26} color="#222" />
          <Text style={{ marginLeft: 6, color: '#222', fontFamily: fonts.semiBold }}>Back</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#7EC6A9',
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <MaterialIcons name="local-fire-department" size={18} color="#fff" />
            <Text style={{ marginLeft: 6, color: '#fff', fontFamily: fonts.semiBold, fontSize: 12 }}>
              Daily Growth
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 74 }}>
        <View style={{ paddingHorizontal: 12, paddingBottom: 24 }}>
          {/* Card */}
          <View
            style={{
              borderRadius: 24,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#E8F5E9',
              padding: 16,
              marginTop: 8,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {/* Top row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                <View
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#95D2B3',
                  }}
                >
                  <MaterialIcons name="emoji-objects" size={22} color="#fff" />
                </View>
                <View style={{ marginLeft: 10, flexShrink: 1 }}>
                  <Text
                    style={{ fontFamily: fonts.bold, fontSize: 20, color: '#1b5f52' }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Personalized Recommendations
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.medium, fontSize: 12, color: '#3e8e7e' }}
                    numberOfLines={2}
                  >
                    “Small steps each day lead to big changes over time.”
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F1F8E8',
                  borderWidth: 1,
                  borderColor: '#D8EFD3',
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  marginTop: 8,
                }}
              >
                <MaterialIcons name="celebration" size={18} color="#2f6c60" />
                <Text style={{ marginLeft: 6, color: '#2f6c60', fontFamily: fonts.semiBold, fontSize: 12 }}>
                  Your daily boost
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#E6F4EA', marginTop: 12 }} />

            {/* Content */}
            {loading ? (
              <View style={{ marginTop: 12 }}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: '#F7FBF4',
                      borderWidth: 1,
                      borderColor: '#E6F4EA',
                      borderRadius: 16,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ height: 12, width: '66%', backgroundColor: '#DDEFE3', borderRadius: 6, marginBottom: 6 }} />
                    <View style={{ height: 12, width: '50%', backgroundColor: '#E6F4EA', borderRadius: 6 }} />
                  </View>
                ))}
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              </View>
            ) : noParams ? (
              <View style={{ alignItems: 'center', marginTop: 16, paddingHorizontal: 6 }}>
                <View
                  style={{
                    height: 56,
                    width: 56,
                    borderRadius: 999,
                    backgroundColor: '#E6F4EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons name="sentiment-satisfied-alt" size={28} color="#55AD9B" />
                </View>
                <Text style={{ color: '#2b3b36', fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' }}>
                  No selection provided. Use “View Recommendation” from Daily Analysis.
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    backgroundColor: colors.primary,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                  }}
                  onPress={() => navigation.navigate('DailyAnova')}
                >
                  <Text style={{ color: '#fff', fontFamily: fonts.semiBold, fontSize: 13 }}>
                    Go to Daily Analysis
                  </Text>
                </TouchableOpacity>
              </View>
            ) : items.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                {items.map((item, idx) => {
                  const text = typeof item === 'string' ? item : item?.recommendation;
                  const key = (typeof item === 'object' && item?._id) || `rec-${idx}`;
                  return (
                    <View
                      key={key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        borderWidth: 1,
                        borderColor: '#E6F4EA',
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        padding: 12,
                        marginBottom: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.04,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <View
                        style={{
                          height: 36,
                          width: 36,
                          borderRadius: 999,
                          backgroundColor: '#95D2B3',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                          marginTop: 2,
                        }}
                      >
                        <MaterialIcons name="check-circle" size={22} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: '#1f2a27', fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 }}
                        >
                          {text}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Footer CTA */}
                <View
                  style={{
                    marginTop: 8,
                    backgroundColor: '#F7FBF4',
                    borderWidth: 1,
                    borderColor: '#E6F4EA',
                    borderRadius: 16,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: '#2f6c60', fontFamily: fonts.semiBold, fontSize: 14, marginBottom: 4 }}>
                    Stay consistent
                  </Text>
                  <Text style={{ color: '#2f6c60', fontFamily: fonts.regular, fontSize: 12 }}>
                    Try one recommendation today and note how you feel after.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <View
                  style={{
                    height: 56,
                    width: 56,
                    borderRadius: 999,
                    backgroundColor: '#E6F4EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons name="sentiment-satisfied-alt" size={28} color="#55AD9B" />
                </View>
                <Text style={{ color: '#2b3b36', fontFamily: fonts.medium, fontSize: 14 }}>
                  {errorText || 'No recommendation found.'}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom center text */}
          <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 24 }}>
            <Text
              style={{
                color: '#ffffff',
                opacity: 0.95,
                fontFamily: fonts.medium,
                textAlign: 'center',
              }}
            >
              Designed for mindfulness • Built for daily progress
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
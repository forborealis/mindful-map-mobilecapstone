import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, Entypo } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors/colors';
import { fonts } from '../../../../utils/fonts/fonts';
import { moodDataService } from '../../../../services/moodDataService';

// Skeleton component
const SkeletonBox = ({ width, height, style }) => (
  <View
    style={[
      {
        backgroundColor: '#e5e7eb',
        borderRadius: 14,
        width,
        height,
        marginBottom: 16,
        opacity: 0.5,
      },
      style,
    ]}
  />
);

const CATEGORY_ICONS = {
  sleep: <MaterialCommunityIcons name="bed" size={32} color="#55AD9B" />,
  activity: <MaterialIcons name="emoji-events" size={32} color="#55AD9B" />,
  social: <Ionicons name="people" size={32} color="#55AD9B" />,
  health: <MaterialIcons name="favorite" size={32} color="#55AD9B" />,
};

const ACTIVITY_LABELS = {
  commute: 'Commuting',
  exam: 'Having an exam',
  homework: 'Doing your homework',
  study: 'Studying',
  project: 'Doing a project',
  read: 'Reading',
  extracurricular: 'Doing an extracurricular activity',
  'household-chores': 'Doing household chores',
  relax: 'Relaxing',
  'watch-movie': 'Watching a movie',
  'listen-music': 'Listening to music',
  gaming: 'Gaming',
  'browse-internet': 'Browsing the internet',
  shopping: 'Shopping',
  travel: 'Traveling',
  alone: 'Being alone',
  friends: 'Socializing with your friends',
  family: 'Socializing with your family',
  classmates: 'Socializing with your classmates',
  relationship: 'Socializing with your significant other',
  online: 'Socializing online',
  pet: 'Being with your pet',
  jog: 'Jogging',
  walk: 'Walking',
  exercise: 'Exercising',
  sports: 'Playing a sport',
  meditate: 'Meditating',
  'eat-unhealthy': 'Eating unhealthy food',
  'eat-healthy': 'Eating healthy food',
  'no-physical': 'Not doing any physical activity',
  'drink-alcohol': 'Drinking alcohol'
};

const sleepQualityColors = {
  Poor: '#ff6b6b',
  Sufficient: '#f7b801',
  Good: '#55AD9B'
};

const POSITIVE_COLOR = '#55AD9B';
const NEGATIVE_COLOR = '#FF9800';

// --- Mood message variants for sync with web ---
function smartLabel(label, suffix) {
  if (!label) return '';
  if (suffix === 'r') {
    // Try to make label gerund if possible (simple heuristic)
    if (label.endsWith('ing')) return label;
    if (label.endsWith('e')) return label.slice(0, -1) + 'ing';
    return label + 'ing';
  }
  if (suffix === '!') return label + '!';
  if (suffix === '—') return label + '—';
  return label;
}

const POSITIVE_VARIANTS = [
  (label, score) => `${smartLabel(label, '')} boosted your mood by ${score}%. Keep it up!`,
  (label, score) => `Great job! ${smartLabel(label, '!')} increased your mood by ${score}%.`,
  (label, score) => `Awesome! ${smartLabel(label, '!')} helped you feel ${score}% better.`,
  (label, score) => `You felt ${score}% better after ${smartLabel(label, 'r')}. Keep doing what works!`,
  (label, score) => `${smartLabel(label, '')} made a positive difference of ${score}% in your mood!`
];

const NEGATIVE_VARIANTS = [
  (label, score) => `${smartLabel(label, '')} lowered your mood by ${score}%. That's okay—tomorrow is a new day!`,
  (label, score) => `You felt ${score}% less upbeat after ${smartLabel(label, 'r')}. Remember, every day is a learning experience!`,
  (label, score) => `${smartLabel(label, '')} had a negative impact of ${score}% on your mood. Take care of yourself!`,
  (label, score) => `Not every activity lifts us up—${smartLabel(label, '—')} decreased your mood by ${score}%. You’ve got this!`,
  (label, score) => `After ${smartLabel(label, '!')}, your mood dropped by ${score}%. Be kind to yourself and try again!`
];

const NEUTRAL_VARIANTS = [
  (label) => `${smartLabel(label, '')} had a neutral effect on your mood.`,
  (label) => `No big mood changes after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} kept your mood steady.`,
  (label) => `Your mood stayed about the same after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} didn't change your mood much this time.`
];

const getMoodMessage = (activity, moodScore, idx = 0) => {
  const absScore = Math.abs(moodScore);
  const label = ACTIVITY_LABELS[activity] || formatText(activity);

  let variants;
  if (moodScore > 0) {
    variants = POSITIVE_VARIANTS;
  } else if (moodScore < 0) {
    variants = NEGATIVE_VARIANTS;
  } else {
    variants = NEUTRAL_VARIANTS;
  }
  const variantIndex = idx % variants.length;
  return variants[variantIndex](label, absScore);
};

function formatText(text) {
  if (!text) return '';
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getMoodIcon(score) {
  if (score > 0) return <MaterialIcons name="trending-up" size={20} color={POSITIVE_COLOR} />;
  if (score < 0) return <MaterialIcons name="trending-down" size={20} color={NEGATIVE_COLOR} />;
  return <Entypo name="minus" size={20} color="#f7b801" />;
}

function getSleepMessage(hours, moodScore) {
  const absScore = Math.abs(moodScore);
  if (moodScore > 0) {
    return `Sleeping for ${hours} hours improved your mood by ${absScore}%. Great job!`;
  } else if (moodScore < 0) {
    return `Having ${hours} hours of sleep lowered your mood by ${absScore}%. Try to get more restful sleep.`;
  } else {
    return `Your sleep had a neutral effect on your mood today.`;
  }
}

function getDateString(date) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function DailyAnova() {
  const navigation = useNavigation();
  const [results, setResults] = useState({});
  const [sleepQuality, setSleepQuality] = useState(null);
  const [sleepHours, setSleepHours] = useState(null);
  const [sleepMoodScore, setSleepMoodScore] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnova = async () => {
      setLoading(true);
      try {
        const data = await moodDataService.getDailyAnova(date);
        setResults(data.results || {});
        setSleepQuality(data.sleepQuality);
        setSleepHours(data.sleepHours);
        setSleepMoodScore(data.sleepMoodScore);
      } catch (error) {
        console.error('Error fetching daily anova:', error);
      }
      setLoading(false);
    };
    fetchAnova();
  }, [date]);

  const handlePrev = () => setDate(addDays(date, -1));
  const handleNext = () => setDate(addDays(date, 1));

  const getDayLabel = () => {
    const today = new Date().toISOString().split('T')[0];
    if (date === today) return 'Today';
    return getDateString(date);
  };

  function renderCategoryResults(category, data) {
    if (!data || (!data.positive?.length && !data.negative?.length)) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
          <Text style={{ color: '#888', fontSize: 16, fontFamily: fonts.medium, textAlign: 'center' }}>
            No data for this category
          </Text>
        </View>
      );
    }
    return (
      <View>
        {data.positive && data.positive.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MaterialIcons name="trending-up" size={20} color={POSITIVE_COLOR} />
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 16,
                color: POSITIVE_COLOR,
                marginLeft: 6,
              }}>
                Habits that boosted your mood
              </Text>
            </View>
            {data.positive.map((item, idx) => (
              <View
                key={item.activity}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F1F8E8',
                  borderWidth: 2,
                  borderColor: POSITIVE_COLOR,
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  minHeight: 60,
                }}
              >
                <View style={{ marginRight: 10 }}>{getMoodIcon(item.moodScore)}</View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    color: '#272829',
                    fontFamily: fonts.medium,
                  }}>
                    {getMoodMessage(item.activity, item.moodScore, idx)}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: POSITIVE_COLOR,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  marginLeft: 8,
                }}>
                  <Text style={{
                    color: '#fff',
                    fontFamily: fonts.bold,
                    fontSize: 15,
                  }}>
                    {`${Math.abs(item.moodScore)}%`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {data.negative && data.negative.length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MaterialIcons name="trending-down" size={20} color={NEGATIVE_COLOR} />
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 16,
                color: NEGATIVE_COLOR,
                marginLeft: 6,
              }}>
                Habits that lowered your mood
              </Text>
            </View>
            {data.negative.map((item, idx) => (
              <View
                key={item.activity}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFF7E6',
                  borderWidth: 2,
                  borderColor: NEGATIVE_COLOR,
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  minHeight: 60,
                }}
              >
                <View style={{ marginRight: 10 }}>{getMoodIcon(item.moodScore)}</View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    color: '#272829',
                    fontFamily: fonts.medium,
                  }}>
                    {getMoodMessage(item.activity, item.moodScore, idx)}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: NEGATIVE_COLOR,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  marginLeft: 8,
                }}>
                  <Text style={{
                    color: '#fff',
                    fontFamily: fonts.bold,
                    fontSize: 15,
                  }}>
                    {`${Math.abs(item.moodScore)}%`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  // Card data for rendering
  const gridData = [
    {
      key: 'sleep',
      title: 'Sleep',
      icon: CATEGORY_ICONS.sleep,
      header: 'How your sleep affected your mood',
      content: (
        <View style={{ alignItems: 'center', width: '100%' }}>
          {sleepQuality && sleepHours ? (
            <View style={{
              alignItems: 'center',
              width: '100%',
            }}>
              {sleepMoodScore !== null && (
                <View style={{
                  alignItems: 'center',
                  backgroundColor: '#FFF7E6',
                  borderWidth: 2,
                  borderColor: sleepMoodScore > 0
                    ? POSITIVE_COLOR
                    : sleepMoodScore < 0
                      ? NEGATIVE_COLOR
                      : '#f7b801',
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 12,
                  width: '100%',
                  marginBottom: 4,
                }}>
                  <View style={{
                    backgroundColor: sleepQualityColors[sleepQuality],
                    borderRadius: 999,
                    paddingHorizontal: 18,
                    paddingVertical: 4,
                    marginBottom: 10,
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontFamily: fonts.semiBold,
                      fontSize: 15,
                    }}>
                      {formatText(sleepQuality)}
                    </Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'center',
                  }}>
                    <View style={{ marginRight: 8 }}>{getMoodIcon(sleepMoodScore)}</View>
                    <Text style={{
                      fontSize: 15,
                      color: '#272829',
                      flex: 1,
                      textAlign: 'center',
                      marginHorizontal: 8,
                      fontFamily: fonts.medium,
                    }}>
                      {getSleepMessage(sleepHours, sleepMoodScore)}
                    </Text>
                    <View style={{
                      backgroundColor: sleepMoodScore > 0
                        ? POSITIVE_COLOR
                        : sleepMoodScore < 0
                          ? NEGATIVE_COLOR
                          : '#f7b801',
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      marginLeft: 8,
                    }}>
                      <Text style={{
                        color: '#fff',
                        fontFamily: fonts.bold,
                        fontSize: 15,
                      }}>
                        {`${Math.abs(sleepMoodScore)}%`}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 80, width: '100%' }}>
              <Text style={{ color: '#888', fontSize: 16, fontFamily: fonts.medium, textAlign: 'center' }}>
                No sleep data recorded
              </Text>
            </View>
          )}
        </View>
      ),
    },
    {
      key: 'activity',
      title: 'Overall Activities',
      icon: CATEGORY_ICONS.activity,
      header: 'How your activities affected your mood',
      content: renderCategoryResults('activity', results.activity)
    },
    {
      key: 'social',
      title: 'Social',
      icon: CATEGORY_ICONS.social,
      header: 'How your social life affected your mood',
      content: renderCategoryResults('social', results.social)
    },
    {
      key: 'health',
      title: 'Health',
      icon: CATEGORY_ICONS.health,
      header: 'How your health habits affected your mood',
      content: renderCategoryResults('health', results.health)
    }
  ];

  // --- SKELETONS ---
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 10, marginTop: 50, marginBottom: 18 }}>
            {/* Date Navigation Skeleton */}
            <SkeletonBox width="100%" height={60} style={{ borderRadius: 18, marginBottom: 24 }} />
            {/* Card skeletons */}
            {[...Array(4)].map((_, i) => (
              <SkeletonBox key={i} width="100%" height={140} style={{ borderRadius: 18 }} />
            ))}
            {/* Motivational Footer Skeleton */}
            <SkeletonBox width="100%" height={60} style={{ borderRadius: 18, marginTop: 10 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- MAIN RENDER ---
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Back Button */}
        <View
          style={{
            position: 'absolute',
            top: 38,
            left: 18,
            zIndex: 100,
            elevation: 10,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
        </View>
        {/* Date Navigation */}
        <View
          style={{
            backgroundColor: '#fff',
            marginTop: 74,
            marginBottom: 24,
            paddingVertical: 18,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
          }}
        >
          <TouchableOpacity
            onPress={handlePrev}
            style={{
              padding: 10,
              marginRight: 18,
            }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: colors.primary,
                textAlign: 'center',
              }}
            >
              {getDayLabel()}
            </Text>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 15,
                color: '#888',
                textAlign: 'center',
                marginTop: 2,
              }}
            >
              {getDateString(date)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleNext}
            disabled={date >= new Date().toISOString().split('T')[0]}
            style={{
              padding: 10,
              marginLeft: 18,
              opacity: date >= new Date().toISOString().split('T')[0] ? 0.5 : 1,
            }}
          >
            <Ionicons name="chevron-forward" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View style={{ paddingHorizontal: 10, marginBottom: 18 }}>
          {gridData.map((cat, idx) => (
            <View
              key={cat.key}
              style={{
                borderRadius: 18,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
                borderWidth: 2,
                borderColor: '#D8EFD3',
                backgroundColor: '#fff',
                marginBottom: 18,
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 18,
                paddingHorizontal: 16,
                backgroundColor: '#95D2B3',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
              }}>
                <View>{cat.icon}</View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 20,
                    color: '#fff',
                  }}>
                    {cat.title}
                  </Text>
                  <Text style={{
                    color: '#fff',
                    opacity: 0.9,
                    fontFamily: fonts.medium,
                    fontSize: 14,
                    marginTop: 2,
                  }}>
                    {cat.header}
                  </Text>
                </View>
              </View>
              {/* Card content */}
              <View style={{ padding: 16 }}>
                {cat.content}
              </View>
            </View>
          ))}
          {/* Motivational Footer */}
          <View style={{
            alignItems: 'center',
            backgroundColor: '#D8EFD3',
            borderRadius: 18,
            padding: 18,
            marginTop: 10,
            marginBottom: 30,
          }}>
            <Text style={{
              color: '#272829',
              fontSize: 16,
              fontFamily: fonts.medium,
              textAlign: 'center',
            }}>
              🌟 Every day is a new opportunity to nurture your well-being! 🌟
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
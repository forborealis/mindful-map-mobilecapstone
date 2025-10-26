import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { moodDataService } from '../../services/moodDataService';
import { colors } from '../../utils/colors/colors';
import { fonts } from '../../utils/fonts/fonts';

const CATEGORY_LABELS = {
  activity: 'Activities',
  social: 'Social',
  health: 'Health',
  sleep: 'Sleep'
};

const emotionImages = {
  calm: require('../../assets/images/mood/emotions/calm.png'),
  relaxed: require('../../assets/images/mood/emotions/relaxed.png'),
  pleased: require('../../assets/images/mood/emotions/pleased.png'),
  happy: require('../../assets/images/mood/emotions/happy.png'),
  excited: require('../../assets/images/mood/emotions/excited.png'),
  bored: require('../../assets/images/mood/emotions/bored.png'),
  sad: require('../../assets/images/mood/emotions/sad.png'),
  disappointed: require('../../assets/images/mood/emotions/disappointed.png'),
  angry: require('../../assets/images/mood/emotions/angry.png'),
  tense: require('../../assets/images/mood/emotions/tense.png')
};

const sleepImage = require('../../assets/images/mood/others/sleep.png');

const activityImages = {
  study: require('../../assets/images/mood/study.png'),
  read: require('../../assets/images/mood/read.png'),
  extracurricular: require('../../assets/images/mood/extraCurricularActivities.png'),
  relax: require('../../assets/images/mood/relax.png'),
  'watch-movie': require('../../assets/images/mood/watchMovie.png'),
  'listen-music': require('../../assets/images/mood/listenToMusic.png'),
  gaming: require('../../assets/images/mood/gaming.png'),
  'browse-internet': require('../../assets/images/mood/browseInternet.png'),
  shopping: require('../../assets/images/mood/shopping.png'),
  travel: require('../../assets/images/mood/travel.png'),
  alone: require('../../assets/images/mood/alone.png'),
  friends: require('../../assets/images/mood/friend.png'),
  family: require('../../assets/images/mood/family.png'),
  classmates: require('../../assets/images/mood/classmate.png'),
  relationship: require('../../assets/images/mood/relationship.png'),
  pet: require('../../assets/images/mood/pet.png'),
  jog: require('../../assets/images/mood/jog.png'),
  walk: require('../../assets/images/mood/walk.png'),
  exercise: require('../../assets/images/mood/exercise.png'),
  meditate: require('../../assets/images/mood/meditate.png'),
  'eat-healthy': require('../../assets/images/mood/eatHealthy.png'),
  'no-physical': require('../../assets/images/mood/noPhysicalActivity.png'),
  'eat-unhealthy': require('../../assets/images/mood/eatUnhealthy.png'),
  'drink-alcohol': require('../../assets/images/mood/drinkAlcohol.png')
};

const SkeletonBox = ({ width, height, style }) => (
  <View
    style={[
      {
        backgroundColor: colors.secondary,
        borderRadius: 8,
        width,
        height,
        marginBottom: 8
      },
      style
    ]}
  />
);

const MoodEntries = ({ navigation }) => {
  const [moodLogs, setMoodLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showSortModal, setShowSortModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchMoodLogs();
    }, [sortOrder])
  );

  const fetchMoodLogs = async () => {
    setLoading(true);
    try {
      const result = await moodDataService.getUserMoodLogs({ limit: 100, page: 1 });
      if (result.success) {
        setMoodLogs(result.moodLogs || []);
      }
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMoodLogs();
  }, []);

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredLogs = moodLogs
    .filter(log => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          log.category?.toLowerCase().includes(term) ||
          log.activity?.toLowerCase().includes(term) ||
          log.date?.toLowerCase().includes(term) ||
          log.beforeEmotion?.toLowerCase().includes(term) ||
          log.afterEmotion?.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const groupedLogs = {};
  filteredLogs.forEach(log => {
    const dateKey = new Date(log.date).toDateString();
    if (!groupedLogs[dateKey]) groupedLogs[dateKey] = [];
    groupedLogs[dateKey].push(log);
  });

  const getActivityIcon = (activity, category) => {
    if (category === 'sleep') {
      return (
        <Image
          source={sleepImage}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10
          }}
          resizeMode="contain"
        />
      );
    }
    if (activity && activityImages[activity]) {
      return (
        <Image
          source={activityImages[activity]}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10
          }}
          resizeMode="contain"
        />
      );
    }
    return <Text style={{ fontSize: 28 }}>📝</Text>;
  };

  // Entry card
  const renderMoodEntry = (log) => (
    <View
      key={log._id}
      style={{
        backgroundColor: colors.accent,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.primary,
        marginBottom: 18,
        padding: 16,
        shadowColor: colors.primary,
        shadowOpacity: 0.07,
        shadowRadius: 8
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ marginRight: 10 }}>
          {getActivityIcon(log.activity, log.category)}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontFamily: fonts.semiBold,
            fontSize: 17,
            color: colors.text
          }}>
            {CATEGORY_LABELS[log.category] || formatText(log.category)}
          </Text>
          <Text style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: colors.text,
            marginBottom: 2
          }}>
            {formatText(log.activity)}{log.hrs ? ` • ${log.hrs} hrs` : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={14} color={colors.text} />
            <Text style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: colors.text,
              marginLeft: 4
            }}>
              {formatTime(log.date)}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Before */}
        <View style={{
          flex: 1,
          backgroundColor: colors.primary,
          padding: 12,
          borderRadius: 14,
          marginRight: 5
        }}>
          <Text style={{
            fontFamily: fonts.semiBold,
            fontSize: 13,
            color: colors.background,
            marginBottom: 7
          }}>
            Before Activity
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            {emotionImages[log.beforeEmotion] ? (
              <Image
                source={emotionImages[log.beforeEmotion]}
                style={{ width: 32, height: 32, marginRight: 8 }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: 26, marginRight: 8 }}>😐</Text>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: colors.text
              }}>
                {formatText(log.beforeEmotion)}
              </Text>
              <Text style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: colors.text,
                opacity: 0.7
              }}>
                {formatText(log.beforeValence)} • Intensity: {log.beforeIntensity}/5
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 3 }}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  marginRight: 3,
                  backgroundColor: i < log.beforeIntensity ? colors.accent || colors.primary : colors.secondary
                }}
              />
            ))}
          </View>
          {log.beforeReason ? (
            <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: colors.accent || colors.primary, paddingTop: 6 }}>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: colors.text,
                marginBottom: 2
              }}>Reason:</Text>
              <Text style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: colors.text
              }}>{log.beforeReason}</Text>
            </View>
          ) : null}
        </View>
        {/* After */}
        <View style={{
          flex: 1,
          backgroundColor: colors.primary,
          padding: 12,
          borderRadius: 14,
          marginLeft: 5
        }}>
          <Text style={{
            fontFamily: fonts.semiBold,
            fontSize: 13,
            color: colors.background,
            marginBottom: 7
          }}>
            After Activity
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            {emotionImages[log.afterEmotion] ? (
              <Image
                source={emotionImages[log.afterEmotion]}
                style={{ width: 32, height: 32, marginRight: 8 }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: 26, marginRight: 8 }}>😐</Text>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: colors.text
              }}>
                {formatText(log.afterEmotion)}
              </Text>
              <Text style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: colors.text,
                opacity: 0.7
              }}>
                {formatText(log.afterValence)} • Intensity: {log.afterIntensity}/5
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 3 }}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  marginRight: 3,
                  backgroundColor: i < log.afterIntensity ? colors.accent || colors.primary : colors.secondary
                }}
              />
            ))}
          </View>
          {log.afterReason ? (
            <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: colors.accent || colors.primary, paddingTop: 6 }}>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: colors.text,
                marginBottom: 2
              }}>Reason:</Text>
              <Text style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: colors.text
              }}>{log.afterReason}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  const renderGroupedLogs = () => {
    if (Object.keys(groupedLogs).length === 0) {
      return (
        <View style={{
          backgroundColor: colors.secondary,
          borderRadius: 18,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.primary,
          marginTop: 40
        }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>😌</Text>
          <Text style={{
            fontFamily: fonts.semiBold,
            fontSize: 20,
            color: colors.text,
            marginBottom: 8
          }}>
            No entries found
          </Text>
          <Text style={{
            fontFamily: fonts.regular,
            fontSize: 15,
            color: colors.text,
            textAlign: 'center',
            lineHeight: 22
          }}>
            {searchTerm
              ? "Try adjusting your search to find more entries."
              : "Start your mood tracking journey! Add your first mood entry."}
          </Text>
        </View>
      );
    }
    return Object.entries(groupedLogs).map(([dateKey, logs]) => {
      const date = new Date(dateKey);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return (
        <View key={dateKey} style={{ marginBottom: 28 }}>
          <View style={{
            backgroundColor: colors.background,
            padding: 14,
            borderRadius: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.primary,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <View style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.primary,
              marginRight: 10
            }} />
            <Text style={{
              fontFamily: fonts.semiBold,
              fontSize: 18,
              color: colors.text,
              flex: 1
            }}>
              {formattedDate}
            </Text>
            <View style={{
              backgroundColor: colors.accent,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 12
            }}>
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: colors.primary
              }}>
                {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
          </View>
          {logs.map(renderMoodEntry)}
        </View>
      );
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        paddingTop: 30,
        paddingHorizontal: 10,
        paddingBottom: 5,
        backgroundColor: colors.secondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Ionicons name="trending-up" size={24} color={colors.text} />
            <Text style={{
              fontFamily: fonts.semiBold,
              fontSize: 22,
              color: colors.text,
              marginLeft: 8
            }}>
              Mood Insights
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            style={{ marginLeft: 10 }}
          >
            <Ionicons name="swap-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.background,
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 10,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: colors.primary,
          alignItems: 'center',
          height: 48
        }}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            placeholder="Search entries..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={{
              flex: 1,
              marginLeft: 10,
              fontFamily: fonts.regular,
              fontSize: 16,
              color: colors.text,
              height: 48
            }}
            placeholderTextColor={colors.primary}
          />
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 24,
            alignItems: 'center',
            marginBottom: 10,
            marginTop: 2,
            width: '70%',
            alignContent: 'center',
            alignSelf: 'center'
          }}
          onPress={() => navigation.navigate('ChooseCategory')}
        >
          <Text style={{
            fontFamily: fonts.semiBold,
            fontSize: 16,
            color: colors.background
          }}>
            + Add Entry
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View>
            {[...Array(3)].map((_, idx) => (
              <View key={idx} style={{
                backgroundColor: colors.accent,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.primary,
                marginBottom: 18,
                padding: 16
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <SkeletonBox width={40} height={40} style={{ marginRight: 10, borderRadius: 20 }} />
                  <View style={{ flex: 1 }}>
                    <SkeletonBox width="60%" height={18} />
                    <SkeletonBox width="40%" height={14} />
                    <SkeletonBox width="30%" height={12} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <SkeletonBox width="100%" height={80} style={{ borderRadius: 14 }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SkeletonBox width="100%" height={80} style={{ borderRadius: 14 }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : renderGroupedLogs()}
      </ScrollView>
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#00000055',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 18,
            padding: 24,
            width: '80%',
            maxWidth: 340
          }}>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 18,
                color: colors.text,
                marginBottom: 18,
                textAlign: 'center'
              }}
            >
              Sort Options
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSortOrder('newest');
                setShowSortModal(false);
              }}
              style={{
                padding: 14,
                borderRadius: 12,
                marginBottom: 8,
                backgroundColor: sortOrder === 'newest' ? colors.secondary : 'transparent'
              }}
            >
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: colors.text
              }}>
                📅 Newest First
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSortOrder('oldest');
                setShowSortModal(false);
              }}
              style={{
                padding: 14,
                borderRadius: 12,
                marginBottom: 12,
                backgroundColor: sortOrder === 'oldest' ? colors.secondary : 'transparent'
              }}
            >
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: colors.text
              }}>
                📆 Oldest First
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSortModal(false)}
              style={{
                backgroundColor: colors.primary,
                padding: 14,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
                color: colors.background
              }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MoodEntries;
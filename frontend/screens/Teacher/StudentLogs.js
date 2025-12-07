import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { authService } from '../../services/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
const PAGE_SIZE = 10;

const StudentLogs = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { student } = route.params || {};

  const [moodLogs, setMoodLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    averageMood: 0,
    topActivity: '',
  });
  const [filters, setFilters] = useState({
    category: '',
    beforeValence: '',
    afterValence: '',
    mood: '',
    startDate: null,
    endDate: null,
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isFetching = useRef(false);

  useEffect(() => {
    resetAndFetch();
  }, [student]);

  useEffect(() => {
    applyFilters();
  }, [filters, moodLogs, sortOrder]);

  const resetAndFetch = async () => {
    try {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      isFetching.current = true;
      const token = await authService.getToken();

      const response = await fetch(`${API_BASE_URL}/api/teacher/student-mood-logs/${student._id}?page=1&limit=${PAGE_SIZE}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMoodLogs(data.data || []);
        calculateStats(data.data || []);
        setHasMore((data.data || []).length === PAGE_SIZE);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.error || data.message || 'Failed to load student logs',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error loading student logs:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load student logs',
        position: 'top',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetching.current = false;
    }
  };

  const fetchMore = async () => {
    if (loadingMore || !hasMore || isFetching.current) return;
    setLoadingMore(true);
    isFetching.current = true;
    try {
      const nextPage = page + 1;
      const token = await authService.getToken();

      const response = await fetch(`${API_BASE_URL}/api/teacher/student-mood-logs/${student._id}?page=${nextPage}&limit=${PAGE_SIZE}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const newLogs = data.data || [];
        setMoodLogs(prev => [...prev, ...newLogs]);
        setPage(nextPage);
        setHasMore(newLogs.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more student logs:', error);
    } finally {
      setLoadingMore(false);
      isFetching.current = false;
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    resetAndFetch();
  }, []);

  const calculateStats = (logs) => {
    if (logs.length === 0) {
      setStats({ totalLogs: 0, averageMood: 0, topActivity: '' });
      return;
    }

    const totalLogs = logs.length;

    // Calculate average mood (if mood scores exist)
    const moodScores = logs
      .filter((log) => log.moodScore)
      .map((log) => log.moodScore);
    const averageMood =
      moodScores.length > 0 ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1) : 0;

    // Find top activity
    const activityCount = {};
    logs.forEach((log) => {
      if (log.activity) {
        activityCount[log.activity] = (activityCount[log.activity] || 0) + 1;
      }
    });
    const topActivity =
      Object.keys(activityCount).length > 0
        ? Object.keys(activityCount).reduce((a, b) => (activityCount[a] > activityCount[b] ? a : b))
        : '';

    setStats({ totalLogs, averageMood, topActivity });
  };

  const applyFilters = () => {
    let filtered = moodLogs;

    if (filters.category) {
      filtered = filtered.filter((log) => log.category === filters.category);
    }

    if (filters.beforeValence) {
      filtered = filtered.filter((log) => log.beforeValence === filters.beforeValence);
    }

    if (filters.afterValence) {
      filtered = filtered.filter((log) => log.afterValence === filters.afterValence);
    }

    if (filters.mood) {
      filtered = filtered.filter(
        (log) =>
          log.beforeEmotion?.toLowerCase() === filters.mood.toLowerCase() ||
          log.afterEmotion?.toLowerCase() === filters.mood.toLowerCase()
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter((log) => new Date(log.date) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => new Date(log.date) <= endOfDay);
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first (descending)
    } else {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first (ascending)
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      beforeValence: '',
      afterValence: '',
      mood: '',
      startDate: null,
      endDate: null,
    });
  };

  const handleStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (selectedDate) {
        setFilters({ ...filters, startDate: selectedDate });
      }
    } else if (event.type === 'set') {
      // iOS: user confirmed the date
      setShowStartDatePicker(false);
      if (selectedDate) {
        setFilters({ ...filters, startDate: selectedDate });
      }
    } else if (event.type === 'dismissed') {
      // iOS: user dismissed the picker
      setShowStartDatePicker(false);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (selectedDate) {
        setFilters({ ...filters, endDate: selectedDate });
      }
    } else if (event.type === 'set') {
      // iOS: user confirmed the date
      setShowEndDatePicker(false);
      if (selectedDate) {
        setFilters({ ...filters, endDate: selectedDate });
      }
    } else if (event.type === 'dismissed') {
      // iOS: user dismissed the picker
      setShowEndDatePicker(false);
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter((v) => v).length;
  };

  const getMoodColor = (emotion) => {
    const emotionColors = {
      happy: '#FFD700',
      sad: '#4169E1',
      angry: '#FF4500',
      anxious: '#FFA500',
      calm: '#90EE90',
      neutral: '#808080',
      stressed: '#DC143C',
      excited: '#FF69B4',
    };
    return emotionColors[emotion?.toLowerCase()] || '#CCCCCC';
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      activity: colors.activity,
      social: colors.social,
      health: colors.health,
      sleep: colors.sleep,
    };
    return categoryColors[category] || '#999';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderLogItem = ({ item }) => (
    <View
      style={{
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 0,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      }}
    >
      {/* Top Bar with Date and Category */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: getCategoryColor(item.category),
        }}
      >
        <Text
          style={{
            fontSize: fonts.sizes.sm,
            fontWeight: '600',
            color: 'white',
          }}
        >
          {formatDate(item.date)}
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: fonts.sizes.xs,
              fontWeight: '700',
              textTransform: 'capitalize',
            }}
          >
            {item.category}
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        {/* Activity/Hours */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 6, fontWeight: '600' }}>
            {item.category === 'sleep' ? 'HOURS SLEPT' : 'ACTIVITY'}
          </Text>
          <Text
            style={{
              fontSize: fonts.sizes.lg,
              fontWeight: '700',
              color: colors.text,
            }}
          >
            {item.category === 'sleep' ? `${item.hrs} hours` : item.activity || 'N/A'}
          </Text>
        </View>

        {/* Before and After in Grid */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Before Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#F0F7F4',
              borderRadius: 10,
              padding: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#4CAF50',
            }}
          >
            <Text style={{ fontSize: fonts.sizes.xs, color: '#666', marginBottom: 10, fontWeight: '600' }}>
              BEFORE
            </Text>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 2 }}>
                Emotion
              </Text>
              <Text
                style={{
                  fontSize: fonts.sizes.sm,
                  fontWeight: '700',
                  color: colors.text,
                  textTransform: 'capitalize',
                }}
              >
                {item.beforeEmotion || '—'}
              </Text>
            </View>

            {item.beforeIntensity && (
              <View style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: fonts.sizes.xs, color: '#999' }}>
                    Intensity
                  </Text>
                  <Text style={{ fontSize: fonts.sizes.xs, fontWeight: '600', color: colors.primary }}>
                    {item.beforeIntensity}/5
                  </Text>
                </View>
                <View
                  style={{
                    height: 4,
                    backgroundColor: '#DDD',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${(item.beforeIntensity / 5) * 100}%`,
                      backgroundColor: item.beforeValence === 'positive' ? '#4CAF50' : '#F44336',
                    }}
                  />
                </View>
              </View>
            )}

            {item.beforeReason && (
              <View style={{ borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 10 }}>
                <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 4, fontWeight: '600' }}>
                  Reason
                </Text>
                <Text
                  style={{
                    fontSize: fonts.sizes.xs,
                    color: '#666',
                    lineHeight: 14,
                  }}
                >
                  {item.beforeReason}
                </Text>
              </View>
            )}
          </View>

          {/* After Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFF3E0',
              borderRadius: 10,
              padding: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#FF9800',
            }}
          >
            <Text style={{ fontSize: fonts.sizes.xs, color: '#666', marginBottom: 10, fontWeight: '600' }}>
              AFTER
            </Text>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 2 }}>
                Emotion
              </Text>
              <Text
                style={{
                  fontSize: fonts.sizes.sm,
                  fontWeight: '700',
                  color: colors.text,
                  textTransform: 'capitalize',
                }}
              >
                {item.afterEmotion || '—'}
              </Text>
            </View>

            {item.afterIntensity && (
              <View style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: fonts.sizes.xs, color: '#999' }}>
                    Intensity
                  </Text>
                  <Text style={{ fontSize: fonts.sizes.xs, fontWeight: '600', color: colors.secondary }}>
                    {item.afterIntensity}/5
                  </Text>
                </View>
                <View
                  style={{
                    height: 4,
                    backgroundColor: '#DDD',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${(item.afterIntensity / 5) * 100}%`,
                      backgroundColor: item.afterValence === 'positive' ? '#4CAF50' : '#F44336',
                    }}
                  />
                </View>
              </View>
            )}

            {item.afterReason && (
              <View style={{ borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 10 }}>
                <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 4, fontWeight: '600' }}>
                  Reason
                </Text>
                <Text
                  style={{
                    fontSize: fonts.sizes.xs,
                    color: '#666',
                    lineHeight: 14,
                  }}
                >
                  {item.afterReason}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: '#666', fontSize: fonts.sizes.sm }}>
            Loading logs...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fonts.sizes.md,
                fontWeight: '600',
                color: colors.text,
              }}
            >
              {student?.firstName} {student?.lastName}
            </Text>
            <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginTop: 2 }}>
              {student?.section}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: '#E0E0E0',
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginRight: 8,
            }}
          >
            <MaterialIcons
              name={sortOrder === 'newest' ? 'arrow-downward' : 'arrow-upward'}
              size={18}
              color="#666"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: getActiveFiltersCount() > 0 ? colors.primary : '#E0E0E0',
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialIcons
              name="filter-list"
              size={18}
              color={getActiveFiltersCount() > 0 ? 'white' : '#666'}
            />
            {getActiveFiltersCount() > 0 && (
              <Text
                style={{
                  color: 'white',
                  fontSize: fonts.sizes.xs,
                  fontWeight: '700',
                }}
              >
                {getActiveFiltersCount()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Panel */}
        {showFilters && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}>
            {/* Category Filter */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 8, fontWeight: '600' }}>
                CATEGORY
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {['activity', 'social', 'health', 'sleep'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() =>
                      handleFilterChange('category', filters.category === cat ? '' : cat)
                    }
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor:
                        filters.category === cat ? getCategoryColor(cat) : '#E0E0E0',
                    }}
                  >
                    <Text
                      style={{
                        color: filters.category === cat ? 'white' : '#666',
                        fontSize: fonts.sizes.xs,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Before Valence Filter */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 8, fontWeight: '600' }}>
                BEFORE MOOD
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['positive', 'negative'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() =>
                      handleFilterChange('beforeValence', filters.beforeValence === val ? '' : val)
                    }
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 6,
                      backgroundColor:
                        filters.beforeValence === val ? colors.primary : '#E0E0E0',
                    }}
                  >
                    <Text
                      style={{
                        color: filters.beforeValence === val ? 'white' : '#666',
                        fontSize: fonts.sizes.xs,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        textAlign: 'center',
                      }}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* After Valence Filter */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 8, fontWeight: '600' }}>
                AFTER MOOD
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['positive', 'negative'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() =>
                      handleFilterChange('afterValence', filters.afterValence === val ? '' : val)
                    }
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 6,
                      backgroundColor:
                        filters.afterValence === val ? colors.primary : '#E0E0E0',
                    }}
                  >
                    <Text
                      style={{
                        color: filters.afterValence === val ? 'white' : '#666',
                        fontSize: fonts.sizes.xs,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        textAlign: 'center',
                      }}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range Filters */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 8, fontWeight: '600' }}>
                START DATE
              </Text>
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(true)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 6,
                  backgroundColor: '#E0E0E0',
                }}
              >
                <Text style={{ fontSize: fonts.sizes.sm, color: '#666' }}>
                  {filters.startDate
                    ? new Date(filters.startDate).toLocaleDateString()
                    : 'Select start date'}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={filters.startDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartDateChange}
                  textColor={colors.primary}
                />
              )}
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: fonts.sizes.xs, color: '#999', marginBottom: 8, fontWeight: '600' }}>
                END DATE
              </Text>
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(true)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 6,
                  backgroundColor: '#E0E0E0',
                }}
              >
                <Text style={{ fontSize: fonts.sizes.sm, color: '#666' }}>
                  {filters.endDate
                    ? new Date(filters.endDate).toLocaleDateString()
                    : 'Select end date'}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={filters.endDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndDateChange}
                  textColor={colors.primary}
                />
              )}
            </View>

            {/* Clear Filters */}
            {getActiveFiltersCount() > 0 && (
              <TouchableOpacity
                onPress={clearFilters}
                style={{
                  paddingVertical: 8,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: fonts.sizes.sm,
                    fontWeight: '600',
                  }}
                >
                  Clear Filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Logs List */}
      {filteredLogs.length > 0 ? (
        <FlatList
          data={filteredLogs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 18 }}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="assignment" size={48} color="#CCC" />
          <Text
            style={{
              marginTop: 12,
              fontSize: fonts.sizes.md,
              color: '#999',
              textAlign: 'center',
            }}
          >
            {moodLogs.length === 0 ? 'No mood logs available' : 'No logs match filters'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default StudentLogs;

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { moodDataService } from '../../services/moodDataService';

const MoodEntries = ({ navigation }) => {
  const [moodData, setMoodData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [favoriteEntries, setFavoriteEntries] = useState({});
  const [sortOrder, setSortOrder] = useState('newest');
  const [showSortModal, setShowSortModal] = useState(false);

  // Exact emotion emojis from web system
  const emotionEmojis = {
    calm: '😌',
    relaxed: '😊',
    pleased: '🙂',
    happy: '😄',
    excited: '🤩',
    bored: '😑',
    sad: '😢',
    disappointed: '😞',
    angry: '😠',
    tense: '😰'
  };

  // Activity icons using PNG images
  const getActivityIcon = (activity, category) => {
    if (category === 'sleep') return <Text className="text-3xl">😴</Text>;

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

    const imageSource = activityImages[activity];
    if (imageSource) {
      return (
        <Image
          source={imageSource}
          className="w-10 h-10"
          resizeMode="contain"
        />
      );
    }

    return <Text className="text-3xl">📝</Text>;
  };

  // Fetch mood data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMoodData();
    }, [])
  );

  const fetchMoodData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);

      const result = await moodDataService.getUserMoodLogs({ 
        limit: 100,
        page: 1 
      });

      if (result.success) {
        const groupedData = groupMoodLogsByDate(result.moodLogs);
        setMoodData(groupedData);

        const statsResult = await moodDataService.getUserMoodStats();
        if (statsResult.success) {
          setStats(statsResult.stats);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to fetch mood data');
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMoodData(true);
  }, []);

  const groupMoodLogsByDate = (moodLogs) => {
    let filtered = moodLogs.filter(log => {
      if (!searchTerm) return true;
      return (
        log.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.activities?.some(activity => 
          activity.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        log.beforeValence?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.afterValence?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (activeTab === 'favorites') {
      filtered = filtered.filter(log => favoriteEntries[log._id]);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const grouped = {};
    filtered.forEach(log => {
      const date = new Date(log.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    const sortedGrouped = {};
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  };

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

  const handleFavoriteToggle = (id) => {
    const newFavorites = { ...favoriteEntries };
    newFavorites[id] = !newFavorites[id];
    setFavoriteEntries(newFavorites);
  };

  const renderIntensityDots = (intensity) => {
    return (
      <View className="flex-row mt-1">
        {[...Array(5)].map((_, i) => (
          <View
            key={i}
            className={`w-2 h-2 rounded-full mr-1 ${
              i < intensity ? 'bg-teal-600' : 'bg-green-50'
            }`}
          />
        ))}
      </View>
    );
  };

  const renderMoodEntry = (entry) => (
    <View key={entry._id} className="bg-green-50 mb-4 p-5 rounded-2xl border border-green-200">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-5">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">
            {getActivityIcon(entry.activities?.[0], entry.category)}
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-lg text-gray-800 mb-1">
              {formatText(entry.category)}
            </Text>
            <Text className="font-medium text-sm text-teal-600 mb-1">
              {entry.activities?.map(activity => formatText(activity)).join(', ')}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#374151" />
              <Text className="text-xs text-gray-700 ml-1">
                {formatTime(entry.date)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleFavoriteToggle(entry._id)}>
          <Ionicons 
            name={favoriteEntries[entry._id] ? "heart" : "heart-outline"} 
            size={24} 
            color={favoriteEntries[entry._id] ? "#ff6b6b" : "#b1b1b1"} 
          />
        </TouchableOpacity>
      </View>

      {/* Before and After Mood */}
      <View className="flex-row gap-3">
        {/* Before */}
        <View className="flex-1 bg-emerald-300 p-4 rounded-xl">
          <Text className="font-semibold text-sm text-white mb-3">
            Before Activity
          </Text>
          
          <View className="flex-row items-center mb-3">
            <Text className="text-3xl mr-3">
              {emotionEmojis[entry.beforeValence] || '😐'}
            </Text>
            <View className="flex-1">
              <Text className="font-medium text-base text-gray-800 mb-0.5">
                {formatText(entry.beforeValence)}
              </Text>
              <Text className="text-xs text-gray-700">
                Intensity: {entry.beforeIntensity}/5
              </Text>
            </View>
          </View>
          
          {renderIntensityDots(entry.beforeIntensity)}
        </View>

        {/* After */}
        <View className="flex-1 bg-emerald-300 p-4 rounded-xl">
          <Text className="font-semibold text-sm text-white mb-3">
            After Activity
          </Text>
          
          <View className="flex-row items-center mb-3">
            <Text className="text-3xl mr-3">
              {emotionEmojis[entry.afterValence] || '😐'}
            </Text>
            <View className="flex-1">
              <Text className="font-medium text-base text-gray-800 mb-0.5">
                {formatText(entry.afterValence)}
              </Text>
              <Text className="text-xs text-gray-700">
                Intensity: {entry.afterIntensity}/5
              </Text>
            </View>
          </View>
          
          {renderIntensityDots(entry.afterIntensity)}
        </View>
      </View>
    </View>
  );

  const renderDaySection = (dateString, entries) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <View key={dateString} className="mb-8">
        {/* Day Header */}
        <View className="bg-white/90 p-5 rounded-2xl mb-4 border border-green-200">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-teal-600 mr-3" />
            <Text className="font-semibold text-xl text-gray-800 flex-1">
              {formattedDate}
            </Text>
            <View className="bg-green-200 px-3 py-1.5 rounded-xl">
              <Text className="font-medium text-xs text-teal-600">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
          </View>
        </View>

        {/* Entries */}
        {entries.map(entry => renderMoodEntry(entry))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-green-50 justify-center items-center pt-14">
        <ActivityIndicator size="large" color="#0d9488" />
        <Text className="text-base text-gray-800 mt-4">
          Loading entries...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-50">
      {/* Header */}
      <View className="pt-14 px-5 pb-5 bg-white/90 border-b border-green-200">
        {/* Top Row */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Ionicons name="trending-up" size={24} color="#0d9488" />
            <Text className="font-semibold text-xl text-gray-800 ml-2">
              Mood Insights
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              className="ml-3"
            >
              <Ionicons name="swap-vertical" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row bg-white/80 rounded-full px-4 py-3 mb-4 border-2 border-green-200">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search entries..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-3 text-base text-gray-800"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white/80 rounded-full p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            className={`flex-1 py-3 px-5 rounded-full ${
              activeTab === 'all' ? 'bg-teal-600' : 'bg-transparent'
            }`}
          >
            <Text className={`font-medium text-sm text-center ${
              activeTab === 'all' ? 'text-white' : 'text-gray-400'
            }`}>
              All Entries
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('favorites')}
            className={`flex-1 py-3 px-5 rounded-full ${
              activeTab === 'favorites' ? 'bg-teal-600' : 'bg-transparent'
            }`}
          >
            <Text className={`font-medium text-sm text-center ${
              activeTab === 'favorites' ? 'text-white' : 'text-gray-400'
            }`}>
              Favorites
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0d9488']}
            tintColor="#0d9488"
          />
        }
      >
        {Object.keys(moodData).length === 0 ? (
          <View className="bg-white/90 rounded-2xl p-10 items-center border border-green-200">
            <Text className="text-6xl mb-4">😌</Text>
            <Text className="font-semibold text-xl text-gray-800 mb-2">
              No entries found
            </Text>
            <Text className="text-base text-gray-800 text-center leading-6">
              {searchTerm || activeTab === 'favorites'
                ? "Try adjusting your search or filters to find more entries."
                : "Start your mood tracking journey! Add your first mood entry."}
            </Text>
          </View>
        ) : (
          Object.entries(moodData).map(([dateString, entries]) =>
            renderDaySection(dateString, entries)
          )
        )}
      </ScrollView>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-5 w-4/5 max-w-xs">
            <Text className="font-semibold text-lg text-gray-800 mb-5 text-center">
              Sort Options
            </Text>
            
            <TouchableOpacity
              onPress={() => {
                setSortOrder('newest');
                setShowSortModal(false);
              }}
              className={`p-4 rounded-xl mb-2 ${
                sortOrder === 'newest' ? 'bg-green-200' : 'bg-transparent'
              }`}
            >
              <Text className={`font-medium text-base ${
                sortOrder === 'newest' ? 'text-teal-600' : 'text-gray-800'
              }`}>
                📅 Newest First
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setSortOrder('oldest');
                setShowSortModal(false);
              }}
              className={`p-4 rounded-xl mb-4 ${
                sortOrder === 'oldest' ? 'bg-green-200' : 'bg-transparent'
              }`}
            >
              <Text className={`font-medium text-base ${
                sortOrder === 'oldest' ? 'text-teal-600' : 'text-gray-800'
              }`}>
                📆 Oldest First
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowSortModal(false)}
              className="bg-teal-600 p-4 rounded-xl items-center"
            >
              <Text className="font-semibold text-base text-white">
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
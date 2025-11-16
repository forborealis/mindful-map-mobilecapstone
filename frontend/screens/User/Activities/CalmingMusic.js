import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  PanGestureHandler,
  GestureHandlerRootView
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';
import { musicService } from '../../../services/musicService';
import { authService } from '../../../services/authService';
const { width } = Dimensions.get('window');

const CalmingMusic = () => {
  const [musicList, setMusicList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('calming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  useEffect(() => {
    initializeComponent();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchMusic();
    }
  }, [selectedCategory, showFavorites]);

  const initializeComponent = async () => {
    setLoading(true);
    try {
      const authStatus = await authService.checkAuthStatus();
      setIsAuthenticated(authStatus.isAuthenticated);
      
      await Promise.all([
        fetchCategories(),
        fetchMusic()
      ]);
    } catch (error) {
      console.error('Error initializing component:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await musicService.getCategories();
      if (response.success) {
        const availableCategories = [
          { _id: 'calming', count: 0 },
          { _id: 'focus', count: 0 },
          { _id: 'sleep', count: 0 },
          { _id: 'meditation', count: 0 },
          { _id: 'nature', count: 0 },
          ...response.data
        ];
        
        const uniqueCategories = availableCategories.reduce((acc, category) => {
          const existing = acc.find(c => c._id === category._id);
          if (existing) {
            existing.count = Math.max(existing.count, category.count);
          } else {
            acc.push(category);
          }
          return acc;
        }, []);
        
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMusic = async () => {
    try {
      let response;
      
      if (showFavorites) {
        response = await musicService.getFavorites(selectedCategory);
      } else {
        response = await musicService.getMusicByCategory(selectedCategory);
      }
      
      if (response.success) {
        let musicData = response.data;
        
        // If user is authenticated and we're not showing favorites, 
        // we need to check which songs are favorited
        if (isAuthenticated && !showFavorites) {
          try {
            const favoritesResponse = await musicService.getFavorites();
            if (favoritesResponse.success) {
              const favoriteIds = new Set(favoritesResponse.data.map(fav => fav._id));
              musicData = musicData.map(track => ({
                ...track,
                isFavorite: favoriteIds.has(track._id)
              }));
            }
          } catch (favError) {
            console.error('Error fetching favorites status:', favError);
            // Continue with original data if favorites check fails
          }
        }
        
        setMusicList(musicData);
      } else {
        Alert.alert('Error', 'Failed to load music');
      }
    } catch (error) {
      console.error('Error fetching music:', error);
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchMusic()
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const playSound = async (music) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: music.cloudinaryUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentPlaying(music._id);
      setIsPlaying(true);

      await musicService.incrementPlayCount(music._id);
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis / 1000);
      setDuration(status.durationMillis / 1000);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentPlaying(null);
      }
    }
  };

  const togglePlayPause = async (music) => {
    if (currentPlaying === music._id && sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      await playSound(music);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setCurrentPlaying(null);
      setProgress(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const seekToPosition = async (position) => {
    if (sound && duration > 0) {
      const seekPositionMs = position * duration * 1000; // Convert to milliseconds
      await sound.setPositionAsync(seekPositionMs);
      setProgress(position * duration);
    }
  };

  const handleProgressBarPress = (event) => {
    if (!sound || duration === 0) return;
    
    const { locationX } = event.nativeEvent;
    const progressBarWidth = width - 32; // Account for padding
    const position = Math.max(0, Math.min(1, locationX / progressBarWidth));
    seekToPosition(position);
  };

  const handleSeekStart = (event) => {
    setIsSeeking(true);
    const { locationX } = event.nativeEvent;
    const progressBarWidth = width - 32;
    const position = Math.max(0, Math.min(1, locationX / progressBarWidth));
    setSeekPosition(position * duration);
  };

  const handleSeekMove = (event) => {
    if (!isSeeking) return;
    
    const { locationX } = event.nativeEvent;
    const progressBarWidth = width - 32;
    const position = Math.max(0, Math.min(1, locationX / progressBarWidth));
    setSeekPosition(position * duration);
  };

  const handleSeekEnd = () => {
    if (isSeeking && sound && duration > 0) {
      const position = seekPosition / duration;
      seekToPosition(position);
    }
    setIsSeeking(false);
    setSeekPosition(0);
  };

  const toggleFavorite = async (music) => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to add favorites');
      return;
    }

    try {
      let response;
      if (music.isFavorite) {
        response = await musicService.removeFromFavorites(music._id);
      } else {
        response = await musicService.addToFavorites(music._id);
      }

      if (response.success) {
        setMusicList(prevList => 
          prevList.map(item => 
            item._id === music._id 
              ? { ...item, isFavorite: !item.isFavorite }
              : item
          )
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      calming: 'Calming',
      focus: 'Focus',
      sleep: 'Sleep',
      meditation: 'Meditation',
      nature: 'Nature',
      other: 'Other'
    };
    return categoryNames[category] || category;
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      calming: 'leaf-outline',
      focus: 'bulb-outline',
      sleep: 'moon-outline',
      meditation: 'flower-outline',
      nature: 'leaf-outline',
      other: 'musical-note-outline'
    };
    return categoryIcons[category] || 'musical-note-outline';
  };

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategory === item._id;
    
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(item._id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={getCategoryIcon(item._id)}
          size={14}
          color={isSelected ? '#fff' : colors.primary}
        />
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
          {getCategoryDisplayName(item._id)}
        </Text>
        {item.count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMusicItem = ({ item }) => {
    const isCurrentlyPlaying = currentPlaying === item._id;
    
    return (
      <TouchableOpacity
        style={[styles.musicCard, isCurrentlyPlaying && styles.musicCardActive]}
        onPress={() => togglePlayPause(item)}
        activeOpacity={0.8}
      >
        <View style={styles.musicContent}>
          <View style={[styles.playIconContainer, isCurrentlyPlaying && styles.playIconContainerActive]}>
            <Ionicons
              name={isCurrentlyPlaying && isPlaying ? 'pause' : 'play'}
              size={18}
              color={isCurrentlyPlaying ? '#fff' : colors.primary}
            />
          </View>
          
          <View style={styles.musicInfo}>
            <Text style={styles.musicTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.musicMeta}>
              <Text style={styles.musicArtist} numberOfLines={1}>
                {item.artist}
              </Text>
              {item.duration > 0 && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.duration}>{formatTime(item.duration)}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item);
                }}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={item.isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={item.isFavorite ? '#FF6B9D' : colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading music...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              {showFavorites ? 'Favorites' : getCategoryDisplayName(selectedCategory)}
            </Text>
            <Text style={styles.subtitle}>{musicList.length} tracks</Text>
          </View>
          
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.favoriteToggle, showFavorites && styles.favoriteToggleActive]}
              onPress={() => setShowFavorites(!showFavorites)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showFavorites ? 'heart' : 'heart-outline'}
                size={18}
                color={showFavorites ? '#fff' : colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Categories */}
        {!showFavorites && (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        )}
      </View>

      {/* Music List */}
      {musicList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No music available</Text>
          <Text style={styles.emptySubtext}>Check back later for new tracks</Text>
        </View>
      ) : (
        <FlatList
          data={musicList}
          renderItem={renderMusicItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Now Playing Bar */}
      {currentPlaying && (
        <View style={styles.nowPlaying}>
          <TouchableOpacity 
            style={styles.progressBarContainer}
            onPress={handleProgressBarPress}
            onPressIn={handleSeekStart}
            onResponderMove={handleSeekMove}
            onPressOut={handleSeekEnd}
            activeOpacity={1}
          >
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill, 
                  { 
                    width: `${isSeeking 
                      ? (seekPosition / duration) * 100 
                      : (progress / duration) * 100
                    }%` 
                  }
                ]}
              />
            </View>
            
            {isSeeking && (
              <View style={styles.seekPreview}>
                <Text style={styles.seekTime}>
                  {formatTime(seekPosition)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.nowPlayingContent}>
            <View style={styles.trackInfo}>
              <View style={styles.albumArt}>
                <Ionicons name="musical-note" size={18} color={colors.primary} />
              </View>
              
              <View style={styles.trackDetails}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {musicList.find(m => m._id === currentPlaying)?.title || 'Unknown Track'}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {musicList.find(m => m._id === currentPlaying)?.artist || 'Unknown Artist'}
                </Text>
              </View>
            </View>
            
            <View style={styles.playerControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => {
                  const currentTrack = musicList.find(m => m._id === currentPlaying);
                  if (currentTrack) togglePlayPause(currentTrack);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButtonSecondary}
                onPress={stopSound}
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoriteToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  favoriteToggleActive: {
    backgroundColor: colors.primary,
  },
  categoriesContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  categoryTextSelected: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  countText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  musicCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  musicCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  musicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  playIconContainerActive: {
    backgroundColor: colors.primary,
  },
  musicInfo: {
    flex: 1,
    gap: 3,
  },
  musicTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.text,
    lineHeight: 18,
  },
  musicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musicArtist: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    flex: 1,
  },
  metaDot: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  duration: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  nowPlaying: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  progressBarContainer: {
    paddingVertical: 8,
    position: 'relative',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    marginHorizontal: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  seekPreview: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  seekTime: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    color: '#fff',
    minWidth: 35,
    textAlign: 'center',
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackDetails: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text,
    lineHeight: 17,
  },
  trackArtist: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonSecondary: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

});

export default CalmingMusic;
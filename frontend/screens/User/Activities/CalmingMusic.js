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
  GestureHandlerRootView,
  SafeAreaView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../utils/colors/colors';
import { fonts } from '../../../utils/fonts/fonts';
import { musicService } from '../../../services/musicService';
import { authService } from '../../../services/authService';
const { width } = Dimensions.get('window');

const CalmingMusic = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [musicList, setMusicList] = useState([]);
  const musicListRef = useRef([]);
  const currentPlayingRef = useRef(null);
  const currentTrackRef = useRef(null);
  const currentCategoryRef = useRef(null);
  const currentCategoryPlaylistRef = useRef([]);
  const soundRef = useRef(null);
  const isPlayingSoundRef = useRef(false);
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
  const [isLoadingSwitch, setIsLoadingSwitch] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  useEffect(() => {
    initializeComponent();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Handle navigation focus/blur to stop music when leaving the page
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      // Component is focused - music can continue or resume
    });

    const unsubscribeBlur = navigation.addListener('blur', async () => {
      // Component is no longer focused - stop playing and reset state
      if (sound || soundRef.current) {
        try {
          if (soundRef.current) {
            const status = await soundRef.current.getStatusAsync();
            if (status && status.isLoaded) {
              await soundRef.current.stopAsync();
              await soundRef.current.unloadAsync();
            }
          } else if (sound) {
            const status = await sound.getStatusAsync();
            if (status && status.isLoaded) {
              await sound.stopAsync();
              await sound.unloadAsync();
            }
          }
        } catch (error) {
          // Silently ignore errors
        }
      }
      setSound(null);
      soundRef.current = null;
      setIsPlaying(false);
      setCurrentPlaying(null);
      currentPlayingRef.current = null;
      currentTrackRef.current = null;
      currentCategoryRef.current = null;
      currentCategoryPlaylistRef.current = [];
      setProgress(0);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, sound]);

  useEffect(() => {
    if (selectedCategory) {
      fetchMusic(true); // Pass true to indicate this is a view switch
    }
  }, [selectedCategory, showFavorites, isAuthenticated]);

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
          // Categories should match backend schema: calming, uplifting, meditation, focus, sleep, nature
          const availableCategories = [
            { _id: 'calming', count: 0 },
            { _id: 'uplifting', count: 0 },
            { _id: 'meditation', count: 0 },
            { _id: 'focus', count: 0 },
            { _id: 'sleep', count: 0 },
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

  const fetchMusic = async (isViewSwitch = false) => {
    try {
      if (isViewSwitch) {
        setIsLoadingSwitch(true);
        // Only clear the list if no music is currently playing to avoid interrupting playback
        if (!currentPlayingRef.current || !isPlaying) {
          setMusicList([]);
          musicListRef.current = [];
        }
      }
      
      let response;
      
      if (showFavorites) {
        // Get ALL favorites, not filtered by category
        response = await musicService.getFavorites();
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
            // Set isFavorite to false for all tracks if favorites check fails
            musicData = musicData.map(track => ({
              ...track,
              isFavorite: false
            }));
          }
        } else if (!showFavorites) {
          // If not authenticated, ensure isFavorite is set to false
          musicData = musicData.map(track => ({
            ...track,
            isFavorite: false
          }));
        }
        
        setMusicList(musicData);
        musicListRef.current = musicData;
      } else {
        Alert.alert('Error', 'Failed to load music');
      }
    } catch (error) {
      console.error('Error fetching music:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      if (isViewSwitch) {
        setIsLoadingSwitch(false);
      }
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

  const playSound = async (music, updateCategoryPlaylist = true) => {
    // Prevent concurrent playSound calls
    if (isPlayingSoundRef.current) return;
    isPlayingSoundRef.current = true;
    
    try {
      // Stop and unload existing sound completely using the ref for reliability
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status && status.isLoaded) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          }
        } catch (error) {
          // Silently ignore errors - sound may already be unloaded
          soundRef.current = null;
        }
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
      soundRef.current = newSound;
      setCurrentPlaying(music._id);
      currentPlayingRef.current = music._id;
      currentTrackRef.current = music;
      
      // Only update category/playlist if flag is true
      // This allows tracking which category a song belongs to for proper previous/next navigation
      if (updateCategoryPlaylist) {
        currentCategoryRef.current = music.category || selectedCategory;
        currentCategoryPlaylistRef.current = musicListRef.current;
      }
      
      setIsPlaying(true);

      await musicService.incrementPlayCount(music._id);
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Error', 'Failed to play audio');
    } finally {
      isPlayingSoundRef.current = false;
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis / 1000);
      setDuration(status.durationMillis / 1000);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        // Auto-play next song before clearing currentPlaying
        playNextSong();
      }
    }
  };

  const playPreviousSong = () => {
    // Use the playlist from when the current song was started, not the current view
    // If the stored playlist is from a different category than the current playing song, it's invalid
    let playlistToUse = currentCategoryPlaylistRef.current;
    
    // Validate the playlist - if it doesn't contain the current playing song, it's from a different context
    if (playlistToUse.length > 0 && !playlistToUse.find(m => m._id === currentPlayingRef.current)) {
      playlistToUse = [];
    }
    
    if (playlistToUse.length === 0) {
      playlistToUse = musicListRef.current;
    }
    
    const currentId = currentPlayingRef.current;
    if (playlistToUse.length === 0 || currentId === null) return;
    
    const currentIndex = playlistToUse.findIndex(music => music._id === currentId);
    if (currentIndex <= 0) {
      // Already at the beginning, don't do anything
      return;
    }
    
    const previousIndex = currentIndex - 1;
    const previousSong = playlistToUse[previousIndex];
    
    if (previousSong) {
      currentTrackRef.current = previousSong;
      playSound(previousSong, false);
    }
  };

  const playNextSong = () => {
    // Use the playlist from when the current song was started, not the current view
    // If the stored playlist is from a different category than the current playing song, it's invalid
    let playlistToUse = currentCategoryPlaylistRef.current;
    
    // Validate the playlist - if it doesn't contain the current playing song, it's from a different context
    if (playlistToUse.length > 0 && !playlistToUse.find(m => m._id === currentPlayingRef.current)) {
      playlistToUse = [];
    }
    
    if (playlistToUse.length === 0) {
      playlistToUse = musicListRef.current;
    }
    
    if (playlistToUse.length === 0 || currentPlayingRef.current === null) return;
    
    const currentIndex = playlistToUse.findIndex(music => music._id === currentPlayingRef.current);
    let nextIndex;
    
    if (currentIndex >= playlistToUse.length - 1) {
      // Loop back to the first song
      nextIndex = 0;
    } else {
      nextIndex = currentIndex + 1;
    }
    
    const nextSong = playlistToUse[nextIndex];
    
    if (nextSong) {
      currentTrackRef.current = nextSong;
      playSound(nextSong, false);
    }
  };

  const togglePlayPause = async (music) => {
    if (currentPlayingRef.current === music._id && sound) {
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
    if (sound || soundRef.current) {
      try {
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status && status.isLoaded) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          }
        } else if (sound) {
          const status = await sound.getStatusAsync();
          if (status && status.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        }
      } catch (error) {
        // Silently ignore errors
      }
      setSound(null);
      soundRef.current = null;
      isPlayingSoundRef.current = false;
      setIsPlaying(false);
      setCurrentPlaying(null);
      currentPlayingRef.current = null;
      currentTrackRef.current = null;
      currentCategoryRef.current = null;
      currentCategoryPlaylistRef.current = [];
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
    
    // Update progress immediately for instant feedback
    setProgress(position * duration);
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

  const CircularProgressIndicator = () => {
    if (!currentPlayingRef.current || !isPlaying) return null;
    
    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
    
    return (
      <View style={styles.circularProgress}>
        <Svg width="14" height="14">
          <Circle
            cx="7"
            cy="7"
            r="5.5"
            fill={colors.primary}
            stroke={colors.background}
            strokeWidth="1.5"
          />
        </Svg>
      </View>
    );
  };

  const downloadMusic = async (music) => {
    try {
      // Request storage permissions
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please enable storage permissions to download music');
        return;
      }

      // Add to downloading set
      setDownloadingIds(prev => new Set([...prev, music._id]));

      const musicFileName = `${music.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
      const downloadsPath = `${FileSystem.documentDirectory}Download/`;
      const musicPath = `${downloadsPath}${musicFileName}`;

      try {
        // Check if directory exists
        const dirInfo = await FileSystem.getInfoAsync(downloadsPath);
        if (!dirInfo.exists) {
          // Create directory with intermediates
          await FileSystem.makeDirectoryAsync(downloadsPath, { intermediates: true });
          console.log('Created download directory:', downloadsPath);
        }
      } catch (dirError) {
        console.error('Error creating directory:', dirError);
        throw new Error('Failed to create download directory');
      }

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(
        music.cloudinaryUrl,
        musicPath
      );

      if (downloadResult.status === 200) {
        // Try to add to media library
        try {
          await MediaLibrary.createAssetAsync(musicPath);
        } catch (mediaError) {
          console.log('Media library sync note:', mediaError);
        }
        
        Alert.alert('Success', `Downloaded: ${music.title}`);
      } else {
        Alert.alert('Error', 'Failed to download music');
      }
    } catch (error) {
      console.error('Error downloading music:', error);
      Alert.alert('Error', 'Download failed: ' + error.message);
    } finally {
      // Remove from downloading set
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(music._id);
        return newSet;
      });
    }
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
      uplifting: 'Uplifting',
      meditation: 'Meditation',
      focus: 'Focus',
      sleep: 'Sleep',
      nature: 'Nature'
    };
    return categoryNames[category] || category;
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      calming: 'leaf-outline',
      uplifting: 'sunny-outline',
      meditation: 'flower-outline',
      focus: 'bulb-outline',
      sleep: 'moon-outline',
      nature: 'leaf-outline'
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
          <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
            <Text style={[styles.countText, isSelected && styles.countTextSelected]}>{item.count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMusicItem = ({ item }) => {
    const isCurrentlyPlaying = currentPlayingRef.current === item._id;
    
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
                style={styles.musicFavoriteButton}
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
            <TouchableOpacity
              style={styles.musicDownloadButton}
              onPress={(e) => {
                e.stopPropagation();
                downloadMusic(item);
              }}
              disabled={downloadingIds.has(item._id)}
              activeOpacity={0.6}
            >
              {downloadingIds.has(item._id) ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={18}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
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
    <SafeAreaView style={styles.container}>
      {/* Simplified Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (showFavorites) {
              setShowFavorites(false);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{showFavorites ? 'My Songs' : 'Calming Music'}</Text>
        
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => setShowFavorites(!showFavorites)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showFavorites ? "musical-notes" : "heart-outline"}
              size={20}
              color={showFavorites ? colors.text : colors.text}
            />
          </TouchableOpacity>
        )}
        
        {!isAuthenticated && <View style={styles.spacer} />}
      </View>

      {/* Categories */}
      {!showFavorites && (
        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>
      )}

      {/* Music List */}
      {isLoadingSwitch ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {showFavorites ? 'Loading favorites...' : 'Loading music...'}
          </Text>
        </View>
      ) : musicList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {showFavorites ? 'No favorites yet' : 'No music available'}
          </Text>
          <Text style={styles.emptySubtext}>
            {showFavorites ? 'Start adding songs to your favorites' : 'Check back later for new tracks'}
          </Text>
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
      {currentPlayingRef.current && (
        <View style={[styles.nowPlaying, { paddingBottom: insets.bottom + 12 }]}>
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
              {/* Progress circle indicator */}
              <View 
                style={[
                  styles.progressCircle,
                  {
                    left: `${isSeeking 
                      ? (seekPosition / duration) * 100 
                      : (progress / duration) * 100
                    }%`
                  }
                ]}
              >
                <CircularProgressIndicator />
              </View>
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
                  {currentTrackRef.current?.title || 'Unknown Track'}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {currentTrackRef.current?.artist || 'Unknown Artist'}
                </Text>
              </View>
            </View>
            
            <View style={styles.playerControls}>
              <TouchableOpacity 
                style={styles.controlButtonIcon}
                onPress={playPreviousSong}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="play-skip-back"
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButtonMain}
                onPress={() => {
                  if (currentTrackRef.current) togglePlayPause(currentTrackRef.current);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButtonIcon}
                onPress={playNextSong}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="play-skip-forward"
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginHorizontal: 12,
    flex: 1,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  spacer: {
    width: 48,
  },
  categoriesSection: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
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
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  countTextSelected: {
    color: '#fff',
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
    paddingBottom: 120,
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
  musicFavoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  musicDownloadButton: {
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
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressCircle: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    marginLeft: -7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgress: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 12,
  },
  controlButtonMain: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

});

export default CalmingMusic;
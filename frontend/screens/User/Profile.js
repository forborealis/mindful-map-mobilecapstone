import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { moodDataService } from '../../services/moodDataService';
import { colors } from '../../utils/colors/colors';
import { fonts } from '../../utils/fonts/fonts';
import Toast from 'react-native-toast-message';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Profile form data
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null
  });

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Account statistics
  const [accountStats, setAccountStats] = useState({
    consecutiveDays: 0,
    totalMoodLogs: 0,
    mostFrequentMoodWeekly: { mood: 'N/A', count: 0 },
    mostFrequentMoodOverall: { mood: 'N/A', count: 0 }
  });

  useEffect(() => {
    loadUserData();
    loadAccountStats();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const result = await authService.getStoredUser();
      
      if (result.success) {
        setUser(result.user);
        setEditForm({
          email: result.user.email || '',
          password: '',
          confirmPassword: '',
          avatar: null
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load user data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAccountStats = async () => {
    try {
      setStatsLoading(true);
      
      // Get all mood logs for statistics
      const result = await moodDataService.getUserMoodLogs({ limit: 1000 });
      
      if (result.success) {
        const logs = result.moodLogs || [];
        
        // Calculate statistics
        const stats = calculateAccountStats(logs);
        setAccountStats(stats);
      }
    } catch (error) {
      console.error('Error loading account stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const calculateAccountStats = (logs) => {
    if (!Array.isArray(logs) || logs.length === 0) {
      return {
        consecutiveDays: 0,
        totalMoodLogs: 0,
        mostFrequentMoodWeekly: { mood: '—', count: 0 },
        mostFrequentMoodOverall: { mood: '—', count: 0 }
      };
    }

    // Sort logs by date (newest first)
    const sortedLogs = logs.sort((a, b) => {
      const dateA = new Date(a.selectedDate || a.date || a.createdAt);
      const dateB = new Date(b.selectedDate || b.date || b.createdAt);
      return dateB - dateA;
    });

    // Calculate consecutive days
    const consecutiveDays = calculateConsecutiveDays(sortedLogs);

    // Total mood logs
    const totalMoodLogs = logs.length;

    // Most frequent mood overall (both before and after emotions)
    const overallMoodCounts = {};
    const overallMoodLatestInfo = {};
    logs.forEach(log => {
      const logDate = new Date(log.selectedDate || log.date || log.createdAt);
      // Count before emotions
      if (log.beforeEmotion) {
        overallMoodCounts[log.beforeEmotion] = (overallMoodCounts[log.beforeEmotion] || 0) + 1;
        if (!overallMoodLatestInfo[log.beforeEmotion] || logDate > overallMoodLatestInfo[log.beforeEmotion].date) {
          overallMoodLatestInfo[log.beforeEmotion] = { date: logDate, type: 'before', log };
        } else if (logDate.getTime() === overallMoodLatestInfo[log.beforeEmotion].date.getTime() && overallMoodLatestInfo[log.beforeEmotion].type === 'before') {
          // Same date and both are before, keep the existing one
        }
      }
      // Count after emotions
      if (log.afterEmotion) {
        overallMoodCounts[log.afterEmotion] = (overallMoodCounts[log.afterEmotion] || 0) + 1;
        if (!overallMoodLatestInfo[log.afterEmotion] || logDate > overallMoodLatestInfo[log.afterEmotion].date) {
          overallMoodLatestInfo[log.afterEmotion] = { date: logDate, type: 'after', log };
        } else if (logDate.getTime() === overallMoodLatestInfo[log.afterEmotion].date.getTime() && overallMoodLatestInfo[log.afterEmotion].type === 'before') {
          // Same date but after emotion is more recent in the day, prefer after
          overallMoodLatestInfo[log.afterEmotion] = { date: logDate, type: 'after', log };
        }
      }
    });

    const mostFrequentMoodOverall = getMostFrequentMood(overallMoodCounts, overallMoodLatestInfo);

    // Most frequent mood this week (both before and after emotions)
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weeklyLogs = logs.filter(log => {
      const logDate = new Date(log.selectedDate || log.date || log.createdAt);
      return logDate >= weekStart;
    });

    const weeklyMoodCounts = {};
    const weeklyMoodLatestInfo = {};
    weeklyLogs.forEach(log => {
      const logDate = new Date(log.selectedDate || log.date || log.createdAt);
      // Count before emotions
      if (log.beforeEmotion) {
        weeklyMoodCounts[log.beforeEmotion] = (weeklyMoodCounts[log.beforeEmotion] || 0) + 1;
        if (!weeklyMoodLatestInfo[log.beforeEmotion] || logDate > weeklyMoodLatestInfo[log.beforeEmotion].date) {
          weeklyMoodLatestInfo[log.beforeEmotion] = { date: logDate, type: 'before', log };
        } else if (logDate.getTime() === weeklyMoodLatestInfo[log.beforeEmotion].date.getTime() && weeklyMoodLatestInfo[log.beforeEmotion].type === 'before') {
          // Same date and both are before, keep the existing one
        }
      }
      // Count after emotions
      if (log.afterEmotion) {
        weeklyMoodCounts[log.afterEmotion] = (weeklyMoodCounts[log.afterEmotion] || 0) + 1;
        if (!weeklyMoodLatestInfo[log.afterEmotion] || logDate > weeklyMoodLatestInfo[log.afterEmotion].date) {
          weeklyMoodLatestInfo[log.afterEmotion] = { date: logDate, type: 'after', log };
        } else if (logDate.getTime() === weeklyMoodLatestInfo[log.afterEmotion].date.getTime() && weeklyMoodLatestInfo[log.afterEmotion].type === 'before') {
          // Same date but after emotion is more recent in the day, prefer after
          weeklyMoodLatestInfo[log.afterEmotion] = { date: logDate, type: 'after', log };
        }
      }
    });

    const mostFrequentMoodWeekly = getMostFrequentMood(weeklyMoodCounts, weeklyMoodLatestInfo);

    return {
      consecutiveDays,
      totalMoodLogs,
      mostFrequentMoodWeekly,
      mostFrequentMoodOverall
    };
  };

  const calculateConsecutiveDays = (sortedLogs) => {
    if (sortedLogs.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let consecutiveDays = 0;
    let currentDate = new Date(today);
    
    // Check if there's a log for today
    const todayLog = sortedLogs.find(log => {
      const logDate = new Date(log.selectedDate || log.date || log.createdAt);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    // If no log today, check yesterday
    if (!todayLog) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Count consecutive days going backwards
    while (true) {
      const hasLogForDate = sortedLogs.some(log => {
        const logDate = new Date(log.selectedDate || log.date || log.createdAt);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === currentDate.getTime();
      });

      if (hasLogForDate) {
        consecutiveDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return consecutiveDays;
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const getMostFrequentMood = (moodCounts, moodLatestInfo = {}) => {
    const entries = Object.entries(moodCounts);
    if (entries.length === 0) return { mood: '—', count: 0 };
    
    // Filter moods that appear at least twice
    const validMoods = entries.filter(([mood, count]) => count >= 2);
    
    if (validMoods.length === 0) return { mood: '—', count: 0 };
    
    // Sort by count (descending), then by latest info for tie-breaking
    const sorted = validMoods.sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1]; // Sort by count descending
      }
      
      // If counts are equal, apply tie-breaking logic
      const moodA = a[0];
      const moodB = b[0];
      const infoA = moodLatestInfo[moodA];
      const infoB = moodLatestInfo[moodB];
      
      if (!infoA || !infoB) {
        return 0;
      }
      
      const dateA = infoA.date;
      const dateB = infoB.date;
      
      // Compare dates
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB - dateA; // Sort by date descending (newest first)
      }
      
      // Same date: if one is after and other is before, prefer after
      if (infoA.type === 'after' && infoB.type === 'before') {
        return -1; // A comes first (preferred)
      }
      if (infoA.type === 'before' && infoB.type === 'after') {
        return 1; // B comes first (preferred)
      }
      
      // Both same type, check if before and after are the same mood in the latest log
      if (infoA.log && infoB.log && infoA.log === infoB.log) {
        // Same log entry, prefer after emotion
        if (infoA.type === 'after') return -1;
        if (infoB.type === 'after') return 1;
      }
      
      return 0;
    });
    
    return {
      mood: formatMoodName(sorted[0][0]),
      count: sorted[0][1]
    };
  };

  const formatMoodName = (mood) => {
    return mood.charAt(0).toUpperCase() + mood.slice(1);
  };

  const validateFormField = (fieldName, value) => {
    const newErrors = { ...formErrors };
    
    if (fieldName === 'email') {
      if (value.trim() && value !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          newErrors.email = '';
        }
      } else {
        newErrors.email = '';
      }
    }
    
    if (fieldName === 'password') {
      if (value) {
        if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          newErrors.password = '';
        }
        // Check confirm password match if it exists
        if (editForm.confirmPassword && value !== editForm.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else if (editForm.confirmPassword && value === editForm.confirmPassword) {
          newErrors.confirmPassword = '';
        }
      } else {
        newErrors.password = '';
        newErrors.confirmPassword = '';
      }
    }
    
    if (fieldName === 'confirmPassword') {
      if (editForm.password) {
        if (value !== editForm.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          newErrors.confirmPassword = '';
        }
      }
    }
    
    setFormErrors(newErrors);
  };

  const handleEditProfile = () => {
    if (user?.provider === 'Google') {
      Toast.show({
        type: 'info',
        text1: 'Google Account',
        text2: 'Profile editing is not available for Google accounts.',
      });
      return;
    }
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    // Validation
    const errors = {};
    
    // Email validation
    if (editForm.email.trim() && editForm.email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    // Password validation
    if (editForm.password) {
      if (editForm.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else if (editForm.password !== editForm.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    // Check if there are errors
    if (Object.values(errors).some(error => error !== '')) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});

    try {
      setProfileLoading(true);
      
      const result = await authService.updateProfile(user.uid, {
        email: editForm.email !== user.email ? editForm.email : undefined,
        password: editForm.password || undefined,
        confirmPassword: editForm.confirmPassword || undefined,
      }, editForm.avatar);

      if (result.success) {
        // Update local user data
        setUser(result.user);
        setEditForm(prev => ({
          ...prev,
          password: '',
          confirmPassword: '',
          avatar: null
        }));
        
        setShowEditModal(false);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your profile has been updated successfully.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Failed to update profile.',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update profile.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose from where you want to select an image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditForm(prev => ({ ...prev, avatar: result.assets[0] }));
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditForm(prev => ({ ...prev, avatar: result.assets[0] }));
    }
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  const handleAvatarLoad = () => {
    setAvatarError(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ 
            marginTop: 16, 
            fontFamily: fonts.regular, 
            color: colors.text 
          }}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
          alignItems: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          {/* Avatar */}
          <View style={{ marginBottom: 16 }}>
            {user?.avatar && !avatarError ? (
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: user.avatar }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: colors.primary + '20'
                  }}
                  onError={handleAvatarError}
                  onLoad={handleAvatarLoad}
                />
                <View style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  borderWidth: 3,
                  borderColor: colors.primary,
                }} />
              </View>
            ) : (
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: colors.primary + '30',
              }}>
                <Text style={{
                  fontSize: 40,
                  fontFamily: fonts.bold,
                  color: colors.white,
                }}>
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <Text style={{
            fontSize: 24,
            fontFamily: fonts.bold,
            color: colors.text,
            marginBottom: 4,
          }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{
            fontSize: 16,
            fontFamily: fonts.regular,
            color: colors.text,
            opacity: 0.7,
            marginBottom: 8,
          }}>
            {user?.email}
          </Text>
          {user?.section && user?.section !== 'N/A' && (
            <Text style={{
              fontSize: 14,
              fontFamily: fonts.regular,
              color: colors.text,
              opacity: 0.6,
              marginBottom: 16,
            }}>
              {user.section}
            </Text>
          )}

          {/* Edit Profile Button */}
          {user?.provider !== 'Google' && (
            <TouchableOpacity
              onPress={handleEditProfile}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 25,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.white} />
              <Text style={{
                marginLeft: 8,
                fontSize: 16,
                fontFamily: fonts.semiBold,
                color: colors.white,
              }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Statistics */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name="stats-chart" size={24} color={colors.primary} />
            <Text style={{
              marginLeft: 12,
              fontSize: 20,
              fontFamily: fonts.semiBold,
              color: colors.text,
            }}>
              Account Statistics
            </Text>
          </View>

          {statsLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{
                marginTop: 8,
                fontFamily: fonts.regular,
                color: colors.text,
                opacity: 0.7,
              }}>
                Loading stats...
              </Text>
            </View>
          ) : (
            <View>
              {/* Consecutive Days */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.accent,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="flame" size={20} color={colors.primary} />
                  <Text style={{
                    marginLeft: 12,
                    fontSize: 13,
                    fontFamily: fonts.regular,
                    color: colors.text,
                  }}>
                    Consecutive Days Logging
                  </Text>
                </View>
                <Text style={{
                  fontSize: 18,
                  fontFamily: fonts.bold,
                  color: colors.primary,
                }}>
                  {accountStats.consecutiveDays}
                </Text>
              </View>

              {/* Total Mood Logs */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.accent,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="journal" size={20} color={colors.primary} />
                  <Text style={{
                    marginLeft: 12,
                    fontSize: 13,
                    fontFamily: fonts.regular,
                    color: colors.text,
                  }}>
                    Total Mood Logs
                  </Text>
                </View>
                <Text style={{
                  fontSize: 18,
                  fontFamily: fonts.bold,
                  color: colors.primary,
                }}>
                  {accountStats.totalMoodLogs}
                </Text>
              </View>

              {/* Most Frequent Mood (Weekly) */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.accent,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={{
                    marginLeft: 12,
                    fontSize: 13,
                    fontFamily: fonts.regular,
                    color: colors.text,
                  }}>
                    Most Frequent Mood (Weekly)
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 16,
                    fontFamily: fonts.semiBold,
                    color: colors.primary,
                  }}>
                    {accountStats.mostFrequentMoodWeekly.mood}
                  </Text>
                  {accountStats.mostFrequentMoodWeekly.count > 0 && (
                    <Text style={{
                      fontSize: 12,
                      fontFamily: fonts.regular,
                      color: colors.text,
                      opacity: 0.7,
                    }}>
                      {accountStats.mostFrequentMoodWeekly.count} times
                    </Text>
                  )}
                </View>
              </View>

              {/* Most Frequent Mood (Overall) */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="trophy" size={20} color={colors.primary} />
                  <Text style={{
                    marginLeft: 12,
                    fontSize: 13,
                    fontFamily: fonts.regular,
                    color: colors.text,
                  }}>
                    Most Frequent Mood (Overall)
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 16,
                    fontFamily: fonts.semiBold,
                    color: colors.primary,
                  }}>
                    {accountStats.mostFrequentMoodOverall.mood}
                  </Text>
                  {accountStats.mostFrequentMoodOverall.count > 0 && (
                    <Text style={{
                      fontSize: 12,
                      fontFamily: fonts.regular,
                      color: colors.text,
                      opacity: 0.7,
                    }}>
                      {accountStats.mostFrequentMoodOverall.count} times
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>


      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Text style={{
                fontSize: 20,
                fontFamily: fonts.semiBold,
                color: colors.text,
              }}>
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Email Field */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 16,
                fontFamily: fonts.medium,
                color: colors.text,
                marginBottom: 8,
              }}>
                Email
              </Text>
              <TextInput
                value={editForm.email}
                onChangeText={(text) => {
                  setEditForm(prev => ({ ...prev, email: text }));
                  validateFormField('email', text);
                }}
                placeholder="Enter your email"
                style={{
                  backgroundColor: formErrors.email ? colors.accent + 'cc' : colors.accent,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  fontFamily: fonts.regular,
                  color: colors.text,
                  borderWidth: formErrors.email ? 1.5 : 0,
                  borderColor: formErrors.email ? '#FF6B6B' : 'transparent',
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {formErrors.email && (
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: '#FF6B6B',
                  marginTop: 6,
                  marginLeft: 4,
                }}>
                  {formErrors.email}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 16,
                fontFamily: fonts.medium,
                color: colors.text,
                marginBottom: 8,
              }}>
                New Password
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: formErrors.password ? colors.accent + 'cc' : colors.accent,
                borderRadius: 12,
                paddingHorizontal: 16,
                borderWidth: formErrors.password ? 1.5 : 0,
                borderColor: formErrors.password ? '#FF6B6B' : 'transparent',
              }}>
                <TextInput
                  value={editForm.password}
                  onChangeText={(text) => {
                    setEditForm(prev => ({ ...prev, password: text }));
                    validateFormField('password', text);
                  }}
                  placeholder="Leave blank to keep current password"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 16,
                    fontFamily: fonts.regular,
                    color: colors.text,
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? 'eye' : 'eye-off'} 
                    size={20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              </View>
              {formErrors.password && (
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: '#FF6B6B',
                  marginTop: 6,
                  marginLeft: 4,
                }}>
                  {formErrors.password}
                </Text>
              )}
            </View>

            {/* Confirm Password Field */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 16,
                fontFamily: fonts.medium,
                color: editForm.password ? colors.text : colors.text + '80',
                marginBottom: 8,
              }}>
                Confirm Password
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: formErrors.confirmPassword ? colors.accent + 'cc' : (editForm.password ? colors.accent : colors.accent + '80'),
                borderRadius: 12,
                paddingHorizontal: 16,
                borderWidth: formErrors.confirmPassword ? 1.5 : 0,
                borderColor: formErrors.confirmPassword ? '#FF6B6B' : 'transparent',
              }}>
                <TextInput
                  value={editForm.confirmPassword}
                  onChangeText={(text) => {
                    setEditForm(prev => ({ ...prev, confirmPassword: text }));
                    validateFormField('confirmPassword', text);
                  }}
                  placeholder="Confirm new password"
                  editable={!!editForm.password}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 16,
                    fontFamily: fonts.regular,
                    color: editForm.password ? colors.text : colors.text + '80',
                  }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={!editForm.password}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye' : 'eye-off'} 
                    size={20} 
                    color={editForm.password ? colors.primary : colors.primary + '80'}
                  />
                </TouchableOpacity>
              </View>
              {formErrors.confirmPassword && (
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.regular,
                  color: '#FF6B6B',
                  marginTop: 6,
                  marginLeft: 4,
                }}>
                  {formErrors.confirmPassword}
                </Text>
              )}
            </View>


            {/* Avatar Upload */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontFamily: fonts.medium,
                color: colors.text,
                marginBottom: 8,
              }}>
                Avatar
              </Text>
              
              {/* Avatar Preview */}
              {editForm.avatar && (
                <View style={{ 
                  alignItems: 'center', 
                  marginBottom: 12,
                }}>
                  <Image
                    source={{ uri: editForm.avatar.uri }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: colors.accent,
                    }}
                  />
                </View>
              )}
              
              <TouchableOpacity
                onPress={handleImagePicker}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  borderStyle: 'dashed',
                }}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={{
                  marginLeft: 8,
                  fontSize: 16,
                  fontFamily: fonts.regular,
                  color: colors.primary,
                }}>
                  {editForm.avatar ? 'Change Avatar' : 'Upload Avatar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.accent,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontFamily: fonts.semiBold,
                  color: colors.text,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={profileLoading}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: profileLoading ? 0.6 : 1,
                }}
              >
                {profileLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={{
                    fontSize: 16,
                    fontFamily: fonts.semiBold,
                    color: colors.white,
                  }}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;
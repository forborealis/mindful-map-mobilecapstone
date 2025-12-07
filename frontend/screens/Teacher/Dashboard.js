import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { authService } from '../../services/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

const TeacherDashboard = () => {
  const navigation = useNavigation();
  const [teacher, setTeacher] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get stored user and token
      const sessionResult = await authService.checkAuthStatus();
      
      if (!sessionResult.isAuthenticated) {
        navigation.replace('Login');
        return;
      }

      // Verify user is a teacher
      const storedUser = await authService.getCurrentUser();
      if (storedUser.role !== 'teacher') {
        Alert.alert('Access Denied', 'This screen is only accessible to teachers.');
        navigation.replace('Login');
        return;
      }

      // Set initial teacher data from storage
      setTeacher(storedUser);

      // Fetch fresh teacher profile from API to ensure latest data
      try {
        const profileResponse = await fetch(
          `${API_BASE_URL}/api/teacher/profile`,
          {
            headers: {
              'Authorization': `Bearer ${sessionResult.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success) {
            setTeacher(profileData.data);
          }
        }
      } catch (profileError) {
        console.error('Error fetching fresh profile:', profileError);
        // Continue with stored user data if profile fetch fails
      }

      // Fetch dashboard stats
      const statsResponse = await fetch(
        `${API_BASE_URL}/api/teacher/dashboard-stats`,
        {
          headers: {
            'Authorization': `Bearer ${sessionResult.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setDashboardStats(statsData.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard data',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData().then(() => setRefreshing(false));
  };

  const getMoodColor = (emotion) => {
    const emotionColors = {
      pleased: '#A78BFA',      
      happy: '#F472B6',       
      relaxed: '#4ADE80',      
      calm: '#FACC15',         
      angry: '#F87171',       
      disappointed: '#22D3EE', 
      tense: '#818CF8',       
      sad: '#2DD4BF',         
      excited: '#FB923C',      
      bored: '#60A5FA',        
    };
    return emotionColors[emotion?.toLowerCase()] || '#CCCCCC';
  };

  const renderStatCard = (icon, label, value, color = colors.primary) => (
    <View style={{ flex: 1, marginHorizontal: 6 }}>
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 16,
          alignItems: 'center',
          borderLeftWidth: 4,
          borderLeftColor: color,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: color + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          {typeof icon === 'string' ? (
            <MaterialIcons name={icon} size={24} color={color} />
          ) : (
            icon
          )}
        </View>
        <Text
          style={{
            fontSize: fonts.sizes.sm,
            color: '#666',
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: fonts.sizes.lg,
            fontWeight: 'bold',
            color: color,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  const renderMoodDistributionItem = (mood) => (
    <View key={mood._id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: getMoodColor(mood._id),
          marginRight: 12,
        }}
      />
      <Text
        style={{
          fontSize: fonts.sizes.sm,
          color: '#333',
          textTransform: 'capitalize',
          fontWeight: '500',
          minWidth: 80,
        }}
      >
        {mood._id}
      </Text>
      <View
        style={{
          flex: 1,
          height: 6,
          backgroundColor: '#E0E0E0',
          borderRadius: 3,
          overflow: 'hidden',
          marginHorizontal: 12,
        }}
      >
        <View
          style={{
            height: '100%',
            backgroundColor: getMoodColor(mood._id),
            width: `${Math.min((mood.count / (dashboardStats?.moodDistribution?.[0]?.count || 1)) * 100, 100)}%`,
          }}
        />
      </View>
      <Text
        style={{
          fontSize: fonts.sizes.sm,
          fontWeight: 'bold',
          color: colors.primary,
          minWidth: 30,
          textAlign: 'right',
        }}
      >
        {mood.count}
      </Text>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: '#666', fontSize: fonts.sizes.sm }}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fonts.sizes.xs,
                  color: '#999',
                  marginBottom: 4,
                }}
              >
                Welcome back
              </Text>
              <Text
                style={{
                  fontSize: fonts.sizes.xl,
                  fontWeight: 'bold',
                  color: colors.text,
                }}
              >
                {teacher?.firstName} {teacher?.lastName}
              </Text>
              {teacher?.subject && (
                <Text
                  style={{
                    fontSize: fonts.sizes.xs,
                    color: colors.primary,
                    marginTop: 2,
                  }}
                >
                  {teacher.subject}
                </Text>
              )}
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 22,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="menu" size={24} color={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => navigation.navigate('TeacherProfile')}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 28,
                  backgroundColor: colors.secondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {teacher?.avatar && !avatarError ? (
                  <Image
                    source={{ uri: teacher.avatar }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <MaterialIcons name="person" size={28} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Assigned Sections */}

        {/* Stats Cards */}
        <View style={{ paddingHorizontal: 4, marginVertical: 16 }}>
          <View style={{ flexDirection: 'row' }}>
            {renderStatCard(
              'people',
              'Total Students',
              dashboardStats?.studentsCount || 0,
              '#4CAF50'
            )}
            {renderStatCard(
              'assignment',
              'Mood Logs',
              dashboardStats?.totalMoodLogs || 0,
              '#2196F3'
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 4, marginVertical: 8 }}>
          <View style={{ flexDirection: 'row' }}>
            {renderStatCard(
              'date-range',
              'Recent (7 days)',
              dashboardStats?.recentMoodLogs || 0,
              '#FF9800'
            )}
            {renderStatCard(
              'trending-up',
              'Most Common Mood',
              dashboardStats?.mostCommonMood ? dashboardStats.mostCommonMood.charAt(0).toUpperCase() + dashboardStats.mostCommonMood.slice(1) : 'N/A',
              '#E91E63'
            )}
          </View>
        </View>

        {/* Mood Distribution */}
        <View style={{ marginVertical: 20, paddingHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <MaterialCommunityIcons
                name="emoticon-happy"
                size={24}
                color={colors.primary}
              />
              <Text
                style={{
                  fontSize: fonts.sizes.lg,
                  fontWeight: '700',
                  color: colors.text,
                  marginLeft: 8,
                }}
              >
                Mood Distribution
              </Text>
            </View>

            {dashboardStats?.moodDistribution && dashboardStats.moodDistribution.length > 0 ? (
              dashboardStats.moodDistribution.map((mood) =>
                renderMoodDistributionItem(mood)
              )
            ) : (
              <Text
                style={{
                  fontSize: fonts.sizes.sm,
                  color: '#999',
                  textAlign: 'center',
                  paddingVertical: 20,
                }}
              >
                No mood data available yet
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherDashboard;

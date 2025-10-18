import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { fonts } from '../../utils/fonts/fonts';
import { colors } from '../../utils/colors/colors';
import { authService } from '../../services/authService';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const navigation = useNavigation();

  // Load user data when component mounts
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const result = await authService.getStoredUser();
      
      if (result.success) {
        setUser(result.user);
        console.log('✅ User data loaded:', result.user.firstName);
        console.log('🖼️ User avatar URL:', result.user.avatar);
      } else {
        // No stored user data, redirect to login
        console.log('❌ No user data found, redirecting to login');
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      navigation.replace('Login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performSignOut,
        },
      ]
    );
  };

  const performSignOut = async () => {
    setSigningOut(true);
    
    try {
      const result = await authService.logout();
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Signed Out',
          text2: 'You have been successfully signed out.',
          position: 'top',
          visibilityTime: 2000,
        });

        // Navigate to login after a short delay
        setTimeout(() => {
          navigation.replace('Login');
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Sign Out Failed',
          text2: 'There was an error signing out. Please try again.',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign Out Error',
        text2: 'An unexpected error occurred.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setSigningOut(false);
    }
  };

  const handleAvatarError = () => {
    console.log('❌ Avatar failed to load:', user?.avatar);
    setAvatarError(true);
  };

  const handleAvatarLoad = () => {
    console.log('✅ Avatar loaded successfully:', user?.avatar);
    setAvatarError(false);
  };

  // Loading screen while checking user data
  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.accent }}>
        <StatusBar backgroundColor={colors.accent} barStyle="dark-content" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text 
            className="mt-4 text-lg"
            style={{ fontFamily: fonts.regular, color: colors.text }}
          >
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main home screen
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.accent }}>
      <StatusBar backgroundColor={colors.accent} barStyle="dark-content" />
      
      <View className="flex-1 px-8 pt-12">
        {/* Welcome Section with Avatar */}
        <View className="items-center mb-12">
          {/* User Avatar */}
          <View className="mb-6">
            {user?.avatar && !avatarError ? (
              <View className="relative">
                <Image
                  source={{ uri: user.avatar }}
                  className="w-24 h-24 rounded-full"
                  style={{ backgroundColor: colors.primary + '20' }}
                  onError={handleAvatarError}
                  onLoad={handleAvatarLoad}
                />
                {/* Avatar border */}
                <View
                  className="absolute -top-1 -left-1 w-26 h-26 rounded-full border-2"
                  style={{
                    width: 104,
                    height: 104,
                    borderRadius: 52,
                    borderColor: colors.primary,
                  }}
                />
              </View>
            ) : (
              /* Fallback Avatar */
              <View
                className="w-24 h-24 rounded-full justify-center items-center border-2"
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.primary + '30',
                }}
              >
                <Text
                  className="text-4xl font-bold"
                  style={{
                    fontFamily: fonts.bold,
                    color: colors.white,
                  }}
                >
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>

          {/* Welcome Message */}
          <Text 
            className="text-3xl font-semibold text-center mb-2"
            style={{ fontFamily: fonts.semiBold, color: colors.text }}
          >
            Welcome back,
          </Text>
          <Text 
            className="text-4xl font-bold text-center"
            style={{ fontFamily: fonts.bold, color: colors.primary }}
          >
            {user?.firstName || 'User'}! 👋
          </Text>
          
          {/* Subtitle */}
          <Text 
            className="text-lg text-center mt-4 opacity-70"
            style={{ fontFamily: fonts.regular, color: colors.text }}
          >
            Ready to track your mindful journey today?
          </Text>
        </View>

        {/* User Info Card */}
        <View 
          className="p-6 rounded-2xl mb-8"
          style={{
            backgroundColor: colors.white,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text 
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: fonts.semiBold, color: colors.text }}
          >
            Account Info
          </Text>
          <Text 
            className="text-base mb-1"
            style={{ fontFamily: fonts.regular, color: colors.text }}
          >
            Name: {user?.firstName} {user?.lastName}
          </Text>
          <Text 
            className="text-base mb-1"
            style={{ fontFamily: fonts.regular, color: colors.text }}
          >
            Email: {user?.email}
          </Text>
          {user?.section && (
            <Text 
              className="text-base mb-1"
              style={{ fontFamily: fonts.regular, color: colors.text }}
            >
              Section: {user.section}
            </Text>
          )}
          {/* Debug info for avatar */}
          {user?.avatar && (
            <Text 
              className="text-sm mt-2 opacity-60"
              style={{ fontFamily: fonts.regular, color: colors.text }}
            >
              Avatar: {avatarError ? '❌ Failed to load' : '✅ Loaded successfully'}
            </Text>
          )}
        </View>

        {/* Spacer to push sign out button to bottom */}
        <View className="flex-1" />

        {/* Sign Out Button */}
        <View className="mb-8">
          <TouchableOpacity
            className="py-4 rounded-xl items-center border-2"
            style={{
              backgroundColor: signingOut ? '#FF6B6B70' : colors.white,
              borderColor: '#FF6B6B',
              shadowColor: '#FF6B6B',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#FF6B6B" style={{ marginRight: 8 }} />
                <Text
                  className="text-lg font-semibold"
                  style={{ fontFamily: fonts.semiBold, color: '#FF6B6B' }}
                >
                  Signing Out...
                </Text>
              </View>
            ) : (
              <Text
                className="text-lg font-semibold"
                style={{ fontFamily: fonts.semibold, color: '#FF6B6B' }}
              >
                Sign Out
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
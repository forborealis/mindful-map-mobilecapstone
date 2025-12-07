import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import TeacherDashboard from '../screens/Teacher/Dashboard';
import TeacherProfile from '../screens/Teacher/Profile';
import SectionStudents from '../screens/Teacher/SectionStudents';
import StudentLogs from '../screens/Teacher/StudentLogs';
import { authService } from '../services/authService';
import { teacherService } from '../services/teacherService';
import { colors } from '../utils/colors/colors';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = ({ navigation, state }) => {
  const [signingOut, setSigningOut] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  // Load teacher data on initial mount
  useEffect(() => {
    loadTeacherData();
  }, []);

  // Refresh teacher data when drawer comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTeacherData();
    }, [])
  );

  // Refresh data when drawer state changes (when returning from a screen)
  useEffect(() => {
    if (state?.index !== undefined) {
      loadTeacherData();
    }
  }, [state?.index]);

  const loadTeacherData = async () => {
    try {
      // Get cached user first for immediate display
      const cachedUser = await authService.getCurrentUser();
      setTeacher(cachedUser);
      
      // Then fetch fresh profile with assignedSections from API
      const result = await teacherService.getTeacherProfile();
      if (result.success && result.data) {
        setTeacher(result.data);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
      // Keep using cached user if API call fails
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
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to sign out',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred during sign out',
        position: 'top',
      });
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header Section */}
      <View
        style={{
          backgroundColor: colors.primary,
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.secondary,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {teacher?.avatar && !avatarError ? (
              <Image
                source={{ uri: teacher.avatar }}
                style={{ width: 60, height: 60, borderRadius: 30 }}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <MaterialIcons name="person" size={32} color={colors.white} />
            )}
          </View>

          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{
                color: colors.white,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 2,
              }}
            >
              {teacher?.firstName} {teacher?.lastName}
            </Text>
            {teacher?.subject && (
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: '500',
                }}
              >
                {teacher.subject}
              </Text>
            )}
            <Text
              style={{
                color: colors.accent,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {teacher?.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={{ flex: 1, paddingTop: 8 }}>
        {/* Dashboard */}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('TeacherDashboard');
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginVertical: 4,
            backgroundColor:
              state.routeNames[state.index] === 'TeacherDashboard'
                ? colors.accent
                : 'transparent',
          }}
        >
          <MaterialIcons name="dashboard" size={24} color={colors.primary} />
          <Text
            style={{
              marginLeft: 16,
              fontSize: 14,
              color: colors.text,
              fontWeight: '500',
            }}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Student Logs with Dropdown */}
        <View>
          <TouchableOpacity
            onPress={() => setShowSectionDropdown(!showSectionDropdown)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginVertical: 4,
              backgroundColor:
                state.routeNames[state.index] === 'SectionStudents'
                  ? colors.accent
                  : 'transparent',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="emoticon" size={24} color={colors.primary} />
              <Text
                style={{
                  marginLeft: 16,
                  fontSize: 14,
                  color: colors.text,
                  fontWeight: '500',
                }}
              >
                Student Logs
              </Text>
            </View>
            <MaterialIcons
              name={showSectionDropdown ? 'expand-less' : 'expand-more'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          {/* Sections Dropdown */}
          {showSectionDropdown && (
            <View style={{ backgroundColor: '#F5F5F5' }}>
              {teacher?.assignedSections && teacher.assignedSections.length > 0 ? (
                teacher.assignedSections.map((section, index) => (
                  <TouchableOpacity
                    key={`${section}-${index}`}
                    onPress={() => {
                      navigation.navigate('SectionStudents', { section });
                      setShowSectionDropdown(false);
                    }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      paddingLeft: 50,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.primary,
                      marginVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.text,
                        fontWeight: '500',
                      }}
                    >
                      {section}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 50,
                    fontSize: 12,
                    color: '#999',
                  }}
                >
                  No sections assigned
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Profile */}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('TeacherProfile');
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginVertical: 4,
            backgroundColor:
              state.routeNames[state.index] === 'TeacherProfile'
                ? colors.accent
                : 'transparent',
          }}
        >
          <MaterialIcons name="person" size={24} color={colors.primary} />
          <Text
            style={{
              marginLeft: 16,
              fontSize: 14,
              color: colors.text,
              fontWeight: '500',
            }}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={signingOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: '#FF6B6B',
            borderRadius: 8,
            opacity: signingOut ? 0.6 : 1,
          }}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MaterialIcons name="logout" size={24} color={colors.white} />
          )}
          <Text
            style={{
              marginLeft: 12,
              fontSize: 14,
              color: colors.white,
              fontWeight: '600',
            }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function TeacherDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen
        name="TeacherDashboard"
        component={TeacherDashboard}
        options={{
          drawerLabel: 'Dashboard',
        }}
      />
      <Drawer.Screen
        name="SectionStudents"
        component={SectionStudents}
        options={{
          drawerLabel: 'Student Logs',
        }}
      />
      <Drawer.Screen
        name="StudentLogs"
        component={StudentLogs}
        options={{
          drawerLabel: 'Student Logs Detail',
        }}
      />
      <Drawer.Screen
        name="TeacherProfile"
        component={TeacherProfile}
        options={{
          drawerLabel: 'Profile',
        }}
      />
    </Drawer.Navigator>
  );
}

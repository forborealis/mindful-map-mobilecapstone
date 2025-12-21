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
import AdminDashboard from '../screens/Admin/Dashboard';
import StudentsScreen from '../screens/Admin/Students';
import TeachersScreen from '../screens/Admin/Teachers';
import { authService } from '../services/authService';
import { colors } from '../utils/colors/colors';
import { fonts } from '../utils/fonts/fonts';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = ({ navigation, state }) => {
  const [signingOut, setSigningOut] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  // Load admin data on initial mount
  useEffect(() => {
    loadAdminData();
  }, []);

  // Refresh admin data when drawer comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAdminData();
    }, [])
  );

  // Refresh data when drawer state changes (when returning from a screen)
  useEffect(() => {
    if (state?.index !== undefined) {
      loadAdminData();
    }
  }, [state?.index]);

  const loadAdminData = async () => {
    try {
      const cachedUser = await authService.getCurrentUser();
      setAdmin(cachedUser);
    } catch (error) {
      console.error('Error loading admin data:', error);
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
              backgroundColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {admin?.avatar && !avatarError ? (
              <Image
                source={{ uri: admin.avatar }}
                style={{ width: '100%', height: '100%' }}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={60} color="white" />
            )}
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: 'white',
                fontFamily: fonts.bold,
              }}
            >
              {admin?.firstName || 'Admin'}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
                marginTop: 2,
                fontFamily: fonts.regular,
              }}
            >
              Administrator
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingTop: 10 }}>
        {/* Users */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Users')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginVertical: 4,
            marginHorizontal: 8,
            borderRadius: 8,
            backgroundColor:
              state?.routeNames[state?.index] === 'Users'
                ? 'rgba(52, 152, 219, 0.1)'
                : 'transparent',
          }}
        >
          <MaterialCommunityIcons
            name="account-multiple"
            size={24}
            color={
              state?.routeNames[state?.index] === 'Users'
                ? colors.primary
                : colors.text
            }
          />
          <Text
            style={{
              marginLeft: 16,
              fontSize: 16,
              fontFamily: fonts.regular,
              color:
                state?.routeNames[state?.index] === 'Users'
                  ? colors.primary
                  : colors.text,
            }}
          >
            Users
          </Text>
        </TouchableOpacity>

        {/* Teachers */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Teachers')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginVertical: 4,
            marginHorizontal: 8,
            borderRadius: 8,
            backgroundColor:
              state?.routeNames[state?.index] === 'Teachers'
                ? 'rgba(52, 152, 219, 0.1)'
                : 'transparent',
          }}
        >
          <MaterialCommunityIcons
            name="account-tie"
            size={24}
            color={
              state?.routeNames[state?.index] === 'Teachers'
                ? colors.primary
                : colors.text
            }
          />
          <Text
            style={{
              marginLeft: 16,
              fontSize: 16,
              fontFamily: fonts.regular,
              color:
                state?.routeNames[state?.index] === 'Teachers'
                  ? colors.primary
                  : colors.text,
            }}
          >
            Teachers
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: 'rgba(0,0,0,0.1)',
            marginVertical: 12,
            marginHorizontal: 16,
          }}
        />

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={signingOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginVertical: 4,
            marginHorizontal: 8,
            borderRadius: 8,
            backgroundColor: 'transparent',
          }}
        >
          <MaterialIcons name="logout" size={24} color="#FF5252" />
          <Text
            style={{
              marginLeft: 16,
              fontSize: 16,
              fontFamily: fonts.regular,
              color: '#FF5252',
            }}
          >
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export const AdminDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
      }}
    >
      <Drawer.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{
          title: 'Dashboard',
        }}
      />
      <Drawer.Screen
        name="Users"
        component={StudentsScreen}
        options={{
          title: 'Users',
        }}
      />
      <Drawer.Screen
        name="Teachers"
        component={TeachersScreen}
        options={{
          title: 'Teachers',
        }}
      />
    </Drawer.Navigator>
  );
};

export default AdminDrawer;

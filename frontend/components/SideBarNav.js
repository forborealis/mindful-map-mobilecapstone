import React from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import MoodEntries from '../screens/User/MoodEntries';
import Home from '../screens/User/Home';
import Calendar from '../screens/User/Calendar';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors/colors';
import { fonts } from '../utils/fonts/fonts';

const Drawer = createDrawerNavigator();

const Placeholder = () => <></>;

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => props.navigation.closeDrawer()}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 30,
            padding: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.background} />
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function SideBarNav() {
  const handleSignOut = async (navigation) => {
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
          onPress: async () => {
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
                navigation.replace('Login');
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
            }
          },
        },
      ]
    );
  };

  return (
    <Drawer.Navigator
      initialRouteName="Mood Entries"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        drawerStyle: {
          backgroundColor: colors.background,
          width: 240,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
        drawerLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 16,
        },
        headerStyle: {
          backgroundColor: colors.secondary,
          height: 70,
        },
        headerTintColor: colors.white,
        headerTitle: '',
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
            <Ionicons name="menu" size={24} color={colors.white} />
          </TouchableOpacity>
        ),
        headerShown: true,
      })}
    >
      <Drawer.Screen
        name="Mood Entries"
        component={MoodEntries}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Home"
        component={Home}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Calendar"
        component={Calendar}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Sign Out"
        component={Placeholder}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="log-out" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            handleSignOut(navigation);
          },
        })}
      />
    </Drawer.Navigator>
  );
}
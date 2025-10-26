import React from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MoodEntries from './screens/User/MoodEntries';
import Home from './screens/User/Home'; // Example screen
import { authService } from './services/authService'; // Import authService
import Toast from 'react-native-toast-message';

const Drawer = createDrawerNavigator();

export default function AppNavigator({ navigation }) {
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

                // Navigate to Signin screen
                navigation.replace('Signin');
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
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="MoodEntries"
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#fff', // Sidebar background color
            width: 240, // Sidebar width
          },
          drawerActiveTintColor: '#0d9488', // Active item color
          drawerInactiveTintColor: 'gray', // Inactive item color
          headerShown: true, // Show header for each screen
        }}
      >
        <Drawer.Screen name="MoodEntries" component={MoodEntries} />
        <Drawer.Screen name="Home" component={Home} />
        <Drawer.Screen
          name="Sign Out"
          component={() => null} // Empty screen for sign-out logic
          listeners={({ navigation }) => ({
            drawerItemPress: (e) => {
              e.preventDefault(); // Prevent navigation
              handleSignOut(navigation); // Call the sign-out logic
            },
          })}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
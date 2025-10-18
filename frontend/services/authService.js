import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

export const authService = {
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token);
      }
      return data;
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  },

  async signInWithGoogle() {
    try {
      console.log('🔍 Checking Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign out first to ensure account picker shows
      console.log('🔍 Signing out to show account picker...');
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {

        console.log('Sign out result (expected if not signed in):', signOutError.message);
      }
      
      console.log('🔍 Starting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In response:', userInfo);
      
        // Check if user cancelled
      if (userInfo.type === 'cancelled' || userInfo.data === null) {
        console.log('🚫 User cancelled Google Sign-In');
        return { success: false, error: 'Sign-in was cancelled' };
      }
    
      const user = userInfo.user || userInfo.data?.user;
      
      if (!user) {
        console.log('❌ No user data in response:', userInfo);
        return { success: false, error: 'Sign-in was cancelled' }; 
      }

      const userData = {
        uid: user.id, 
        email: user.email,
        firstName: user.givenName || '',
        lastName: user.familyName || '',
        avatar: user.photo || '',
      };

      console.log('🔍 Sending to backend:', userData);
      
      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const responseData = await backendResponse.json();
      console.log('✅ Backend response:', responseData);
      
      if (responseData?.success) {
        await AsyncStorage.setItem('user', JSON.stringify(responseData.user));
        await AsyncStorage.setItem('token', responseData.token);
        return { 
          success: true, 
          user: responseData.user, 
          token: responseData.token, 
          isNewUser: responseData.isNewUser 
        };
      }
      throw new Error(responseData?.error || 'Backend authentication failed');
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      
      if (error?.code === 'sign_in_cancelled') {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      if (error?.code === 'play_services_not_available') {
        return { success: false, error: 'Google Play Services not available. Please install Google Play Services.' };
      }
      if (error?.code === 'NETWORK_ERROR') {
        return { success: false, error: 'Network error. Please check your internet connection.' };
      }
      
      return { success: false, error: error.message || 'Google Sign-In failed. Please try again.' };
    }
  },

  async register(userData, avatarUri = null) {
    try {
      const formData = new FormData();
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('firstName', userData.firstName);
      formData.append('lastName', userData.lastName);
      
      if (userData.middleInitial) formData.append('middleInitial', userData.middleInitial);
      if (userData.gender) formData.append('gender', userData.gender);
      if (userData.section) formData.append('section', userData.section);

      if (avatarUri) {
        const filename = avatarUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('avatar', { uri: avatarUri, type, name: filename || 'avatar.jpg' });
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token);
      }
      return data;
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  },

  async logout() {
    try {
      // Try to sign out from Google - catch any errors gracefully
      try {
        await GoogleSignin.signOut();
        console.log('✅ Google sign-out successful');
      } catch (googleError) {
        // Ignore Google sign-out errors - user might not be signed in with Google
        console.log('Google sign-out result (expected if not signed in via Google):', googleError.message);
      }
      
      // Always remove local storage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      console.log('✅ Local storage cleared');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to remove local storage even if something else fails
      try {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
      } catch (storageError) {
        console.error('Failed to clear storage:', storageError);
      }
      return { success: true }; // Return success anyway since logout should always work
    }
  },

  async getStoredUser() {
    try {
      const userString = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (userString && token) {
        return { success: true, user: JSON.parse(userString), token };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }
};
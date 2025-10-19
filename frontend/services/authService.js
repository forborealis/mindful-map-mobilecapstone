import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

export const authService = {
   async checkAuthStatus() {
    try {
      console.log('Checking authentication status...');
      
      const userString = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
      
      if (!userString || !token) {
        console.log('No session found - user needs to login');
        return { isAuthenticated: false, user: null, token: null };
      }

      const user = JSON.parse(userString);
      
      // Check if session is still valid (30 days)
      if (loginTimestamp) {
        const now = Date.now();
        const sessionAge = now - parseInt(loginTimestamp);
        const maxAge = 30 * 24 * 60 * 60 * 1000; 
        
        if (sessionAge > maxAge) {
          console.log('Session expired (older than 30 days)');
          await this.clearSession();
          return { isAuthenticated: false, user: null, token: null };
        }
      }
      
      console.log('Valid session found for:', user.email);
      return { isAuthenticated: true, user, token };
      
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { isAuthenticated: false, user: null, token: null };
    }
  },

   async saveSession(user, token) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('loginTimestamp', Date.now().toString());
      await AsyncStorage.setItem('isAuthenticated', 'true');
      
      console.log('Session saved successfully for:', user.email);
      console.log('Login timestamp:', new Date().toLocaleString());
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  },

  async clearSession() {
    try {
      await AsyncStorage.multiRemove([
        'user',
        'token',
        'loginTimestamp',
        'isAuthenticated'
      ]);
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async login(email, password) {
    try {
      console.log('Attempting login for:', email);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        await this.saveSession(data.user, data.token);
        console.log('Login successful, session saved');
      } else {
        console.log('Login failed:', data.error);
      }

      return data;
    } catch (error) {
      console.error('Network error during login:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  },

  async signInWithGoogle() {
    try {
      console.log('Checking Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      console.log('Signing out to show account picker...');
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {

        console.log('Sign out result (expected if not signed in):', signOutError.message);
      }
      
      console.log('Starting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In response:', userInfo);
      
      if (userInfo.type === 'cancelled' || userInfo.data === null) {
        console.log('User cancelled Google Sign-In');
        return { success: false, error: 'Sign-in was cancelled' };
      }
    
      const user = userInfo.user || userInfo.data?.user;
      
      if (!user) {
        console.log('No user data in response:', userInfo);
        return { success: false, error: 'Sign-in was cancelled' }; 
      }

      const userData = {
        uid: user.id, 
        email: user.email,
        firstName: user.givenName || '',
        lastName: user.familyName || '',
        avatar: user.photo || '',
      };
      
      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const responseData = await backendResponse.json();
      console.log('Backend response:', responseData);
      
      if (responseData?.success) {
        await this.saveSession(responseData.user, responseData.token);
        console.log('Google login successful, session saved');
        return { 
          success: true, 
          user: responseData.user, 
          token: responseData.token, 
          isNewUser: responseData.isNewUser 
        };
      }
      throw new Error(responseData?.error || 'Backend authentication failed');
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
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
        await this.saveSession(data.user, data.token);
        console.log('Registration successful, session saved');
      } else {
        console.log('Registration failed:', data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Network error during registration:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  },

  async logout() {
    try {
      try {
        await GoogleSignin.signOut();
        console.log('Google sign-out successful');
      } catch (googleError) {
 
        console.log('Google sign-out result (expected if not signed in via Google):', googleError.message);
      }
      
      await this.clearSession();
      console.log('Logout successful');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      try {
        await this.clearSession();
      } catch (storageError) {
        console.error('Failed to clear storage:', storageError);
      }
      return { success: true }; 
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
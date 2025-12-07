import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCustomToken, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

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

      // Wait for Firebase Auth to be ready before checking currentUser
      console.log('Waiting for Firebase Auth to initialize...');
      const firebaseUser = await this.waitForFirebaseAuth();
      
      console.log('Firebase Auth ready. Current user:', firebaseUser ? firebaseUser.email : 'None');
      
      if (firebaseUser) {
        try {
          const freshToken = await firebaseUser.getIdToken(false);
          await AsyncStorage.setItem('token', freshToken);
          console.log('Valid session found for:', user.email);
          console.log('Fresh token length:', freshToken.length);
          return { isAuthenticated: true, user, token: freshToken };
        } catch (tokenError) {
          console.log('Token refresh failed, need to re-login:', tokenError);
          await this.clearSession();
          return { isAuthenticated: false, user: null, token: null };
        }
      } else {
        // No Firebase user found after waiting - session mismatch
        console.log('No Firebase user found after auth initialization. Session mismatch detected.');
        console.log('Clearing local session to prevent future errors.');
        await this.clearSession();
        return { isAuthenticated: false, user: null, token: null };
      }
      
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { isAuthenticated: false, user: null, token: null };
    }
  },

   async saveSession(user, customToken) {
    try {
      console.log('Saving session with custom token...');
      console.log('Custom token length:', customToken ? customToken.length : 0);
      
      // Sign in with the custom token to get a valid Firebase user
      console.log('Signing in with custom token...');
      const userCredential = await signInWithCustomToken(auth, customToken);
      const firebaseUser = userCredential.user;
      console.log('Firebase user signed in:', firebaseUser.email);
      console.log('Firebase user UID:', firebaseUser.uid);
      
      // Verify the user is actually signed in by checking auth.currentUser
      console.log('Verifying Firebase user session...');
      const currentUser = auth.currentUser;
      console.log('Current Firebase user after sign in:', currentUser ? currentUser.email : 'None');
      
      if (!currentUser) {
        throw new Error('Firebase user session was not established properly');
      }
      
      // Get the ID token for API calls
      console.log('Getting ID token...');
      const idToken = await firebaseUser.getIdToken();
      console.log('ID token received, length:', idToken ? idToken.length : 0);
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', idToken);
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

  async getToken() {
    try {
      // First try to get a fresh token from Firebase if user is signed in
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          console.log('Getting fresh ID token from Firebase...');
          const freshToken = await currentUser.getIdToken(true); // Force refresh
          console.log('Fresh token obtained, length:', freshToken.length);
          await AsyncStorage.setItem('token', freshToken);
          return freshToken;
        } catch (firebaseError) {
          console.log('Could not get fresh token from Firebase:', firebaseError.message);
          // Fall through to stored token
        }
      }
      
      // Fall back to stored token if Firebase is not available
      const token = await AsyncStorage.getItem('token');
      console.log('Using stored token, length:', token ? token.length : 0);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async login(email, password) {
    try {
      console.log('Attempting login for:', email);

      // First verify credentials with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        // Instead of using custom token, sign in directly with Firebase
        console.log('Backend login successful, signing in with Firebase...');
        
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          console.log('Firebase sign-in successful for:', firebaseUser.email);
          
          // Get ID token for API calls
          const idToken = await firebaseUser.getIdToken();
          console.log('ID token obtained, length:', idToken.length);
          
          // Save session with the ID token instead of custom token
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          await AsyncStorage.setItem('token', idToken);
          await AsyncStorage.setItem('loginTimestamp', Date.now().toString());
          await AsyncStorage.setItem('isAuthenticated', 'true');
          
          console.log('Session saved successfully for:', data.user.email);
          console.log('Login timestamp:', new Date().toLocaleString());
          
          return data;
        } catch (firebaseError) {
          console.error('Firebase sign-in failed:', firebaseError);
          return { success: false, error: 'Authentication failed. Please check your credentials.' };
        }
      } else {
        console.log('Login failed:', data.error);
        return data;
      }
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
      // Sign out from Firebase Auth
      try {
        await signOut(auth);
        console.log('Firebase sign-out successful');
      } catch (firebaseError) {
        console.log('Firebase sign-out result (expected if not signed in):', firebaseError.message);
      }

      // Sign out from Google
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
  },

  async waitForFirebaseAuth() {
    return new Promise((resolve) => {
      let hasResolved = false;
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!hasResolved) {
          hasResolved = true;
          console.log('Firebase auth state changed:', user ? user.email : 'No user');
          unsubscribe();
          resolve(user);
        }
      });
      
      // Fallback timeout in case the listener doesn't fire
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          console.log('Firebase auth state timeout, proceeding with current user...');
          unsubscribe();
          resolve(auth.currentUser);
        }
      }, 8000); // Increased to 3 seconds for better reliability
    });
  },

  async getFreshToken() {
    try {
      console.log('Getting fresh token...');
      const currentUser = auth.currentUser;
      console.log('Current Firebase user:', currentUser ? currentUser.email : 'None');
      
      if (currentUser) {
        console.log('Requesting fresh ID token...');
        const freshToken = await currentUser.getIdToken(true); // Force refresh
        console.log('Fresh token received, length:', freshToken ? freshToken.length : 0);
        await AsyncStorage.setItem('token', freshToken);
        return freshToken;
      }
      console.log('No current Firebase user found');
      return null;
    } catch (error) {
      console.error('Error getting fresh token:', error);
      return null;
    }
  },

  async updateProfile(uid, updateData, avatarUri = null) {
    try {
      console.log('Updating profile for:', uid);

      const formData = new FormData();
      
      // Add optional fields
      if (updateData.email) formData.append('email', updateData.email);
      if (updateData.password) formData.append('password', updateData.password);
      if (updateData.confirmPassword) formData.append('confirmPassword', updateData.confirmPassword);

      // Add avatar if provided
      if (avatarUri) {
        const filename = avatarUri.uri ? avatarUri.uri.split('/').pop() : avatarUri.split('/').pop();
        const uri = avatarUri.uri || avatarUri;
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('avatar', { uri, type, name: filename || 'avatar.jpg' });
      }

      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/${uid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        // Update stored user data
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        console.log('Profile updated successfully');
      } else {
        console.log('Profile update failed:', data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Network error during profile update:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  },

  // Subscribe to auth changes
  subscribeToAuthChanges(callback) {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
      if (callback) {
        callback();
      }
    });
    
    return unsubscribe;
  }
};
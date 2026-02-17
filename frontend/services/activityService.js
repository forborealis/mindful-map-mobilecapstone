import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_NODE_API_URL;

const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    let token = await AsyncStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });

    if (response.status === 401 && token) {
      console.log('Token expired, refreshing...');
      const freshToken = await authService.getFreshToken();
      if (freshToken) {
        headers.Authorization = `Bearer ${freshToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers
        });
        return retryResponse.json();
      } else {
        throw new Error('Authentication failed');
      }
    }

    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

export const activityService = {
  async getBreathingProgress() {
    try {
      return await makeAuthenticatedRequest('/api/activity/breathing/progress');
    } catch (error) {
      console.error('Error fetching breathing progress:', error);
      throw error;
    }
  },

  async updateBreathingProgress(update) {
    try {
      return await makeAuthenticatedRequest('/api/activity/breathing/progress', {
        method: 'POST',
        body: JSON.stringify(update)
      });
    } catch (error) {
      console.error('Error updating breathing progress:', error);
      throw error;
    }
  }
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

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

    // If token is expired, try to get a fresh one
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

export const musicService = {
  // Get all music categories with counts
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/categories`);
      return response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get music by category
  async getMusicByCategory(category) {
    try {
      return await makeAuthenticatedRequest(`/api/music/category/${category}`);
    } catch (error) {
      console.error('Error fetching music by category:', error);
      throw error;
    }
  },

  // Get all music
  async getAllMusic() {
    try {
      return await makeAuthenticatedRequest('/api/music');
    } catch (error) {
      console.error('Error fetching all music:', error);
      throw error;
    }
  },

  // Get single music track
  async getMusicById(id) {
    try {
      return await makeAuthenticatedRequest(`/api/music/${id}`);
    } catch (error) {
      console.error('Error fetching music by id:', error);
      throw error;
    }
  },

  // Increment play count
  async incrementPlayCount(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/${id}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    } catch (error) {
      console.error('Error incrementing play count:', error);
      throw error;
    }
  },

  // Add music to favorites
  async addToFavorites(musicId) {
    try {
      return await makeAuthenticatedRequest(`/api/music/${musicId}/favorite`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  // Remove music from favorites
  async removeFromFavorites(musicId) {
    try {
      return await makeAuthenticatedRequest(`/api/music/${musicId}/favorite`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },

  // Get user's favorite music
  async getFavorites(category = null) {
    try {
      const url = category 
        ? `/api/music/user/favorites?category=${category}`
        : '/api/music/user/favorites';
      
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }
};
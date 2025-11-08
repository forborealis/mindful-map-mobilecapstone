import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

class PredictionService {
  
  async getAuthHeaders() {
    try {
      let token = await AsyncStorage.getItem('token');
      
      // If no token, try to get a fresh one
      if (!token) {
        const { authService } = await import('./authService');
        token = await authService.getFreshToken();
      }
      
      return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  async predictMood() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_URL}/api/predict-mood`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get mood prediction: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Prediction service error:', error);
      throw error;
    }
  }

  async predictCategoryMood(category) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_URL}/api/predict-category-mood?category=${category}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get category mood prediction: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Category prediction service error:', error);
      throw error;
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    try {
      let headers = await this.getAuthHeaders();
      console.log('Making authenticated request to:', url);
      
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
      });

      console.log('Response status:', response.status);

      // If unauthorized, try to refresh token and retry once
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        const { authService } = await import('./authService');
        const freshToken = await authService.getFreshToken();
        console.log('Fresh token obtained:', freshToken ? 'Yes' : 'No');
        
        if (freshToken) {
          headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${freshToken}`
          };
          
          console.log('Retrying request with fresh token...');
          const retryResponse = await fetch(url, {
            ...options,
            headers: { ...headers, ...(options.headers || {}) }
          });
          
          console.log('Retry response status:', retryResponse.status);
          return retryResponse;
        } else {
          console.log('Could not get fresh token, user needs to re-login');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error in authenticated request:', error);
      throw error;
    }
  }

  async checkCategoryData() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_URL}/api/check-category-data`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check category data availability: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Check category data service error:', error);
      throw error;
    }
  }

  async getMoodLogs() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_URL}/api/mood-logs`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get mood logs: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get mood logs service error:', error);
      throw error;
    }
  }
}

export const predictionService = new PredictionService();
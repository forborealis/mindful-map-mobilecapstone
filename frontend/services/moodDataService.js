import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

export const moodDataService = {
  async getStoredUserId() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.uid;
      }
      return null;
    } catch (error) {
      console.error('Error getting stored user ID:', error);
      return null;
    }
  },

  async getAuthHeaders() {
    try {
      let token = await AsyncStorage.getItem('token');
      
      // If no token, try to get a fresh one
      if (!token) {
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
  },

  async getUserMoodLogs(options = {}) {
    try {
      console.log('Starting getUserMoodLogs...');
      
      const userId = await this.getStoredUserId();
      console.log('Retrieved user ID:', userId);
      
      if (!userId) {
        throw new Error('User not found. Please login again.');
      }

      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.page) params.append('page', options.page.toString());
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const url = `${API_BASE_URL}/api/mood-data/logs/user/${userId}?${params.toString()}`;

      
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      //console.log('API Response received:', data);
      console.log('Mood logs count:', Array.isArray(data.moodLogs) ? data.moodLogs.length : 'Response structure:', typeof data);

      return {
        success: true,
        moodLogs: data.moodLogs || data.logs || data || [],
        pagination: data.pagination || null
      };
    } catch (error) {
      console.error('Error fetching mood logs:', error);
      return {
        success: false,
        error: error.message,
        moodLogs: []
      };
    }
  },

  async getMoodLogById(moodLogId) {
    try {
      const userId = await this.getStoredUserId();
      if (!userId) {
        throw new Error('User not found. Please login again.');
      }

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/mood-data/logs/${moodLogId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch mood log: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        moodLog: data
      };
    } catch (error) {
      console.error('Error fetching mood log:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async getUserMoodStats(options = {}) {
    try {
      const userId = await this.getStoredUserId();
      if (!userId) {
        throw new Error('User not found. Please login again.');
      }

      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/mood-data/stats/user/${userId}?${params.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        console.log('Stats endpoint failed, returning empty stats');
        return {
          success: true,
          stats: { totalLogs: 0, averages: {} }
        };
      }

      const data = await response.json();
      return {
        success: true,
        stats: data
      };
    } catch (error) {
      console.error('Error fetching mood stats:', error);
      return {
        success: true,
        stats: { totalLogs: 0, averages: {} }
      };
    }
  },

  async getRecentMoodLogs(limit = 10) {
    try {
      const result = await this.getUserMoodLogs({ limit, page: 1 });
      if (result.success) {
        return {
          success: true,
          moodLogs: result.moodLogs.slice(0, limit)
        };
      }
      return result;
    } catch (error) {
      console.error('Error fetching recent mood logs:', error);
      return {
        success: false,
        error: error.message,
        moodLogs: []
      };
    }
  },

  calculateMoodImprovement(moodLogs) {
    if (!Array.isArray(moodLogs) || moodLogs.length === 0) return 0;
    
    const improvements = moodLogs.filter(log => 
      log.afterIntensity > log.beforeIntensity
    );
    
    return Math.round((improvements.length / moodLogs.length) * 100);
  },

  async makeAuthenticatedRequest(url, options = {}) {
    try {
      let headers = await this.getAuthHeaders();
      console.log('Making authenticated request to:', url);
      console.log('Auth headers:', headers);
      
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
      });

      console.log('Response status:', response.status);

      // If unauthorized, try to refresh token and retry once
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
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
  },

  async saveMoodLog(moodData) {
    try {
      console.log('Saving mood data:', moodData);
      
      // Validate that category is present
      if (!moodData.category) {
        console.error('ERROR: Category is missing from moodData!');
        throw new Error('Category is required but missing from mood data');
      }
      
      console.log('Category received:', moodData.category);
      
      // Clean up data based on category - only send relevant fields
      const cleanedData = {
        category: moodData.category,
        beforeValence: moodData.beforeValence,
        beforeEmotion: moodData.beforeEmotion,
        beforeIntensity: moodData.beforeIntensity,
        beforeReason: moodData.beforeReason,
        afterValence: moodData.afterValence,
        afterEmotion: moodData.afterEmotion,
        afterIntensity: moodData.afterIntensity,
        afterReason: moodData.afterReason
      };

      // Add category-specific fields
      if (moodData.category === 'sleep') {
        if (moodData.hrs !== undefined && moodData.hrs !== null) {
          cleanedData.hrs = moodData.hrs;
        }
        if (moodData.selectedDate) {
          cleanedData.selectedDate = moodData.selectedDate;
        }
      } else {
        // For non-sleep categories (activity, social, health)
        if (moodData.activity) {
          cleanedData.activity = moodData.activity;
        }
        if (moodData.selectedTime) {
          cleanedData.selectedTime = moodData.selectedTime;
        }
        if (moodData.selectedDate) {
          cleanedData.selectedDate = moodData.selectedDate;
        }
      }

      console.log('Cleaned mood data:', cleanedData);
      console.log('Final category being sent:', cleanedData.category);
      console.log('Request body being sent:', JSON.stringify(cleanedData));
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/mood-data/logs/save`, {
        method: 'POST',
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        console.error('Response status:', response.status);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to save mood log: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        log: data.log,
        message: data.message
      };
    } catch (error) {
      console.error('Error saving mood log:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async getTodaysLastMoodLog(category = null, date = null) {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (date) params.append('date', date);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/mood-data/logs/today/last?${params.toString()}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch today's last mood log: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        lastLog: data.lastLog,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching today\'s last mood log:', error);
      return {
        success: false,
        error: error.message,
        lastLog: null
      };
    }
  },

  async getTodaysSleepLog() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/mood-data/logs/today/sleep`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch today's sleep log: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        sleepLog: data.sleepLog,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching today\'s sleep log:', error);
      return {
        success: false,
        error: error.message,
        sleepLog: null
      };
    }
  },

  async updateSleepHours(hrs, date = null) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/mood-data/logs/sleep/update`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ hrs, date })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update sleep hours: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        log: data.log,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating sleep hours:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async checkMoodLogs() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/mood-data/logs/check`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to check mood logs: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        allowAccess: data.allowAccess,
        skippedTwoWeeks: data.skippedTwoWeeks,
        logsLastWeek: data.logsLastWeek,
        logsTwoWeeksAgo: data.logsTwoWeeksAgo
      };
    } catch (error) {
      console.error('Error checking mood logs:', error);
      return {
        success: false,
        error: error.message,
        allowAccess: true // Default to allow access if check fails
      };
    }
  },

  async getPaginatedMoodLogs(options = {}) {
    try {
      const headers = await this.getAuthHeaders();
      
      const params = new URLSearchParams();
      if (options.month) params.append('month', options.month.toString());
      if (options.year) params.append('year', options.year.toString());
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.category) params.append('category', options.category);
      
      const response = await fetch(`${API_BASE_URL}/api/mood-data/logs/paginated?${params.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch paginated mood logs: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        moodLogs: Array.isArray(data) ? data : []
      };
    } catch (error) {
      console.error('Error fetching paginated mood logs:', error);
      return {
        success: false,
        error: error.message,
        moodLogs: []
      };
    }
  },

  async getMoodLogsByCategory(category) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/mood-data/logs/category/${category}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch mood logs by category: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        moodLogs: Array.isArray(data) ? data : []
      };
    } catch (error) {
      console.error('Error fetching mood logs by category:', error);
      return {
        success: false,
        error: error.message,
        moodLogs: []
      };
    }
  }
};
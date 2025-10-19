import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const token = await AsyncStorage.getItem('token');
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
      console.log('API Response received:', data);
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
  }
};
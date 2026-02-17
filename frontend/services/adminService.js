import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_NODE_API_URL;

export const adminService = {
  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats() {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard stats');
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all users with filtering and pagination
   */
  async getAllUsers(page = 1, limit = 10, role = null, searchTerm = null) {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      let url = `${API_BASE_URL}/api/admin/users?page=${page}&limit=${limit}`;

      if (role) {
        url += `&role=${role}`;
      }

      if (searchTerm) {
        url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId, page = 1, limit = 10) {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/api/admin/user-activity/${userId}?page=${page}&limit=${limit}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch activity logs');
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get active and inactive users
   */
  async getActiveInactiveUsers() {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/active-inactive-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch active/inactive users');
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching active/inactive users:', error);
      return { success: false, error: error.message };
    }
  },
  /**
   * Get available weeks for prediction comparison
   */
  async getAvailableWeeks() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/available-weeks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching available weeks:', error);
      return [];
    }
  },

  /**
   * Get daily mood comparison data
   */
  async getDailyMoodComparison(weekStartDate) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/daily-mood-comparison?weekStartDate=${weekStartDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching daily mood comparison:', error);
      return null;
    }
  },

  /**
   * Calculate weekly predictions for all users
   */
  async calculatePredictions() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/calculate-predictions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calculating predictions:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Update actual moods for a specific week
   */
  async updateActualMoods(weekStartDate) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/update-actual-moods`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ weekStartDate })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating actual moods:', error);
      return { success: false, message: error.message };
    }
  }};

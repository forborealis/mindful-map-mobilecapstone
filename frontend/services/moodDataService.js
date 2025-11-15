  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { authService } from './authService';
  const positiveMoods = ['happy', 'calm', 'excited', 'pleased', 'relaxed'];
  const negativeMoods = ['angry', 'bored', 'sad', 'disappointed', 'tense'];

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
    },

    
  async getAfterEmotionCounts(period = 'week') {
    try {
      const result = await this.getUserMoodLogs();
      if (!result.success) return {};

      const logs = result.moodLogs || [];
      const now = new Date();

      let startDate, endDate;
      if (period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (period === 'week') {
        // Monday as start of week
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // Filter logs by afterEmotion and date range
      const filtered = logs.filter(log => {
        const logDate = new Date(log.selectedDate || log.date || log.createdAt);
        return (
          log.afterEmotion &&
          logDate >= startDate &&
          logDate < endDate
        );
      });

      // Count moods
      const counts = {};
      filtered.forEach(log => {
        const mood = log.afterEmotion;
        counts[mood] = (counts[mood] || 0) + 1;
      });

      // Add summary logic
      const entries = Object.entries(counts);
      let topMood = '', leastMood = '', topType = '', leastType = '', uniqueCount = 0;
      if (entries.length > 0) {
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        topMood = sorted[0][0];
        leastMood = sorted[sorted.length - 1][0];
        topType = positiveMoods.includes(topMood) ? 'positive' : 'negative';
        leastType = positiveMoods.includes(leastMood) ? 'positive' : 'negative';
        uniqueCount = entries.length;
      }

      counts._summary = {
        topMood,
        topType,
        leastMood,
        leastType,
        uniqueCount,
      };

      return counts;
    } catch (error) {
      console.error('Error in getAfterEmotionCounts:', error);
      return {};
    }
  },

  async getBeforeEmotionCounts(period = 'week') {
    try {
      const result = await this.getUserMoodLogs();
      if (!result.success) return {};

      const logs = result.moodLogs || [];
      const now = new Date();

      let startDate, endDate;
      if (period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (period === 'week') {
        // Monday as start of week
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // Filter logs by beforeEmotion and date range
      const filtered = logs.filter(log => {
        const logDate = new Date(log.selectedDate || log.date || log.createdAt);
        return (
          log.beforeEmotion &&
          logDate >= startDate &&
          logDate < endDate
        );
      });

      // Count moods
      const counts = {};
      filtered.forEach(log => {
        const mood = log.beforeEmotion;
        counts[mood] = (counts[mood] || 0) + 1;
      });

      // Add summary logic
      const entries = Object.entries(counts);
      let topMood = '', leastMood = '', topType = '', leastType = '', uniqueCount = 0;
      if (entries.length > 0) {
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        topMood = sorted[0][0];
        leastMood = sorted[sorted.length - 1][0];
        topType = positiveMoods.includes(topMood) ? 'positive' : 'negative';
        leastType = positiveMoods.includes(leastMood) ? 'positive' : 'negative';
        uniqueCount = entries.length;
      }

      counts._summary = {
        topMood,
        topType,
        leastMood,
        leastType,
        uniqueCount,
      };

      return counts;
    } catch (error) {
      console.error('Error in getBeforeEmotionCounts:', error);
      return {};
    }
  },

  async getMoodCategoryGroupBreakdown(mood, type = 'after', period = 'daily') {
    try {
      const result = await this.getUserMoodLogs();
      if (!result.success) return {};

      const logs = result.moodLogs || [];
      const now = new Date();

      // Set date range for filtering
      let startDate, endDate;
      if (period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (period === 'week') {
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // Filter logs by mood, type, and date
      const filtered = logs.filter(log => {
        const emotion = type === 'after' ? log.afterEmotion : log.beforeEmotion;
        const logDate = new Date(log.date);
        return (
          emotion === mood &&
          logDate >= startDate &&
          logDate < endDate
        );
      });

      // Group by category and value
      const groups = {
        Activity: {},
        Social: {},
        Health: {},
        Sleep: {},
      };

      filtered.forEach(log => {
        if (log.category === 'activity' && log.activity) {
          groups.Activity[log.activity] = (groups.Activity[log.activity] || 0) + 1;
        }
        if (log.category === 'social' && log.activity) {
          groups.Social[log.activity] = (groups.Social[log.activity] || 0) + 1;
        }
        if (log.category === 'health' && log.activity) {
          groups.Health[log.activity] = (groups.Health[log.activity] || 0) + 1;
        }
        if (log.category === 'sleep' && typeof log.hrs === 'number' && type === 'after') {
          const sleepLabel = `${log.hrs} hours`;
          groups.Sleep[sleepLabel] = (groups.Sleep[sleepLabel] || 0) + 1;
        }
      });

      const formatBreakdown = (obj) => {
        const total = Object.values(obj).reduce((a, b) => a + b, 0);
        return Object.entries(obj).map(([name, count]) => ({
          name,
          count,
          percent: total ? Math.round((count / total) * 100) : 0,
        }));
      };

      return {
        Activity: formatBreakdown(groups.Activity),
        Social: formatBreakdown(groups.Social),
        Health: formatBreakdown(groups.Health),
        Sleep: formatBreakdown(groups.Sleep),
      };
    } catch (error) {
      console.error('Error in getMoodCategoryGroupBreakdown:', error);
      return { Activity: [], Social: [], Health: [], Sleep: [] };
    }
  },

  async getSleepHoursTrend(period = 'month') {
    try {
      const result = await this.getUserMoodLogs();
      if (!result.success) return [];

      const logs = result.moodLogs || [];
      const now = new Date();

      let startDate, endDate;
      if (period === 'week') {
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else {
        // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // Filter only sleep logs in range
      const filtered = logs.filter(log => 
        log.category === 'sleep' &&
        log.hrs !== undefined &&
        log.hrs !== null &&
        new Date(log.date) >= startDate &&
        new Date(log.date) < endDate
      );

      // Group by day
      const daysMap = {};
      filtered.forEach(log => {
        const d = new Date(log.date);
        const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        daysMap[key] = log.hrs;
      });

      // Build sorted array for chart
      const trend = [];
      let d = new Date(startDate);
      while (d < endDate) {
        const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        trend.push({
          date: new Date(d),
          hrs: daysMap[key] || 0
        });
        d.setDate(d.getDate() + 1);
      }

      return trend;
    } catch (error) {
      console.error('Error in getSleepHoursTrend:', error);
      return [];
    }
  },
async getDailyStatistics(date) {
  try {
    const userId = await this.getStoredUserId();
    if (!userId) {
      throw new Error('User not found. Please login again.');
    }

    const result = await this.getUserMoodLogs({ limit: 1000 });
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch mood logs');
    }

    const logs = result.moodLogs || [];
    const target = date.toISOString().split('T')[0];

    const dailyLogs = logs.filter(log => {
      const logDate = new Date(log.selectedDate || log.date || log.createdAt);
      return logDate.toISOString().split('T')[0] === target;
    });

    // Calculate statistics
    const totalEntries = dailyLogs.length;
    const valenceCounts = { positive: 0, negative: 0 };
    let intensitySum = 0;
    let emotionCounts = {};
    let afterEmotionCounts = {};
    let beforeEmotionCounts = {};
    let timeSegmentMoods = { earlyMorning: null, morning: null, afternoon: null, evening: null };
    let segmentEmotionMap = {
      earlyMorning: {},
      morning: {},
      afternoon: {},
      evening: {},
    };

    // For time segment dominant emotion intensity calculation
    let segmentEmotionIntensityMap = {
      earlyMorning: {},
      morning: {},
      afternoon: {},
      evening: {},
    };

    dailyLogs.forEach(log => {
      // Before
      if (log.beforeValence === 'positive') valenceCounts.positive++;
      if (log.beforeValence === 'negative') valenceCounts.negative++;
      if (typeof log.beforeIntensity === 'number') intensitySum += log.beforeIntensity;
      if (log.beforeEmotion) {
        beforeEmotionCounts[log.beforeEmotion] = (beforeEmotionCounts[log.beforeEmotion] || 0) + 1;
        emotionCounts[log.beforeEmotion] = (emotionCounts[log.beforeEmotion] || 0) + 1;
      }
      // Time segment for before
      if (log.selectedTime || log.date || log.createdAt) {
        const hour = new Date(log.selectedTime || log.date || log.createdAt).getHours();
        let segment = null;
        if (hour >= 0 && hour < 6) segment = 'earlyMorning';
        else if (hour >= 6 && hour < 12) segment = 'morning';
        else if (hour >= 12 && hour < 18) segment = 'afternoon';
        else segment = 'evening';

        if (log.beforeEmotion) {
          segmentEmotionMap[segment][log.beforeEmotion] = (segmentEmotionMap[segment][log.beforeEmotion] || 0) + 1;
          if (typeof log.beforeIntensity === 'number') {
            if (!segmentEmotionIntensityMap[segment][log.beforeEmotion]) {
              segmentEmotionIntensityMap[segment][log.beforeEmotion] = [];
            }
            segmentEmotionIntensityMap[segment][log.beforeEmotion].push(log.beforeIntensity);
          }
        }
      }

      // After
      if (log.afterValence === 'positive') valenceCounts.positive++;
      if (log.afterValence === 'negative') valenceCounts.negative++;
      if (typeof log.afterIntensity === 'number') intensitySum += log.afterIntensity;
      if (log.afterEmotion) {
        afterEmotionCounts[log.afterEmotion] = (afterEmotionCounts[log.afterEmotion] || 0) + 1;
        emotionCounts[log.afterEmotion] = (emotionCounts[log.afterEmotion] || 0) + 1;
      }
      // Time segment for after
      if (log.selectedTime || log.date || log.createdAt) {
        const hour = new Date(log.selectedTime || log.date || log.createdAt).getHours();
        let segment = null;
        if (hour >= 0 && hour < 6) segment = 'earlyMorning';
        else if (hour >= 6 && hour < 12) segment = 'morning';
        else if (hour >= 12 && hour < 18) segment = 'afternoon';
        else segment = 'evening';

        if (log.afterEmotion) {
          segmentEmotionMap[segment][log.afterEmotion] = (segmentEmotionMap[segment][log.afterEmotion] || 0) + 1;
          if (typeof log.afterIntensity === 'number') {
            if (!segmentEmotionIntensityMap[segment][log.afterEmotion]) {
              segmentEmotionIntensityMap[segment][log.afterEmotion] = [];
            }
            segmentEmotionIntensityMap[segment][log.afterEmotion].push(log.afterIntensity);
          }
        }
      }
    });

    // Calculate time segment moods (dominant emotion and its avg intensity)
    Object.keys(timeSegmentMoods).forEach(segment => {
      const emotionCounts = segmentEmotionMap[segment];
      const totalEntries = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
      if (totalEntries === 0) {
        timeSegmentMoods[segment] = null;
      } else {
        const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
        const [dominantEmotion, count] = sorted[0];
        const intensities = segmentEmotionIntensityMap[segment][dominantEmotion] || [];
        const avgIntensity = intensities.length > 0 ? intensities.reduce((a, b) => a + b, 0) / intensities.length : null;
        timeSegmentMoods[segment] = {
          emotion: dominantEmotion,
          count,
          totalEntries,
          averageIntensity: avgIntensity,
        };
      }
    });

    // Find most prominent valence
    let mostProminentValence = valenceCounts.positive >= valenceCounts.negative ? 'positive' : 'negative';

    // Find average intensity (all before+after)
    let intensityCount = 0;
    dailyLogs.forEach(log => {
      if (typeof log.beforeIntensity === 'number') intensityCount++;
      if (typeof log.afterIntensity === 'number') intensityCount++;
    });
    const averageIntensity = intensityCount > 0 ? intensitySum / intensityCount : 0;

    return {
      totalEntries,
      valenceCounts,
      averageIntensity,
      emotionCounts,
      afterEmotionCounts,
      beforeEmotionCounts,
      mostProminentValence,
      timeSegmentMoods,
    };
  } catch (error) {
    console.error('Error in getDailyStatistics:', error);
    throw error;
  }
},
    
async getWeeklyStatistics(date) {
  try {
    const userId = await this.getStoredUserId();
    if (!userId) {
      throw new Error('User not found. Please login again.');
    }

    const now = date ? new Date(date) : new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const result = await this.getUserMoodLogs({ limit: 1000 });
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch mood logs');
    }

    const logs = result.moodLogs || [];

    const weeklyLogs = logs.filter(log => {
      const logDate = new Date(log.selectedDate || log.date || log.createdAt);
      return logDate >= weekStart && logDate < weekEnd;
    });

    // Combine before and after into one array
    const allEmotions = [
      ...weeklyLogs.map(log => ({
        emotion: log.beforeEmotion,
        valence: log.beforeValence,
        intensity: log.beforeIntensity,
        time: new Date(log.selectedDate || log.date || log.createdAt)
      })),
      ...weeklyLogs.map(log => ({
        emotion: log.afterEmotion,
        valence: log.afterValence,
        intensity: log.afterIntensity,
        time: new Date(log.selectedDate || log.date || log.createdAt)
      }))
    ].filter(e => e.emotion); // Remove empty

    // Valence counts
    const valenceCounts = { positive: 0, negative: 0 };
    allEmotions.forEach(e => {
      if (e.valence === 'positive') valenceCounts.positive++;
      if (e.valence === 'negative') valenceCounts.negative++;
    });

    // Most prominent valence
    const mostProminentValence = valenceCounts.positive >= valenceCounts.negative ? 'positive' : 'negative';

    // Emotion counts
    const emotionCounts = {};
    allEmotions.forEach(e => {
      if (!e.emotion) return;
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });

    // Average intensity
    const averageIntensity = allEmotions.length > 0
      ? Math.round((allEmotions.reduce((sum, e) => sum + (e.intensity || 0), 0) / allEmotions.length) * 10) / 10
      : 0;

    // Time segments
    const timeSegments = {
      earlyMorning: [],
      morning: [],
      afternoon: [],
      evening: []
    };
    allEmotions.forEach(e => {
      const hour = e.time.getHours();
      if (hour >= 0 && hour < 6) timeSegments.earlyMorning.push(e);
      else if (hour >= 6 && hour < 12) timeSegments.morning.push(e);
      else if (hour >= 12 && hour < 18) timeSegments.afternoon.push(e);
      else timeSegments.evening.push(e);
    });

    const timeSegmentMoods = {};
    Object.keys(timeSegments).forEach(segment => {
      const emotions = timeSegments[segment];
      if (emotions.length === 0) {
        timeSegmentMoods[segment] = null;
      } else {
        // Count emotions in this segment
        const segmentEmotionCounts = {};
        emotions.forEach(e => {
          if (!e.emotion) return;
          segmentEmotionCounts[e.emotion] = (segmentEmotionCounts[e.emotion] || 0) + 1;
        });
        // Most frequent emotion
        const mostFrequentEmotion = Object.keys(segmentEmotionCounts).reduce((a, b) =>
          segmentEmotionCounts[a] > segmentEmotionCounts[b] ? a : b
        );
        // Average intensity for this emotion in this segment
        const emotionInstances = emotions.filter(e => e.emotion === mostFrequentEmotion);
        const avgIntensity = emotionInstances.length > 0
          ? Math.round((emotionInstances.reduce((sum, e) => sum + (e.intensity || 0), 0) / emotionInstances.length) * 10) / 10
          : 0;
        timeSegmentMoods[segment] = {
          emotion: mostFrequentEmotion,
          count: segmentEmotionCounts[mostFrequentEmotion],
          averageIntensity: avgIntensity,
          totalEntries: emotions.length
        };
      }
    });

    // Daily breakdown (Monday to Sunday)
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let dailyBreakdown = {};
    daysOfWeek.forEach(day => {
      dailyBreakdown[day] = { count: 0, emotions: {}, dominantEmotion: null };
    });
    allEmotions.forEach(e => {
      const dayOfWeek = e.time.toLocaleDateString('en-US', { weekday: 'long' });
      if (dailyBreakdown[dayOfWeek]) {
        dailyBreakdown[dayOfWeek].count++;
        dailyBreakdown[dayOfWeek].emotions[e.emotion] = (dailyBreakdown[dayOfWeek].emotions[e.emotion] || 0) + 1;
      }
    });
    Object.keys(dailyBreakdown).forEach(day => {
      const dayData = dailyBreakdown[day];
      if (dayData.count > 0 && Object.keys(dayData.emotions).length > 0) {
        dayData.dominantEmotion = Object.keys(dayData.emotions).reduce((a, b) =>
          dayData.emotions[a] > dayData.emotions[b] ? a : b
        );
      }
      delete dayData.emotions;
    });

    return {
      totalEntries: weeklyLogs.length,
      valenceCounts,
      averageIntensity,
      emotionCounts,
      mostProminentValence,
      timeSegmentMoods,
      weekStart,
      weekEnd,
      dailyBreakdown,
    };
  } catch (error) {
    console.error('Error in getWeeklyStatistics:', error);
    throw error;
  }
},

async getDailyAnova(date) {
  try {
    const headers = await this.getAuthHeaders();
    const url = `${API_BASE_URL}/api/statistics/daily-anova?date=${date}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch daily anova: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching daily anova:', error);
    throw error;
  }
},
async getWeeklyAnova(start, end) {
  try {
    const headers = await this.getAuthHeaders();
    const url = `${API_BASE_URL}/api/statistics/weekly-anova?start=${start}&end=${end}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch weekly anova: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching weekly anova:', error);
    throw error;
  }
},
    };  
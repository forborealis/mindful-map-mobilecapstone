import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

export const teacherService = {
  /**
   * Get teacher profile
   */
  async getTeacherProfile() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/teacher/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch teacher profile');
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/teachers/dashboard-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
   * Get students by teacher's assigned sections
   */
  async getStudents() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/teachers/students`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      return { success: true, data: data.data, sections: data.sections };
    } catch (error) {
      console.error('Error fetching students:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get mood logs for students in teacher's sections
   */
  async getStudentMoodLogs() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/teachers/student-mood-logs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch mood logs');
      }

      return { success: true, data: data.data, totalLogs: data.totalLogs };
    } catch (error) {
      console.error('Error fetching student mood logs:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get mood logs for a specific section
   */
  async getMoodLogsBySection(section) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/teachers/mood-logs/${section}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch mood logs for section');
      }

      return { success: true, data: data.data, totalLogs: data.totalLogs };
    } catch (error) {
      console.error('Error fetching mood logs by section:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get students in a specific section
   */
  async getSectionStudents(section) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/teachers/section-students/${section}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch section students');
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching section students:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get mood logs for a specific student
   */
  async getStudentMoodLogsById(studentId) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/teachers/student-mood-logs/${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch student mood logs');
      }

      return { success: true, data: data.data, student: data.student, totalLogs: data.totalLogs };
    } catch (error) {
      console.error('Error fetching student mood logs by ID:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update teacher profile
   */
  async updateTeacherProfile(profileData) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/teachers/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error updating teacher profile:', error);
      return { success: false, error: error.message };
    }
  }
};

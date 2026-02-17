import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_NODE_API_URL;

export const journalService = {
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

  async getJournalEntries() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/journal/all`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch journal entries: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        entries: data.entries || []
      };
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return {
        success: false,
        error: error.message,
        entries: []
      };
    }
  },

  async getJournalEntryById(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/journal/entry/${id}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch journal entry: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        entry: data.entry
      };
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async createJournalEntry(content, date = null, challenges = []) {
    try {
      const headers = await this.getAuthHeaders();
      const body = JSON.stringify({ content, date, challenges });
      const response = await fetch(`${API_BASE_URL}/api/journal/create`, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create journal entry: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        entry: data.entry
      };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async updateJournalEntry(id, content, challenges = []) {
    try {
      const headers = await this.getAuthHeaders();
      const body = JSON.stringify({ content, challenges });
      const response = await fetch(`${API_BASE_URL}/api/journal/journal/${id}`, {
        method: 'PUT',
        headers,
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update journal entry: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        entry: data.entry
      };
    } catch (error) {
      console.error('Error updating journal entry:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async deleteJournalEntry(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/journal/journal/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete journal entry: ${response.status}`);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function generateRecommendations(payload) {
  const token = await AsyncStorage.getItem('token');

  const body =
    typeof payload === 'string'
      ? { moodScoreId: payload }
      : payload && typeof payload === 'object'
      ? payload
      : {};

  const resp = await fetch(`${API_BASE_URL}/api/recommendations/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await resp.json();
  } catch {
    data = null;
  }
  if (!resp.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${resp.status}`;
    throw new Error(message);
  }

  return data; 
}

export async function getCurrentWeekRecommendations() {
  const token = await AsyncStorage.getItem('token');
  const resp = await fetch(`${API_BASE_URL}/api/recommendations/week`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || 'Failed to fetch current week recommendations');
  return data;
}

/**
 * Submit effectiveness feedback for a recommendation
 * @param {string} recommendationId - The recommendation ID
 * @param {number} rating - Rating from 1-5
 * @param {string} comment - Optional comment (sentiment analyzed if >= 10 chars)
 */
export async function submitRecommendationFeedback(recommendationId, rating, comment = '') {
  const token = await AsyncStorage.getItem('token');
  
  const resp = await fetch(`${API_BASE_URL}/api/recommendations/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      recommendationId,
      rating,
      comment,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    const message = data?.error || data?.message || `Failed to submit feedback (HTTP ${resp.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * Get user's existing feedback for a specific recommendation
 * @param {string} recommendationId - The recommendation ID
 */
export async function getUserFeedbackForRecommendation(recommendationId) {
  const token = await AsyncStorage.getItem('token');
  
  const resp = await fetch(`${API_BASE_URL}/api/recommendations/feedback/${recommendationId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await resp.json();
  if (!resp.ok) {
    const message = data?.error || data?.message || `Failed to fetch feedback (HTTP ${resp.status})`;
    throw new Error(message);
  }

  return data;
}
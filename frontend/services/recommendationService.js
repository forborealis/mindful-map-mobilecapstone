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
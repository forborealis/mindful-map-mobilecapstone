import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_PYTHON_API_URL;

export async function runConcordance(date) {
  const token = await AsyncStorage.getItem('token');
  const resp = await fetch(`${API_BASE_URL}/api/concordance/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date }), // YYYY-MM-DD
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || 'Failed to run concordance');
  return data; // { success, concordanceResults, sleep, thresholds, ... }
}

export async function getConcordanceHistory(startDate, endDate) {
  const token = await AsyncStorage.getItem('token');
  const params = new URLSearchParams({ startDate, endDate }).toString();
  const resp = await fetch(`${API_BASE_URL}/api/concordance/history?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || 'Failed to fetch concordance history');
  return data; // { success, concordanceByDate, moodScoresByDate }
}
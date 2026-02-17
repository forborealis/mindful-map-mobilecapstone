import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_NODE_API_URL;

export async function runAnova(date) {
  const token = await AsyncStorage.getItem('token');
  const resp = await fetch(`${API_BASE_URL}/api/anova/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ date }) // YYYY-MM-DD
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || 'Failed to run ANOVA');
  return data; // { success, anovaResults, sleep, ... }
}

export async function getAnovaHistory(startDate, endDate) {
  const token = await AsyncStorage.getItem('token');
  const params = new URLSearchParams({ startDate, endDate }).toString();
  const resp = await fetch(`${API_BASE_URL}/api/anova/history?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || 'Failed to fetch ANOVA history');
  return data; // { success, anovaByDate, moodScoresByDate }
}
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getSession() {
  const userString = await AsyncStorage.getItem('user');
  const token = await AsyncStorage.getItem('token');
  if (!userString || !token) return null;
  return { user: JSON.parse(userString), token };
}
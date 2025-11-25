import { getSession } from './sessionService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

export async function registerPushToken(expoPushToken) {
  try {
    const session = await getSession();
    console.log('[pushService] calling backend, has auth?', !!session?.token);
    const resp = await fetch(`${API_BASE_URL}/api/notifications/register-push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify({ token: expoPushToken })
    });
    const text = await resp.text();
    console.log('[pushService] response', resp.status, text);
  } catch (e) {
    console.log('[pushService] error:', e.message);
  }
}
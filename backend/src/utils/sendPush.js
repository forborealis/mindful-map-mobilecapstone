const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPush(to, title, body, data = {}) {
  try {
    console.log('[sendPush] sending to', to, title);
    const resp = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, title, body, data, priority: 'high', sound: 'default' })
    });
    const text = await resp.text();
    console.log('[sendPush] response', resp.status, text);
  } catch (e) {
    console.error('[sendPush] error', e.message);
  }
}

module.exports = { sendPush };
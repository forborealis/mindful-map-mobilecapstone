import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { getSession } from './services/sessionService';
import { registerPushToken } from './services/pushService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function registerPushTokenIfLoggedIn() {
  try {
    const session = await getSession();
    console.log('[PushReg] user:', session?.user?.email, 'has token?', !!session?.token);
    if (!session?.token) return;

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    console.log('[PushReg] permission status:', status);
    if (status !== 'granted') return;

    const { data: expoToken } = await Notifications.getExpoPushTokenAsync();
    console.log('[PushReg] expoToken:', expoToken);
    if (expoToken) await registerPushToken(expoToken);
  } catch (e) {
    console.log('[PushReg] error:', e.message);
  }
}

export function subscribeNotificationResponses(navigation) {
  return Notifications.addNotificationResponseReceivedListener(resp => {
    const screen = resp?.notification?.request?.content?.data?.screen;
    if (screen && navigation) {
      console.log('[NotificationTap] navigating to', screen);
      navigation.navigate(screen); 
    }
  });
}
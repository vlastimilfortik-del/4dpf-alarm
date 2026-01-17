import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private hasPermission: boolean = false;
  private persistentNotificationId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.hasPermission = finalStatus === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  async showDPFAlert(title: string, body: string): Promise<void> {
    if (Platform.OS === 'web' || !this.hasPermission) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'dpf_alert.mp3',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 200, 500],
          sticky: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Show notification error:', error);
    }
  }

  async showPersistentNotification(title: string, body: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    await this.requestPermissions();

    try {
      if (this.persistentNotificationId) {
        await this.dismissPersistentNotification();
      }

      this.persistentNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          priority: Notifications.AndroidNotificationPriority.LOW,
          sticky: true,
          autoDismiss: false,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Persistent notification error:', error);
    }
  }

  async updatePersistentNotification(title: string, body: string): Promise<void> {
    if (this.persistentNotificationId) {
      await this.dismissPersistentNotification();
    }
    await this.showPersistentNotification(title, body);
  }

  async dismissPersistentNotification(): Promise<void> {
    if (this.persistentNotificationId) {
      try {
        await Notifications.dismissNotificationAsync(this.persistentNotificationId);
        this.persistentNotificationId = null;
      } catch (error) {
        console.error('Dismiss notification error:', error);
      }
    }
  }

  async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      this.persistentNotificationId = null;
    } catch (error) {
      console.error('Dismiss all notifications error:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

import * as Notifications from 'expo-notifications';

const ID = 'taro-daily-card';
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** A single local reminder at 09:00. No push service, registration, or network. */
export async function updateDailyReminder(enabled: boolean, requestPermission = false): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(ID);
  if (!enabled) return false;
  await Notifications.setNotificationChannelAsync(ID, { name: 'Карта дня', importance: Notifications.AndroidImportance.DEFAULT });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestPermission) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: 'Ваша карта дня', body: 'Откройте Таро и узнайте символический совет на сегодня.', data: { screen: '/' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0, channelId: ID },
  });
  return true;
}

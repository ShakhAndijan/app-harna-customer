import { useEffect, useRef } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { markNotificationRead } from '../api/notifications';
import { pushData, registerPush } from '../utils/push';

// Kirgan foydalanuvchi uchun push: tokenni backendga yuboradi, bildirishnomaga bosilganda kerakli
// ekranni ochadi. Yuborishni backend FCM orqali qiladi (ilova yopiq bo'lsa ham keladi); bu yerda
// faqat token va bosilishni qayta ishlash.
export default function usePushNotifications() {
  const { signedIn, locked } = useAuth();
  const { language, t: tr } = useLanguage();
  const router = useRouter();
  const navState = useRootNavigationState();
  const queryClient = useQueryClient();
  const handled = useRef(null);

  // Token: kirganda, til o'zgarganda (xabar matni shu tilda keladi) va FCM tokenni almashtirganda.
  useEffect(() => {
    if (!signedIn) return undefined;
    registerPush({ locale: language, ask: true, tr });
    const sub = Notifications.addPushTokenListener(() => registerPush({ locale: language }));
    return () => sub.remove();
  }, [signedIn, language, tr]);

  // Ilova ochiq paytda xabar kelsa ro'yxat va qo'ng'iroqcha soni yangilanadi.
  useEffect(() => {
    if (!signedIn) return undefined;
    const sub = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => sub.remove();
  }, [signedIn, queryClient]);

  // Bosilganda ochish. Hook ilova to'liq yopiq paytda bosilgan xabarni ham qaytaradi, shuning uchun
  // sessiya va navigatsiya tayyor bo'lgandan keyingina ishlaymiz.
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || !signedIn || locked || !navState?.key) return undefined;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return undefined;
    const id = response.notification.request.identifier;
    if (handled.current === id) return undefined;
    handled.current = id;

    const data = pushData(response);
    if (data.notification_id != null) {
      markNotificationRead(data.notification_id)
        .then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }))
        .catch(() => {});
    }
    // AuthRedirect bosh sahifaga o'tkazib bo'lgach, uning ustiga ochiladi: bildirishnomalar ekrani
    // shu xabarning matni bilan (tegishli ekranga o'tish — oynadagi tugma orqali).
    setTimeout(() => {
      router.push({
        pathname: '/notifications',
        params: { pushType: String(data.type ?? ''), pushPayload: JSON.stringify(data) },
      });
    }, 0);
    return undefined;
  }, [response, signedIn, locked, navState?.key, router, queryClient]);
}

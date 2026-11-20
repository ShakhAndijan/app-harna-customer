import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { registerPushDevice, unregisterPushDevice } from '../api/push';
import { devLog } from './log';
import { PUSH_ENABLED } from '../constants/config';
import { explainPermission } from './permissions';

// Android 8+ da bildirishnoma kanalsiz chiqmaydi; kanal id si FCM `android.notification.channel_id`
// bilan bir xil bo'lishi kerak (app.json dagi `defaultChannel` ham shu).
export const PUSH_CHANNEL_ID = 'default';

const REGISTERED_KEY = 'push_registered'; // { token, locale } — backendga oxirgi yuborilgani
const PROMPTED_KEY = 'push_prompted'; // ruxsat so'rovi bir marta o'zi chiqadi, keyin faqat sozlamadan

// expo-notifications faqat kerak bo'lganda yuklanadi: PUSH_ENABLED o'chiq bo'lsa (yoki native moduli yo'q
// Expo Go da) import xato bermasligi uchun. Ilova ochiq turganda ham xabar tepada ko'rinadi.
let notifications = null;
function getNotifications() {
  if (!notifications) {
    notifications = require('expo-notifications');
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return notifications;
}

async function ensureChannel() {
  if (!PUSH_ENABLED || Platform.OS !== 'android') return;
  const Notifications = getNotifications();
  await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
    name: 'harna.uz',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#f97316',
  });
}

/** `status`: 'granted' | 'denied' | 'undetermined'; `canAskAgain`: tizim oynasini yana ko'rsatsa bo'ladimi. */
export async function getPushPermission() {
  if (!PUSH_ENABLED) return { status: 'granted', canAskAgain: false }; // banner chiqmaydi
  const Notifications = getNotifications();
  const p = await Notifications.getPermissionsAsync();
  return { status: p.status, canAskAgain: p.canAskAgain };
}

/**
 * Ruxsat so'raydi. Android 13+ da so'rov oynasi kanal yaratilgach chiqadi, shuning uchun kanal avval.
 * Foydalanuvchi ikki marta rad etgan bo'lsa tizim oynani ko'rsatmaydi, shu sabab sozlamalar ochiladi.
 */
// Tizim so'rovidan oldin ilova nima uchun kerakligini aytadi (`tr` berilsa). `postponed` — foydalanuvchi
// "Keyinroq" dedi: tizim so'rovi chiqmadi. Bir vaqtda ikki so'rov bo'lsa ikkinchisi birinchisining javobini oladi.
let asking = null;

async function askPush(tr, again) {
  if (!PUSH_ENABLED) return { granted: false, postponed: false };
  if (asking) return asking;
  asking = (async () => {
    try {
      const Notifications = getNotifications();
      await ensureChannel();
      const current = await getPushPermission();
      if (current.status === 'granted') return { granted: true, postponed: false };
      if (current.status === 'denied' && !current.canAskAgain) {
        Linking.openSettings().catch(() => {});
        return { granted: false, postponed: false };
      }
      if (
        tr &&
        !(await explainPermission(
          tr,
          'notifications',
          tr('permissions.notificationsTitle'),
          tr('permissions.notifications'),
          again
        ))
      ) {
        return { granted: false, postponed: true };
      }
      const res = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      return { granted: res.status === 'granted', postponed: false };
    } finally {
      asking = null;
    }
  })();
  return asking;
}

/** Tugma bosilganda: sabab aytiladi, so'ng tizim so'raydi. `true` — ruxsat bor. */
export async function requestPushPermission(tr) {
  return (await askPush(tr, true)).granted;
}

// Huawei (Google xizmatlarisiz) telefonlar: FCM tokeni olinmasa HMS Push Kit tokeni ishlatiladi.
// `@hmscore/react-native-hms-push` o'rnatilmagan (yoki Expo Go) bo'lsa — null, ilova ishlashda davom etadi.
const HMS_TOKEN_TIMEOUT_MS = 8000;
let hmsModule;
function getHms() {
  if (hmsModule === undefined) {
    try {
      hmsModule = require('@hmscore/react-native-hms-push');
    } catch {
      hmsModule = null;
    }
  }
  return hmsModule;
}

async function getHuaweiToken() {
  const hms = getHms();
  if (!hms?.HmsPushInstanceId || !hms?.HmsPushEvent) return null;
  const { HmsPushInstanceId, HmsPushEvent } = hms;
  const pick = (r) => (typeof r === 'string' ? r : (r?.token ?? r?.result ?? null));
  // Token ba'zan getToken natijasida, ba'zan keyin "tokenReceived" hodisasi bilan keladi.
  return new Promise((resolve) => {
    let sub = null;
    const finish = (value) => {
      clearTimeout(timer);
      sub?.remove?.();
      resolve(typeof value === 'string' && value ? value : null);
    };
    const timer = setTimeout(() => finish(null), HMS_TOKEN_TIMEOUT_MS);
    sub = HmsPushEvent.onTokenReceived((r) => finish(pick(r)));
    HmsPushInstanceId.getToken('')
      .then((r) => {
        const token = pick(r);
        if (token) finish(token);
      })
      .catch(() => finish(null));
  });
}

async function readRegistered() {
  try {
    return JSON.parse((await AsyncStorage.getItem(REGISTERED_KEY)) ?? 'null');
  } catch {
    return null;
  }
}

/**
 * Qurilma tokenini olib backendga yuboradi. Token va til o'zgarmagan bo'lsa qayta yubormaydi.
 * `ask` — ruxsat hali so'ralmagan bo'lsa, bir marta tizim oynasini ko'rsatadi.
 * Hech qachon xato tashlamaydi: push ishlamasa ham ilova ishlashda davom etadi.
 */
export async function registerPush({ locale, ask = false, tr }) {
  if (!PUSH_ENABLED) return false;
  try {
    const Notifications = getNotifications();
    await ensureChannel();
    let { status } = await getPushPermission();
    if (status !== 'granted' && ask && !(await AsyncStorage.getItem(PROMPTED_KEY))) {
      const asked = await askPush(tr, false);
      // "Keyinroq" bosilgan bo'lsa belgi qo'yilmaydi: keyingi ishga tushishda sabab yana aytiladi.
      if (!asked.postponed) await AsyncStorage.setItem(PROMPTED_KEY, '1');
      if (asked.granted) status = 'granted';
    }
    if (status !== 'granted') return false;

    // Android'da bu FCM tokeni (iOS'da APNs). Expo Go'da ishlamaydi: development/production build kerak.
    // Google xizmatlari yo'q Huawei telefonda FCM tokeni olinmaydi — u holda HMS tokeni ("huawei") sinab ko'riladi.
    let token = null;
    let platform = Platform.OS;
    try {
      token = (await Notifications.getDevicePushTokenAsync()).data;
    } catch (err) {
      if (Platform.OS !== 'android') throw err;
      devLog("[push] FCM tokeni yo'q, HMS sinab ko'riladi:", err?.message);
    }
    if (!token && Platform.OS === 'android') {
      token = await getHuaweiToken();
      if (token) platform = 'huawei';
    }
    if (!token) return false;

    const saved = await readRegistered();
    if (saved?.token === token && saved?.locale === locale) return true;

    await registerPushDevice({
      token,
      platform,
      locale,
      appVersion: Constants.expoConfig?.version ?? null,
    });
    await AsyncStorage.setItem(REGISTERED_KEY, JSON.stringify({ token, locale }));
    devLog('[push] token backendga yuborildi');
    return true;
  } catch (err) {
    devLog("[push] ro'yxatdan o'tmadi:", err?.message);
    return false;
  }
}

/** Chiqishda tokenni backenddan o'chiradi; so'rov kirgan foydalanuvchi huquqi bilan ketadi, shuning uchun sessiya tugashidan oldin chaqiriladi. */
export async function unregisterPush() {
  const saved = await readRegistered();
  if (!saved?.token) return;
  try {
    await unregisterPushDevice(saved.token);
  } catch (err) {
    devLog("[push] token o'chirilmadi:", err?.message);
  }
  await AsyncStorage.removeItem(REGISTERED_KEY).catch(() => {});
}

/** Hisob o'chirilganda backendga murojaat qilinmaydi (token endi yaroqsiz), faqat mahalliy belgi tozalanadi. */
export async function forgetPush() {
  await AsyncStorage.removeItem(REGISTERED_KEY).catch(() => {});
}

// Push `data` qismini bildirishnoma ro'yxatidagi `payload` ko'rinishiga keltiradi. FCM data qiymatlari
// doim matn bo'lgani uchun `*_id` maydonlari songa o'giriladi.
export function pushData(response) {
  const request = response?.notification?.request;
  // Ilova yopiq paytda tizim ko'rsatgan xabarning data'si trigger ichida keladi.
  const raw = {
    ...(request?.trigger?.remoteMessage?.data ?? {}),
    ...(request?.content?.data ?? {}),
  };
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = /_id$/.test(k) && /^\d+$/.test(String(v)) ? Number(v) : v;
  }
  return out;
}

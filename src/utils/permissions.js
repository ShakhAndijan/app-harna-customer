import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { appAlert } from '../components/AppAlert';

// Telefon ruxsatlari: tizim so'rovidan OLDIN ilova nima uchun kerakligini aytadi (Google Play va
// shaxsiy ma'lumotlar bo'yicha va'da talab qiladi). Tushuntirish faqat tizim haqiqatan so'ramoqchi
// bo'lganda chiqadi: ruxsat berilgan yoki butunlay rad etilgan bo'lsa — chiqmaydi.
// "Keyinroq" shu ishga tushish davomida o'sha savolni qayta bermaydi (tugma bosilsa — `again` — qayta so'raladi).
//
// Javob: `true` — ruxsat bor; `false` — tizim bermadi (yoki so'ralmaydi); `null` — foydalanuvchi "Keyinroq"
// dedi (xato deb ko'rsatilmaydi, chaqiruvchi jim qaytadi).
const postponed = new Set();

/** Sababni aytadi; foydalanuvchi "Davom etish"ni bossa true. */
export function explainPermission(tr, key, title, body, again = false) {
  if (postponed.has(key) && !again) return Promise.resolve(false);
  return new Promise((resolve) => {
    appAlert(title, body, [
      {
        text: tr('permissions.later'),
        style: 'cancel',
        onPress: () => {
          postponed.add(key);
          resolve(false);
        },
      },
      { text: tr('permissions.continue'), onPress: () => resolve(true) },
    ]);
  });
}

/** Ilova ochiq paytdagi joylashuv. `reason`: 'nearby' | 'pin' | 'address'. */
export async function askLocation(tr, reason, { again = false } = {}) {
  const now = await Location.getForegroundPermissionsAsync();
  if (now.granted) return true;
  if (!now.canAskAgain) return false;
  const body = {
    nearby: tr('permissions.locationNearby'),
    pin: tr('permissions.locationPin'),
    address: tr('permissions.locationAddress'),
  }[reason];
  if (
    !(await explainPermission(
      tr,
      `location-${reason}`,
      tr('permissions.locationTitle'),
      body,
      again
    ))
  ) {
    return null;
  }
  return (await Location.requestForegroundPermissionsAsync()).granted;
}

/** Kamera. `reason`: 'avatar' | 'certificate'. */
export async function askCamera(tr, reason, { again = false } = {}) {
  const now = await ImagePicker.getCameraPermissionsAsync();
  if (now.granted) return true;
  if (!now.canAskAgain) return false;
  const body = {
    avatar: tr('permissions.cameraAvatar'),
    certificate: tr('permissions.cameraCertificate'),
  }[reason];
  if (
    !(await explainPermission(tr, `camera-${reason}`, tr('permissions.cameraTitle'), body, again))
  ) {
    return null;
  }
  return (await ImagePicker.requestCameraPermissionsAsync()).granted;
}

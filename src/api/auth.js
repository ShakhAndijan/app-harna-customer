import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import { ENDPOINTS } from '../constants/config';
import { devLog } from '../utils/log';
import { getToken, getRefreshToken } from '../utils/token';
import { request } from '../utils/request';

const logReq = (name) => devLog(`[auth] → ${name}`);
// Javob konsolga chiqadi (faqat dev); tokenlar to'liq ko'rsatilmaydi.
const SECRET_KEYS = ['access_token', 'refresh_token'];
const redact = (data) =>
  data && typeof data === 'object'
    ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, SECRET_KEYS.includes(k) && v ? '***' : v])
      )
    : data;
const logOk = (name, data) => devLog(`[auth] ✓ ${name}`, JSON.stringify(redact(data), null, 2));
const logErr = (name, err) => devLog(`[auth] ✗ ${name}`, err?.message || err);

// Kirish oqimidagi so'rovlar: token yo'q (auth: false), xato ApiError bo'lib chiqadi.
async function authPost(name, url, body, fallbackMessage) {
  logReq(name);
  try {
    const data = await request(url, { method: 'POST', body, auth: false, fallbackMessage });
    logOk(name, data);
    return data;
  } catch (err) {
    logErr(name, err);
    throw err;
  }
}

export async function uploadImageToPresignedUrl(uploadUrl, imageUri, contentType) {
  const ct = contentType || 'image/jpeg';

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // base64 → binary bytes (React Native da data: URI yo'q, XHR kerak)
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', ct);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Rasmni yuklashda xatolik: HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Rasmni yuklashda tarmoq xatosi'));
    xhr.send(bytes.buffer);
  });
}

export async function loginCustomer(phone, password, consentVersion) {
  return authPost(
    'loginCustomer',
    ENDPOINTS.CUSTOMER_LOGIN,
    { phone, password, consent_version: consentVersion },
    'Kirishda xatolik yuz berdi'
  );
}

/**
 * Telefon/emailga tasdiqlash kodini yuboradi. Hisob mavjudligidan qat'i nazar
 * javob har doim bir xil (200) — bu raqamni "bazada bormi yo'qmi" deb sinab
 * ko'rishning oldini oladi.
 * @returns {Promise<{ sent: boolean, dev_code?: string }>}
 */
export async function startCustomerAuth(identifier, channel = 'sms') {
  return authPost(
    'startCustomerAuth',
    ENDPOINTS.AUTH_CUSTOMER_START,
    { identifier, channel },
    'Kod yuborishda xatolik yuz berdi'
  );
}

/**
 * Kodni tasdiqlaydi. Ikki xil natija bo'lishi mumkin (AuthVerifyOut):
 * - hisob mavjud: access_token/refresh_token qaytadi, shu bilan kirish tugaydi;
 * - hisob topilmadi (`status: 'needs_name'`), `ticket` qaytadi (tasdiqlangan
 *   kodning isboti). Agar shu bilan birga `suggested_first_name`/
 *   `suggested_last_name` ham qaytgan bo'lsa (masalan avval usta sifatida
 *   ro'yxatdan o'tgan bo'lsa, ismi ma'lum), foydalanuvchidan qayta
 *   so'ramasdan shu qiymatlar bilan completeCustomerAuth avtomatik
 *   chaqiriladi; aks holda ism-familiya so'raladi va shu bilan
 *   completeCustomerAuth chaqiriladi.
 * @returns {Promise<{ access_token: string|null, refresh_token: string|null, status?: string, ticket?: string, suggested_first_name?: string, suggested_last_name?: string }>}
 */
export async function verifyCustomerAuth(identifier, code, consentVersion) {
  return authPost(
    'verifyCustomerAuth',
    ENDPOINTS.AUTH_CUSTOMER_VERIFY,
    { identifier, code, consent_version: consentVersion },
    'Kodni tasdiqlashda xatolik yuz berdi'
  );
}

/**
 * Yangi mijoz hisobini yaratadi va kirishni yakunlaydi. Faqat verify hisobni
 * topa olmagan holatda chaqiriladi — `ticket` allaqachon tasdiqlangan kodning
 * isboti bo'lgani uchun kod qayta so'ralmaydi, faqat ism-familiya kerak.
 * `consentVersion` — foydalanuvchi belgilagan shaxsiy ma'lumotlarga rozilik matni versiyasi; yangi hisob
 * uchun majburiy (400 `consent_required` / `consent_outdated`).
 * @returns {Promise<{ access_token: string, refresh_token: string }>}
 */
export async function completeCustomerAuth(ticket, firstName, lastName, consentVersion) {
  return authPost(
    'completeCustomerAuth',
    ENDPOINTS.AUTH_CUSTOMER_COMPLETE,
    { ticket, first_name: firstName, last_name: lastName, consent_version: consentVersion },
    'Hisob yaratishda xatolik yuz berdi'
  );
}

export async function requestResetPasswordOtp(phone) {
  return authPost(
    'requestResetPasswordOtp',
    ENDPOINTS.RESET_PASSWORD_REQUEST_OTP,
    { phone, actor_type: 'customer' },
    'Kod yuborishda xatolik yuz berdi'
  );
}

export async function verifyResetPasswordOtp(phone, code, newPassword) {
  return authPost(
    'verifyResetPasswordOtp',
    ENDPOINTS.RESET_PASSWORD_VERIFY_OTP,
    { phone, actor_type: 'customer', code, new_password: newPassword },
    'Parolni saqlashda xatolik yuz berdi'
  );
}

// Brauzerdan ilovaga qaytish manzilini faqat server belgilaydi (platformaning mijoz sxemasi `harna`):
// `redirect_uri` kabi parametrlar e'tiborsiz qoldiriladi. Shuning uchun u tayyor satr, `Linking.createURL`
// bilan yasalmaydi (u ro'yxatdagi birinchi sxemani, ya'ni mobile-app-afish:// ni beradi).
export const GOOGLE_RETURN_URL = 'harna://auth/google';

// Google kirishi tugagach server `harna://auth/google?status=...` ga qaytaradi. `status=denied|error`
// bo'lganda `reason` xato kodiga o'giriladi (`GoogleLoginError.code`), ekran shunga mos matn ko'rsatadi:
//   cancelled | consent_required | consent_outdated | email_not_registered | google_email_not_verified |
//   user_inactive | account_deleted | google_unavailable | failed
export class GoogleLoginError extends Error {
  constructor(code, reason) {
    super(code);
    this.code = code;
    this.reason = reason ?? null;
  }
}

const GOOGLE_REASON_CODES = new Set([
  'consent_required',
  'consent_outdated',
  'email_not_registered',
  'google_email_not_verified',
  'user_inactive',
  'account_deleted',
]);

function googleReasonCode(reason) {
  if (!reason) return 'failed';
  if (GOOGLE_REASON_CODES.has(reason)) return reason;
  // Foydalanuvchi Google oynasida "Rad etish" ni bosgan.
  if (reason === 'access_denied') return 'cancelled';
  // Serverning Google bilan almashuvi xatosi (masalan invalid_client — server sozlamasi).
  if (reason.startsWith('google_token_exchange_failed')) return 'google_unavailable';
  return 'failed';
}

/**
 * Google orqali kirish. Shaxsiy ma'lumotlarga rozilik belgisi boshlash manzilida yuboriladi
 * (`consent_version`): belgisiz server Google sahifasini ochmasdan `consent_required` bilan qaytaradi.
 */
export async function googleLogin(actorType = 'customer', consentVersion) {
  const params = [`actor_type=${actorType}`];
  if (consentVersion) params.push(`consent_version=${encodeURIComponent(consentVersion)}`);
  if (Platform.OS === 'android' || Platform.OS === 'ios') params.push(`client=${Platform.OS}`);
  const loginUrl = `${ENDPOINTS.AUTH_GOOGLE_LOGIN}?${params.join('&')}`;

  logReq('googleLogin');
  const result = await WebBrowser.openAuthSessionAsync(loginUrl, GOOGLE_RETURN_URL);

  if (result.type !== 'success') {
    logErr('googleLogin', 'cancelled');
    throw new GoogleLoginError('cancelled');
  }

  const query = Linking.parse(result.url).queryParams ?? {};
  const token = query.access_token || query.token;

  if (query.status && query.status !== 'success') {
    const code = googleReasonCode(query.reason);
    logErr('googleLogin', `${query.status}: ${query.reason ?? ''}`);
    throw new GoogleLoginError(code, query.reason);
  }
  if (!token) {
    logErr('googleLogin', 'token topilmadi');
    throw new GoogleLoginError('failed');
  }

  logOk('googleLogin', { hasToken: !!token, hasRefreshToken: !!query.refresh_token });
  return { token, refreshToken: query.refresh_token };
}

/**
 * "Telegram bilan davom etish" tugmasi uchun ochiq sozlama (GET /auth/telegram/config): server yoqqan bo'lsa
 * `enabled` va vidjet uchun `bot_id`. Tugma faqat shu javobga qarab chiqadi (frontend nusxasiga emas).
 * @returns {Promise<{ enabled: boolean, botId: number|null, botUsername: string|null }>}
 */
export async function getTelegramLoginConfig() {
  const data = await request(ENDPOINTS.TELEGRAM_LOGIN_CONFIG, { auth: false });
  return {
    enabled: data?.enabled === true,
    botId:
      Number.isFinite(Number(data?.bot_id)) && data?.bot_id != null ? Number(data.bot_id) : null,
    botUsername: data?.bot_username ?? null,
  };
}

/**
 * Telegram Login vidjetining javobi bo'yicha kirish yoki ro'yxatdan o'tish. `data` — vidjet qaytargan obyekt
 * AYNAN o'zgartirilmagan holda (`hash` ham): imzo hamma maydonni qamraydi, keraksiz deb olib tashlansa tekshiruv buziladi.
 * Yangi hisob uchun `consentVersion` majburiy (400 `consent_required` / `consent_outdated`). Hisobda telefon va email
 * bo'lmaydi: ularni keyin profilda (yoki `PhonePrompt` orqali) to'ldiriladi.
 * @returns {Promise<{ access_token: string, refresh_token: string }>}
 */
export async function telegramLogin(data, consentVersion) {
  return authPost(
    'telegramLogin',
    ENDPOINTS.TELEGRAM_LOGIN_VERIFY,
    { data, actor_type: 'customer', consent_version: consentVersion },
    'Telegram orqali kirib bo‘lmadi'
  );
}

/**
 * Chiqishda refresh tokenni serverda bekor qiladi (POST /auth/logout). Server tomoni idempotent,
 * foydalanuvchi baribir chiqadi — shuning uchun xato yoki tarmoq yo'qligi e'tiborga olinmaydi.
 */
export async function revokeSession() {
  const [token, refreshToken] = await Promise.all([getToken(), getRefreshToken()]);
  if (!refreshToken) return;
  try {
    await request(ENDPOINTS.AUTH_LOGOUT, {
      method: 'POST',
      body: { refresh_token: refreshToken },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      auth: false,
      timeout: 4000,
    });
  } catch {
    // Chiqishga to'sqinlik qilmaydi.
  }
}

import { ENDPOINTS } from '../constants/config';
import { request } from '../utils/request';

// ─── Mijoz statusi (Bronza / Kumush / Oltin) ─────────────────────

/**
 * Status darajalari qoidalari (ochiq endpoint):
 * `{ customer: { bronze: { min_orders, max_cancel_pct, min_rating }, silver, gold }, worker }`.
 */
export const getBadgeLevels = () =>
  request(ENDPOINTS.BADGE_LEVELS, { fallbackMessage: 'Status qoidalari yuklanmadi' });

// ─── Ustalar mijozga bergan baholar ──────────────────────────────

/** Mijoz haqida ustalar qoldirgan baholar: `[{ id, rating, comment, created_at }]`. */
export async function getCustomerReviews(customerId, limit = 20) {
  const data = await request(ENDPOINTS.CUSTOMER_REVIEWS(customerId, limit), {
    fallbackMessage: 'Baholar yuklanmadi',
  });
  const list = Array.isArray(data) ? data : (data?.items ?? []);
  return list.map((r) => ({
    id: r.id,
    rating: Number(r.rating) || 0,
    comment: (r.comment ?? '').trim(),
    createdAt: r.created_at ?? null,
  }));
}

// ─── Shaxsni tasdiqlash ──────────────────────────────────────────

/**
 * Shaxsni tasdiqlash holati.
 * @returns {Promise<{ submission_status: 'not_submitted'|'pending'|'approved'|'rejected',
 *   method?: 'myid'|'operator'|null, verified_at?: string|null, valid_until?: string|null,
 *   validity_years?: number, expired?: boolean, revoked_reason?: string|null,
 *   rejected_reason?: string|null, myid_available?: boolean, can_start?: boolean,
 *   names_locked?: boolean, app_open_mode?: 'auth_session'|'browser'|'website'|null }>}
 */
export const getIdentityStatus = () =>
  request(ENDPOINTS.VERIFY_STATUS, { fallbackMessage: 'Tasdiqlash holati yuklanmadi' });

/**
 * MyID WebSDK tekshiruvini ochadi. Body: `{ birth_date: 'YYYY-MM-DD', pinfl | pass_data, return_to: 'app', app_id }`.
 * Javob: `{ open_url, session_id, nonce, expires_in, ... }` — `open_url` brauzerda ochiladi.
 * Xatolar: 409 `identity_already_verified` / `verification_already_in_progress`,
 * 503 `verification_provider_unavailable`, 422 `invalid_request_data`.
 */
export const startMyIdCheck = (body) =>
  request(ENDPOINTS.VERIFY_MYID_START, {
    method: 'POST',
    body,
    fallbackMessage: 'Tasdiqlashni boshlab bo‘lmadi',
  });

/**
 * «Tasdiqlashni yakunlash» tugmasi: MyID javobini hisobga yozadi. Server MyID javobini ~1 daqiqagacha
 * kutadi, shuning uchun uzun timeout. 409 `verification_in_progress` — boshqa bosish yakunlayapti.
 * Javob: `{ status, identity: { first_name, last_name, middle_name, birth_date } }`.
 */
export const completeMyIdCheck = ({ session_id, auth_code, nonce }) =>
  request(ENDPOINTS.VERIFY_MYID_COMPLETE, {
    method: 'POST',
    body: { session_id, auth_code, nonce },
    timeout: 70000,
    fallbackMessage: 'Tasdiqlashni yakunlab bo‘lmadi',
  });

/** MyID kodsiz qaytganda urinishni yopadi (server holatda "kutyapti" demasligi uchun). */
export const abandonMyIdCheck = ({ session_id, nonce }) =>
  request(ENDPOINTS.VERIFY_MYID_ABANDON, {
    method: 'POST',
    body: { session_id, nonce },
    fallbackMessage: 'Tasdiqlashni yopib bo‘lmadi',
  });

// ─── Email tasdiqlash ────────────────────────────────────────────

/** Email manziliga tasdiqlash kodi yuboradi (boshqa manzil kiritilsa, tasdiqlangach hisobdagi email almashadi). */
export const requestEmailOtp = (email) =>
  request(ENDPOINTS.VERIFY_EMAIL_REQUEST_OTP, {
    method: 'POST',
    body: { email },
    fallbackMessage: 'Kod yuborib bo‘lmadi',
  });

export const verifyEmailOtp = (email, code) =>
  request(ENDPOINTS.VERIFY_EMAIL_VERIFY_OTP, {
    method: 'POST',
    body: { email, code },
    fallbackMessage: 'Kodni tasdiqlab bo‘lmadi',
  });

// ─── Telegram ulash ──────────────────────────────────────────────

/** `{ enabled: boolean, linked: boolean }` — `enabled` false bo'lsa Telegram bu muhitda o'chiq. */
export const getTelegramStatus = () =>
  request(ENDPOINTS.TELEGRAM_LINK_STATUS, { fallbackMessage: 'Telegram holati yuklanmadi' });

/** Botga o'tish havolasi (bir martalik, bir necha daqiqada eskiradi): `{ url }`. */
export const createTelegramLink = () =>
  request(ENDPOINTS.TELEGRAM_LINK, {
    method: 'POST',
    body: {},
    fallbackMessage: 'Telegram havolasi olinmadi',
  });

export async function unlinkTelegram() {
  await request(ENDPOINTS.TELEGRAM_LINK, {
    method: 'DELETE',
    fallbackMessage: 'Telegramni uzib bo‘lmadi',
  });
}

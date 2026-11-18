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
 * @returns {Promise<{ submission_status: 'not_submitted'|'pending'|'approved'|'rejected',
 *   rejected_reason?: string|null, available_providers?: string[] }>}
 */
export const getIdentityStatus = () =>
  request(ENDPOINTS.VERIFY_STATUS, { fallbackMessage: 'Tasdiqlash holati yuklanmadi' });

/**
 * MyID orqali tasdiqlashni boshlaydi (qo'lda hujjat yuborish yopilgan: 410 `manual_verification_closed`).
 * `return_to: 'app'` bo'lsa MyID tugagach server `harna://cabinet/verify?status=verified` (yoki
 * `?status=rejected|error&reason=...`) ga qaytaradi. Javob: `{ redirect_url, verification_id }`.
 * Xato kodlari: 409 `identity_already_verified` / `verification_already_in_progress`,
 * 503 `verification_provider_unavailable`, 422 `invalid_request_data`.
 * @returns {Promise<{ redirect_url: string }>}
 */
export const startIdentityProvider = (provider = 'myid') =>
  request(ENDPOINTS.VERIFY_START, {
    method: 'POST',
    body: { provider, return_to: 'app' },
    fallbackMessage: 'Tasdiqlashni boshlab bo‘lmadi',
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

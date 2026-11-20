import { ENDPOINTS } from '../constants/config';
import { request } from '../utils/request';

// Qo'llab-quvvatlash: murojaat / taklif yuborish, "Mening murojaatlarim", jamoa bilan yozishma va FAQ
// (saytdagi /support, kabinet va "Bizga xabar yuboring" vidjeti bilan bir xil endpointlar).

export const SUPPORT_MIN_LENGTH = 10;
export const SUPPORT_MAX_LENGTH = 4000;

const mapMessage = (m) => ({
  id: String(m.id),
  mine: m.sender === 'user',
  text: m.body ?? '',
  createdAt: m.created_at ?? null,
});

/**
 * Murojaat yoki taklif yuboradi. Tizimga kirgan mijozda aloqa ma'lumoti shart emas
 * (javob xabarnomalarda ko'rinadi).
 * Mehmon (kirmagan) ham yubora oladi: ism va aloqa vositasi shart, CAPTCHA yoqilgan bo'lsa `captcha`
 * (Cloudflare Turnstile tokeni; bitta xabar uchun).
 * @param {{ kind: 'question'|'suggestion', body: string, name?: string, contact?: string, captcha?: string }} data
 */
export const sendSupportItem = ({ kind, body, name, contact, captcha }) =>
  request(ENDPOINTS.SUPPORT_MESSAGES, {
    method: 'POST',
    body: {
      kind,
      body,
      ...(name ? { name } : {}),
      ...(contact ? { contact } : {}),
      ...(captcha ? { captcha_token: captcha } : {}),
    },
    fallbackMessage: 'Murojaat yuborilmadi',
  });

/**
 * Mening murojaatlarim / takliflarim: `[{ id, status: 'new'|'answered'|'closed', createdAt, messages }]`.
 */
export async function getSupportItems(kind) {
  const data = await request(ENDPOINTS.SUPPORT_ITEMS(kind), {
    fallbackMessage: 'Murojaatlar yuklanmadi',
  });
  const list = Array.isArray(data) ? data : (data?.items ?? []);
  return list.map((it) => ({
    id: it.id,
    status: it.status ?? 'new',
    createdAt: it.created_at ?? null,
    messages: (it.messages ?? []).map(mapMessage),
  }));
}

/** Jamoa bilan yozishma (chat vidjeti): `{ messages, unread }`; yozishma bo'lmasa `messages` bo'sh. */
export async function getSupportConversation() {
  const data = await request(ENDPOINTS.SUPPORT_CONVERSATION, {
    fallbackMessage: 'Yozishma yuklanmadi',
  });
  return {
    messages: (data?.messages ?? []).map(mapMessage),
    unread: Number(data?.unread_for_user) || 0,
  };
}

export const markSupportConversationRead = () =>
  request(ENDPOINTS.SUPPORT_CONVERSATION_READ, {
    method: 'POST',
    body: {},
    fallbackMessage: 'Belgilab bo‘lmadi',
  });

/** Yozishmaga xabar yuboradi; javobda yangilangan butun yozishma keladi. */
export async function sendSupportChatMessage({ name, contact, body }) {
  const data = await request(ENDPOINTS.SUPPORT_MESSAGES, {
    method: 'POST',
    body: { kind: 'chat', name, contact, body },
    fallbackMessage: 'Xabar yuborilmadi',
  });
  return { messages: (data?.messages ?? []).map(mapMessage) };
}

/** Ochiq FAQ ro'yxati (admin kiritgan); bo'sh bo'lsa ilova zaxira matnlarni ko'rsatadi. */
export async function getFaq() {
  const data = await request(ENDPOINTS.FAQ, { fallbackMessage: 'Savollar yuklanmadi' });
  const list = Array.isArray(data) ? data : (data?.items ?? []);
  return list
    .filter((x) => x?.question && x?.answer)
    .map((x) => ({ id: String(x.id), q: x.question, a: x.answer }));
}

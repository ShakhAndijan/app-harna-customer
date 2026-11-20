// Yengil voqea yuboruvchi (POST /analytics/events). Xato ilovaga ta'sir qilmaydi: yuborilmasa jimgina tashlanadi.
// `visit_id` — ilova ochilganda bir marta yaratiladigan 32 belgili hex; voqealar shu bilan bir tashrifga bog'lanadi.
// Yuboriladigan narsa: serverning qat'iy ro'yxatidagi voqea nomi, tashrif raqami va ba'zan qadam. Boshqa hech narsa
// (ekran, yozilgan matn, hisob) yuborilmaydi va token qo'shilmaydi — sayohat hech kim bilan bog'lanmaydi.

import { AppState } from 'react-native';
import { ENDPOINTS } from '../constants/config';
import { request } from './request';

const FLUSH_DELAY_MS = 1500;
const MAX_BATCH = 20;

function makeVisitId() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const visitId = makeVisitId();
let queue = [];
let timer = null;

async function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;
  const events = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);
  try {
    await request(ENDPOINTS.ANALYTICS_EVENTS, { method: 'POST', body: { events }, auth: false });
  } catch {
    // Tahlil voqeasi yo'qolsa zarar yo'q.
  }
  if (queue.length > 0 && !timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
}

// Fonga o'tilganda navbat darhol yuboriladi: ilova qayta ishlamasligi mumkin, tashrifning oxirgi voqealari
// esa odamlar qayerda to'xtagani haqida eng ko'p gapiradi.
AppState.addEventListener('change', (state) => {
  if (state !== 'active') void flush();
});

// `step` faqat wizard_step_viewed uchun (1–6). Ishlab chiqish (dev) yig'ilishlaridan yuborilmaydi: ular
// haqiqiy serverga ulanadi va dasturchining sinovlari mijoz sifatida hisoblanib qolardi.
export function trackEvent(name, step) {
  if (__DEV__) return;
  try {
    const event = { name, visit_id: visitId };
    if (step != null) event.step = step;
    queue.push(event);
    if (queue.length >= MAX_BATCH) void flush();
    else if (!timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
  } catch {
    // Hech qachon ekranni buzmaydi.
  }
}

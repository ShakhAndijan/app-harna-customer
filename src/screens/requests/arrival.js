import { formatDay } from './utils';

// Usta kelish vaqti oralig'i (saytdagi WindowPicker bilan bir xil mantiq): sana bilan birga
// "13:00–14:00" ko'rinishida. Sozlamalar serverdan (`/system/order-timing`) keladi.
// `urgentAutoHours` — so'ralgan vaqtgacha shuncha soatdan kam qolsa server buyurtmani o'zi "Shoshilinch"
// qiladi; `urgentDayEnds` — oyna tanlanmagan kunning "vaqti" (shu soatgacha).
export const DEFAULT_TIMING = {
  minutes: 60,
  firstHour: 8,
  lastHour: 20,
  urgentAutoHours: 3,
  urgentDayEnds: '21:00',
};

// Toshkent vaqti (UTC+5): oraliq tugash vaqtini hisoblash uchun.
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;

const pad = (n) => String(n).padStart(2, '0');

// "13:00" / "13:00:00" → "13:00"; yaroqsiz bo'lsa null.
export function normalizeTime(value) {
  const m = value ? /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(String(value).trim()) : null;
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? null : `${pad(h)}:${pad(min)}`;
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// Serverdan kelgan sozlamani tekshirib, UI formatiga o'giradi (noto'g'ri qiymat — standart).
export function mapTiming(raw) {
  const int = (v, min, max, fallback) =>
    Number.isInteger(v) && v >= min && v <= max ? v : fallback;
  const firstHour = int(raw?.window_first_hour, 0, 23, DEFAULT_TIMING.firstHour);
  return {
    minutes: int(raw?.arrival_window_minutes, 1, MINUTES_PER_DAY, DEFAULT_TIMING.minutes),
    firstHour,
    lastHour: int(
      raw?.window_last_hour,
      firstHour,
      23,
      Math.max(firstHour, DEFAULT_TIMING.lastHour)
    ),
    urgentAutoHours: int(raw?.urgent_auto_hours, 0, 24 * 31, DEFAULT_TIMING.urgentAutoHours),
    urgentDayEnds: normalizeTime(raw?.urgent_day_ends) ?? DEFAULT_TIMING.urgentDayEnds,
  };
}

// So'nggi yuklangan sozlama: ko'rsatish funksiyalari (hook'siz) shundan foydalanadi.
let current = DEFAULT_TIMING;
export const setTiming = (timing) => {
  current = timing;
};
export const getTiming = () => current;

// "13:00–14:00": boshlanish bor, tugash yo'q bo'lsa davomiylikdan hisoblanadi.
export function windowLabel(start, end, minutes) {
  const from = normalizeTime(start);
  if (!from) return null;
  const mins = minutes ?? current.minutes;
  const to = normalizeTime(end) ?? (mins ? addMinutes(from, mins) : null);
  return to ? `${from}–${to}` : from;
}

// "19-Noy, 13:00–14:00" (oraliq bo'lmasa faqat sana, sana bo'lmasa faqat oraliq).
export function dayWithWindow(tr, iso, label) {
  const day = formatDay(tr, iso);
  return [day, label].filter(Boolean).join(', ');
}

// Buyurtmadagi (kelishilgan) va kelishuvdagi (taklif) oraliqlar.
export const orderWindowLabel = (order) =>
  windowLabel(order.windowStart, order.windowEnd, order.windowMinutes);
export const offerWindowLabel = (order) =>
  windowLabel(order.offerWindowStart, order.offerWindowEnd, order.windowMinutes);

function slotEndMs(iso, time, minutes) {
  const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
  const [h, m] = time.split(':').map(Number);
  return Date.UTC(y, mo - 1, d, h, m) - TASHKENT_OFFSET_MS + minutes * 60 * 1000;
}

/**
 * Tanlash mumkin oraliqlar boshlanish vaqtlari ("08:00"...). Tanlangan kun bugun bo'lsa,
 * allaqachon tugab bo'lganlari chiqarib tashlanadi. `notBegun` (buyurtma formasining qoidasi):
 * bugun boshlanib bo'lganlari ham chiqariladi.
 */
export function windowSlots(timing, iso, now = Date.now(), { notBegun = false } = {}) {
  const slots = [];
  for (let hour = timing.firstHour; hour <= timing.lastHour; hour++) {
    const time = `${pad(hour)}:00`;
    if (iso && now >= slotEndMs(iso, time, notBegun ? 0 : timing.minutes)) continue;
    slots.push(time);
  }
  return slots;
}

// Hozirgi vaqtga nisbatan hali tanlash mumkin oraliqlar (render ichida `Date.now()` chaqirmaslik uchun shu yerda).
export const openSlots = (timing, iso, options) => windowSlots(timing, iso, Date.now(), options);

// Toshkentdagi bugungi kun, "YYYY-MM-DD": hamma oraliq shu soat bo'yicha.
export function tashkentToday(now = Date.now()) {
  return new Date(now + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

// Tanlangan oraliq shu kunda hali tanlash mumkin bo'lsa o'zi, aks holda null: ko'rsatilgan narsa yuboriladi.
export function keptWindow(timing, iso, value, options) {
  return iso && value && windowSlots(timing, iso, Date.now(), options).includes(value)
    ? value
    : null;
}

/**
 * Server buyurtmani o'zi "Shoshilinch" qiladimi (uning `urgent_now`'i): so'ralgan vaqtgacha
 * `urgentAutoHours` soatdan kam qolgan bo'lsa. So'ralgan vaqt — oraliq boshi, oraliq yo'q bo'lsa
 * shu kunning `urgentDayEnds`'i (21:00). Kun so'ralmasa ("Farqi yo'q") hech qachon.
 */
export function urgentSoon(timing, iso, window, now = Date.now()) {
  if (!iso) return false;
  const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
  const clock = normalizeTime(window) ?? normalizeTime(timing.urgentDayEnds);
  if (!clock || ![y, mo, d].every(Number.isFinite)) return false;
  const [h, m] = clock.split(':').map(Number);
  const at = Date.UTC(y, mo - 1, d, h, m) - TASHKENT_OFFSET_MS;
  return at - now < timing.urgentAutoHours * 60 * 60 * 1000;
}

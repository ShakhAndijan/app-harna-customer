// Saytning `config.json` havolalari bilan ishlash (backend `mobile-shared/lib/siteConfig.ts` bilan bir xil qoidalar):
// tarmoq uchun oddiy handle ham, to'liq http(s) manzil ham yoziladi; ochiladigan narsa faqat http(s).

/** Saytdagi tartibda. Telegram uchun brend belgisi yo'q — qog'oz samolyot. */
export const SOCIAL = [
  { key: 'telegram', icon: 'send', label: 'Telegram' },
  { key: 'instagram', icon: 'instagram', label: 'Instagram' },
  { key: 'youtube', icon: 'youtube', label: 'YouTube' },
  { key: 'tiktok', icon: 'music-note', label: 'TikTok' },
  { key: 'facebook', icon: 'facebook', label: 'Facebook' },
  { key: 'x', icon: 'alpha-x', label: 'X' },
  { key: 'linkedin', icon: 'linkedin', label: 'LinkedIn' },
  { key: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp' },
];

const FROM_HANDLE = {
  telegram: (h) => `https://t.me/${h}`,
  instagram: (h) => `https://www.instagram.com/${h}`,
  youtube: (h) => `https://www.youtube.com/@${h}`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  facebook: (h) => `https://www.facebook.com/${h}`,
  x: (h) => `https://x.com/${h}`,
  linkedin: (h) => `https://www.linkedin.com/company/${h}`,
};

/** Yozilganidek http(s) manzil yoki `null`. */
export function webHref(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || !/^https?:\/\/[^\s/?#]+\.[^\s/?#]+/i.test(text)) return null;
  return text;
}

/** Tarmoq havolasi qayerga olib borishi, yoki `null` (qoldiriladi). */
export function socialHref(key, value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  const web = webHref(text);
  if (web) return web;
  if (key === 'whatsapp') {
    const digits = text.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
  }
  const handle = text.replace(/^@/, '');
  return FROM_HANDLE[key] && /^[\w.-]{2,64}$/.test(handle) ? FROM_HANDLE[key](handle) : null;
}

/** Faqat to'g'ri, to'ldirilgan tarmoqlar: `[{ key, icon, label, href }]`. */
export const socialLinks = (social) =>
  SOCIAL.map((s) => ({ ...s, href: socialHref(s.key, social?.[s.key]) })).filter((s) => s.href);

/** Vergul bilan ajratilgan yozuv — har biri alohida. */
export const listOf = (value) =>
  (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

/** `tel:` bo'shliqsiz — terish ilovasi formatlangan raqamni o'qiy olmaydi. */
export const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;

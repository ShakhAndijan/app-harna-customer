import { SITE_URL } from '../constants/config';

/** Bir qavatli obyektning matn qiymatlari (kesilgan); bo'shlari tashlanadi. */
function strings(value) {
  const out = {};
  if (!value || typeof value !== 'object') return out;
  for (const [name, raw] of Object.entries(value)) {
    if (typeof raw === 'string' && raw.trim() !== '') out[name] = raw.trim();
  }
  return out;
}

/**
 * Saytning ochiq sozlamalari (`dev.harna.uz/config.json`) — saytning pastki qismi (footer) va ikkala
 * ilova uchun bitta fayl: yangi raqam yoki kanal ilovaga reliz kutmasdan yetib boradi.
 *  - social: tarmoqlar (`telegram`, `instagram`, …) — handle yoki to'liq manzil
 *  - apps: do'konlar (`googlePlay`, `appStore`, `workerGooglePlay`, `workerAppStore`)
 *  - contact: `phone`, `email` (vergul bilan bir nechta), `address`
 *  - ads: `phones` (vergul bilan), `note`
 *  - turnstileSiteKey: CAPTCHA kaliti; bo'sh bo'lsa CAPTCHA yoqilmagan
 * Yuklanmasa xato tashlaydi (so'rov kutubxonasi keyinroq qayta urinadi); ekranlar qiymat yo'qligida
 * qattiq kodlangan zaxiraga (`SUPPORT_CONTACT`) tayanadi.
 */
export async function getSiteConfig() {
  const res = await fetch(`${SITE_URL}/config.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`config.json ${res.status}`);
  const raw = await res.json();
  const source = raw && typeof raw === 'object' ? raw : {};
  const key = source.turnstileSiteKey;
  return {
    social: strings(source.social),
    apps: strings(source.apps),
    contact: strings(source.contact),
    ads: strings(source.ads),
    turnstileSiteKey: typeof key === 'string' ? key.trim() : '',
  };
}

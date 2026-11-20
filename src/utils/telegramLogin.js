import { SITE_URL } from '../constants/config';

// Telegram Login vidjeti (oauth.telegram.org): bot domeni (`origin`) — saytning manzili, bot uchun BotFather'da
// `/setdomain` bilan shu domen berilgan bo'lishi kerak. Tasdiqlangach Telegram `return_to` manzilga
// `#tgAuthResult=<base64url JSON>` bilan qaytaradi; sahifa yuklanmaydi, natija faqat o'qiladi.
export const telegramLoginUrl = (botId) =>
  `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(SITE_URL)}` +
  `&request_access=write&return_to=${encodeURIComponent(`${SITE_URL}/`)}`;

// Manzil Telegram qaytaradigan sayt manzilimi (natija shu yerga keladi).
export const isTelegramReturn = (url) => typeof url === 'string' && url.startsWith(SITE_URL);

// `tgAuthResult`: base64url JSON, ismlar UTF-8 da. O'qib bo'lmasa null.
export function decodeTelegramResult(value) {
  try {
    const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const text = decodeURIComponent(
      Array.from(binary)
        .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    const data = JSON.parse(text);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

// Qaytish manzilidan vidjet javobini oladi (`#tgAuthResult=...`); yo'q yoki buzuq bo'lsa null.
export function readTelegramResult(url) {
  const hash = String(url).split('#')[1] ?? '';
  const match = new RegExp('tgAuthResult=([^&]+)').exec(hash);
  return match ? decodeTelegramResult(decodeURIComponent(match[1])) : null;
}

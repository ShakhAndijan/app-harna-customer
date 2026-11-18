import { useState } from 'react';

// Ochiq rasmlarning yonida kichik JPEG nusxasi bor (avatar 256 px, boshqalari 800 px). Nusxa manzili rasm
// manzilidan yasaladi: yo'l avatars | portfolios | review-photos papkasida bo'lsa, kengaytma `.t.jpg` ga
// almashadi (?query va #fragment saqlanadi). `.t.jpg` bilan tugagan va boshqa URL'larning (Google,
// Telegram, file:) nusxasi yo'q — null.
const THUMB_RE = /^(.*\/(?:avatars|portfolios|review-photos)\/.+?)\.(?:jpe?g|png|webp)$/i;

export function thumbUrl(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return null;
  const cut = url.search(/[?#]/);
  const path = cut === -1 ? url : url.slice(0, cut);
  const rest = cut === -1 ? '' : url.slice(cut);
  if (/\.t\.jpg$/i.test(path)) return null;
  const m = THUMB_RE.exec(path);
  return m ? `${m[1]}.t.jpg${rest}` : null;
}

/**
 * Kichik rasmlar (karta, ro'yxat, avatar) uchun: avval nusxa, u yuklanmasa (yuklangandan keyin bir necha
 * daqiqa nusxa bo'lmasligi mumkin) rasmning o'zi. `onError` nusxa xatosini o'zi ushlaydi va `true`
 * qaytaradi — shunda chaqiruvchi xato holatiga o'tmaydi; rasmning o'zi ham yuklanmasa `false`.
 * Galereya, to'liq ekran va oldindan ko'rishda ishlatilmaydi: u yerda rasmning o'zi qoladi.
 */
export default function useThumb(uri, enabled = true) {
  const [failedFor, setFailedFor] = useState(null);
  const thumb = enabled ? thumbUrl(uri) : null;
  const usingThumb = !!thumb && failedFor !== uri;
  const onError = () => {
    if (usingThumb) {
      setFailedFor(uri);
      return true;
    }
    return false;
  };
  return { src: usingThumb ? thumb : uri, onError };
}

import { Share } from 'react-native';
import { SITE_URL } from '../../constants/config';

export const encodeImageUri = (uri) => (uri ? uri.replace(/\+/g, '%2B') : uri);

export const formatPrice = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/**
 * E'lon narxi matni: kelishiladigan e'londa "Kelishiladi", soatbayda "50 000 so'm / soat",
 * qolganida "50 000 so'm".
 */
export function priceText(listing, tr) {
  if (listing.price == null) return tr('listings.negotiable');
  const base = `${formatPrice(listing.price)} ${tr('common.currencySom')}`;
  return listing.priceKind === 'hourly' ? `${base} ${tr('listings.perHour')}` : base;
}

/** E'lonni tizim ulashish oynasi orqali yuboradi; oxirida saytdagi shu e'lon sahifasi havolasi. */
export function shareListing(listing, tr) {
  const text = tr('listings.detail.shareMessage', {
    title: listing.title,
    price: priceText(listing, tr),
    name: listing.worker?.name ?? '',
  });
  return Share.share({
    message: `${text}
${SITE_URL}/listings/${listing.id}`,
  }).catch(() => {});
}

/** ISO sana → "3 kun oldin" ko'rinishidagi matn (noto'g'ri sana bo'lsa bo'sh). */
export function timeAgo(iso, tr) {
  if (!iso) return '';
  // Hermes ba'zan 3 tadan ortiq kasr raqamlarini (mikrosekund) tushunmaydi.
  const time = new Date(iso.replace(/(\.\d{3})\d+/, '$1')).getTime();
  if (Number.isNaN(time)) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return tr('listings.ago.now');
  if (minutes < 60) return tr('listings.ago.minutes', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return tr('listings.ago.hours', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return tr('listings.ago.days', { n: days });
  return tr('listings.ago.months', { n: Math.floor(days / 30) });
}

/** Soniya → "1:05" (video davomiyligi). */
/** Karta muqovasi: video e'londa `video_poster` (bo'lmasa birinchi rasm), boshqasida birinchi rasm. */
export const listingCover = (listing) =>
  listing.videoUrl
    ? (listing.videoPoster ?? listing.photos[0])
    : (listing.photos[0] ?? listing.videoPoster);

export function formatVideoDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** Matndan faqat raqamlarni qoldiradi (narx maydonlari uchun). */
export const digitsOnly = (s) => String(s ?? '').replace(/\D/g, '');

/** Usta profili ekrani kutadigan qisqa usta obyekti. */
export const workerToUsta = (worker) => ({
  id: worker.id,
  name: worker.name,
  initial: worker.initial,
  color: worker.color,
  profile_photo: worker.photo,
  rating: worker.rating ?? 0,
  location: worker.location,
  is_online: worker.online,
  reliability_badge: worker.badge,
});

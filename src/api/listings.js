import { ENDPOINTS } from '../constants/config';
import { request } from '../utils/request';
import { AVATAR_COLORS } from './workers';

// Backend `price_type_id` qiymatlari (GET /price-types): 1 — soatbay, 2 — belgilangan, 3 — kelishuv asosida.
const PRICE_KIND = { 1: 'hourly', 2: 'fixed', 3: 'negotiable' };

// Ayrim eski e'lonlar rasmi http:// bilan saqlangan; Android ochiq (shifrlanmagan) manzillarni bloklaydi.
const secureUrl = (uri) => (typeof uri === 'string' ? uri.replace(/^http:\/\//i, 'https://') : uri);

/** Backenddagi e'lon obyektini UI formatiga o'giradi. */
export function mapListing(l) {
  const w = l.worker;
  const firstName = w?.first_name ?? '';
  return {
    id: l.id,
    code: l.code ?? null,
    workerId: l.worker_id,
    categoryId: l.category_id,
    title: l.title ?? '',
    description: l.description ?? '',
    // null — kelishiladigan e'lon (narx ko'rsatilmagan).
    price: l.price != null ? Math.round(parseFloat(l.price)) : null,
    priceKind: PRICE_KIND[l.price_type_id] ?? 'fixed',
    currency: l.currency ?? 'UZS',
    photos: (l.photos ?? []).filter(Boolean).map(secureUrl),
    // Video e'lon: havola, muqova va davomiyligi (soniya).
    videoUrl: secureUrl(l.video_url) ?? null,
    videoPoster: secureUrl(l.video_poster) ?? null,
    videoDuration: l.video_duration != null ? Number(l.video_duration) : null,
    isTop: !!l.is_top,
    createdAt: l.created_at,
    isFavorite: !!l.is_favorite,
    commentCount: l.comment_count ?? 0,
    likeCount: l.like_count ?? 0,
    isLiked: !!l.is_liked,
    worker: w
      ? {
          id: w.id,
          name: [firstName, w.last_name].filter(Boolean).join(' '),
          initial: firstName[0]?.toUpperCase() ?? '?',
          color: AVATAR_COLORS[w.id % AVATAR_COLORS.length],
          photo: secureUrl(w.profile_photo) ?? null,
          rating: w.overall_rating != null ? parseFloat(w.overall_rating) : null,
          badge: w.reliability_badge ?? 'none',
          online: !!w.is_online,
          location: [w.district, w.region].filter(Boolean).join(', '),
        }
      : null,
  };
}

function mapPage(data, mapItem) {
  return {
    items: (data?.items ?? []).map(mapItem),
    total: data?.pagination?.total ?? 0,
    page: data?.pagination?.page ?? 1,
    pages: data?.pagination?.pages ?? 1,
  };
}

/**
 * E'lonlar ro'yxati (sahifalangan). `categoryId` asosiy yo'nalish bo'lsa, uning quyi yo'nalishlaridagi
 * e'lonlar ham keladi.
 * @param {{ page?: number, size?: number, q?: string, categoryId?: number|null, workerId?: number|null,
 *   priceMin?: number|null, priceMax?: number|null, priced?: boolean|null, hasPhoto?: boolean,
 *   sort?: 'new'|'price_asc'|'price_desc'|'rating' }} params
 * @returns {Promise<{ items: ReturnType<typeof mapListing>[], total: number, page: number, pages: number }>}
 */
export async function getListingsPage({
  page = 1,
  size = 12,
  q,
  categoryId,
  workerId,
  priceMin,
  priceMax,
  priced,
  hasPhoto,
  sort,
} = {}) {
  const params = [`page=${page}`, `size=${size}`];
  if (q?.trim()) params.push(`q=${encodeURIComponent(q.trim().slice(0, 100))}`);
  if (categoryId) params.push(`category_id=${categoryId}`);
  if (workerId) params.push(`worker_id=${workerId}`);
  if (priceMin != null) params.push(`price_min=${priceMin}`);
  if (priceMax != null) params.push(`price_max=${priceMax}`);
  if (priced === true || priced === false) params.push(`priced=${priced}`);
  if (hasPhoto) params.push('has_photo=true');
  if (sort && sort !== 'new') params.push(`sort=${sort}`);

  const data = await request(`${ENDPOINTS.LISTINGS_BROWSE}?${params.join('&')}`, {
    fallbackMessage: "E'lonlar yuklanmadi",
  });
  return mapPage(data, mapListing);
}

export async function getListing(listingId) {
  const data = await request(ENDPOINTS.LISTING_DETAIL(listingId), {
    fallbackMessage: "E'lon yuklanmadi",
  });
  return mapListing(data);
}

/** Mijozning saqlagan e'lonlari (oxirgi saqlangani birinchi). */
export async function getFavoriteListingsPage({ page = 1, size = 12 } = {}) {
  const data = await request(ENDPOINTS.LISTING_FAVORITES(page, size), {
    fallbackMessage: "Saqlangan e'lonlar yuklanmadi",
  });
  return mapPage(data, mapListing);
}

/**
 * "Mutaxassis" filtri uchun e'lon mualliflarini qidiradi: ism yoki to'liq telefon raqami.
 * @returns {Promise<{ id: number, name: string, photo: string|null, listingCount: number }[]>}
 */
export async function searchListingAuthors(q, limit = 10) {
  const text = q.trim();
  if (!text) return [];
  const data = await request(ENDPOINTS.LISTING_AUTHORS(text.slice(0, 50), limit), {
    fallbackMessage: 'Mutaxassislar yuklanmadi',
  });
  return (data ?? []).map((a) => ({
    id: a.id,
    name: [a.first_name, a.last_name].filter(Boolean).join(' ').trim(),
    photo: secureUrl(a.profile_photo) ?? null,
    listingCount: a.listing_count ?? 0,
  }));
}

/** Mijoz layk bosgan e'lonlar (oxirgisi birinchi). */
export async function getLikedListingsPage({ page = 1, size = 12 } = {}) {
  const data = await request(ENDPOINTS.CUSTOMER_LIKED_LISTINGS(page, size), {
    fallbackMessage: "Yoqtirgan e'lonlar yuklanmadi",
  });
  return mapPage(data, mapListing);
}

export async function favoriteListing(listingId) {
  await request(ENDPOINTS.LISTING_FAVORITE(listingId), {
    method: 'POST',
    fallbackMessage: "E'lonni saqlab bo'lmadi",
  });
}

export async function unfavoriteListing(listingId) {
  await request(ENDPOINTS.LISTING_FAVORITE(listingId), {
    method: 'DELETE',
    fallbackMessage: "E'lonni olib tashlab bo'lmadi",
  });
}

export async function likeListing(listingId) {
  await request(ENDPOINTS.LISTING_LIKE(listingId), {
    method: 'POST',
    body: {},
    fallbackMessage: "Layk bosib bo'lmadi",
  });
}

export async function unlikeListing(listingId) {
  await request(ENDPOINTS.LISTING_LIKE(listingId), {
    method: 'DELETE',
    fallbackMessage: "Laykni olib bo'lmadi",
  });
}

function mapComment(c) {
  return {
    id: c.id,
    body: c.body ?? '',
    createdAt: c.created_at,
    authorName: c.author_name ?? '',
    authorPhoto: secureUrl(c.author_photo) ?? null,
    // E'lon egasi (usta) izohlari alohida belgilanadi.
    isOwner: !!c.is_listing_owner,
    isMine: !!c.is_mine,
  };
}

export async function getListingComments(listingId, { page = 1, size = 50 } = {}) {
  const data = await request(`${ENDPOINTS.LISTING_COMMENTS(listingId)}?page=${page}&size=${size}`, {
    fallbackMessage: 'Izohlar yuklanmadi',
  });
  return mapPage(data, mapComment);
}

export const addListingComment = (listingId, body) =>
  request(ENDPOINTS.LISTING_COMMENTS(listingId), {
    method: 'POST',
    body: { body: body.trim() },
    fallbackMessage: 'Izoh yuborilmadi',
  });

// Izohni tahrirlash (PATCH). Diqqat: dev-back hozircha bu usulni qo'llamaydi (405) — CommentsSection'dagi COMMENT_EDIT_ENABLED bayrog'iga qarang.
export const updateListingComment = (listingId, commentId, body) =>
  request(ENDPOINTS.LISTING_COMMENT(listingId, commentId), {
    method: 'PATCH',
    body: { body: body.trim() },
    fallbackMessage: "Izoh o'zgartirilmadi",
  });

export const deleteListingComment = (listingId, commentId) =>
  request(ENDPOINTS.LISTING_COMMENT(listingId, commentId), {
    method: 'DELETE',
    fallbackMessage: "Izohni o'chirib bo'lmadi",
  });

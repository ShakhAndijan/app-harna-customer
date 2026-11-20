import { ENDPOINTS } from '../constants/config';
import { request } from '../utils/request';
import { uploadImageToPresignedUrl } from './auth';
import { resolvePhotoContentType } from './orders';

export const MAX_REVIEW_PHOTOS = 5;

/** Baho rasmini presigned URL orqali yuklab, `photo_temp_keys` uchun `temp_key`ni qaytaradi. */
export async function uploadReviewPhoto(uri, mimeType) {
  const contentType = resolvePhotoContentType(uri, mimeType);
  if (!contentType) {
    const e = new Error('UNSUPPORTED_PHOTO_TYPE');
    e.code = 'UNSUPPORTED_PHOTO_TYPE';
    throw e;
  }
  const { upload_url, temp_key } = await request(ENDPOINTS.REVIEW_PHOTO_UPLOAD_URL, {
    method: 'POST',
    body: { content_type: contentType },
    fallbackMessage: 'Rasm yuklash manzili olinmadi',
  });
  await uploadImageToPresignedUrl(upload_url, uri, contentType);
  return temp_key;
}

/**
 * Yakunlangan buyurtma bo'yicha ustaga baho: 1–5 yulduz, izoh (≤2000) va rasmlar (≤5).
 * Bir buyurtmaga bir marta beriladi.
 */
export const createOrderReview = (orderId, { rating, comment, photoKeys, photosPublic = false }) =>
  request(ENDPOINTS.ORDER_REVIEW(orderId), {
    method: 'POST',
    body: {
      rating,
      comment: comment?.trim() || null,
      ...(photoKeys?.length ? { photo_temp_keys: photoKeys } : {}),
      // Buyurtma suratlari ustaning ochiq profilida ko'rinsinmi: faqat shu yerda beriladi (sharh tahrirlanmaydi).
      photos_public: photosPublic === true,
    },
    fallbackMessage: "Baho yuborib bo'lmadi",
  });

const AVATAR_COLORS = ['#ec4899', '#3b82f6', '#8b5cf6', '#2fa37a', '#e87a45', '#f5c451', '#06b6d4'];

export function mapTopComment(item, index) {
  const name = (item.user?.full_name ?? '').trim();
  return {
    name,
    initial: name?.[0]?.toUpperCase() ?? '?',
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    stars: item.rating ?? 0,
    text: item.comment ?? '',
    createdAt: item.created_at ?? null,
  };
}

export async function getTopComments({ limit = 10 } = {}) {
  const data = await request(ENDPOINTS.TOP_COMMENTS(limit), {
    fallbackMessage: 'Sharhlar yuklanmadi',
  });
  return (data ?? []).map(mapTopComment);
}

// Bitta order_title — bitta ish. Har bir ishning bir nechta after_photo'si
// bo'lishi mumkin, shuning uchun ularni kartochka ichidagi karuselga beramiz.
//
// `top-orders` hozircha faqat sarlavha, usta, reyting, suratlar va yaratilgan sanani
// beradi. Quyidagi ixtiyoriy maydonlar backend qo'shganda ekranda o'zi paydo bo'ladi
// (kelmasa — null, ekranda shu maydon chizilmaydi):
//   category{name}, district, completed_at, duration, price, review{text,rating,user}.
export function mapTopOrders(orders) {
  return orders.map((order, index) => ({
    id: order.public_token ?? String(index),
    publicToken: order.public_token ?? null,
    title: order.order_title ?? '',
    worker: (order.worker?.full_name ?? '').trim(),
    workerId: order.worker?.id ?? null,
    rating: order.rating ?? 0,
    photos: order.after_photos ?? [],
    beforePhotos: order.before_photos ?? [],
    createdAt: order.created_at ?? null,
    completedAt: order.completed_at ?? null,
    category: order.category?.name ?? null,
    location: order.district ?? null,
    duration: order.duration ?? null,
    price: order.price ?? null,
    review: order.review ?? null,
  }));
}

// Ochiq (tokenli) buyurtma: haqiqiy kategoriya va yakunlangan sana.
export async function getPublicOrder(token) {
  return (
    (await request(ENDPOINTS.PUBLIC_ORDER(token), { fallbackMessage: 'Ish topilmadi' })) ?? null
  );
}

const mapPage = (data, mapItem) => ({
  items: (data?.items ?? []).map(mapItem),
  total: data?.pagination?.total ?? 0,
  page: data?.pagination?.page ?? 1,
  pages: data?.pagination?.pages ?? 1,
});

/**
 * Ustaning mijozlardan olgan baholari (yangisi birinchi). Har biri: yulduz, izoh, suratlar, sana,
 * mijoz ismi va yo'nalish.
 */
export async function getWorkerReviewsPage(workerId, { page = 1, size = 10 } = {}) {
  const data = await request(ENDPOINTS.WORKER_REVIEWS(workerId, page, size), {
    fallbackMessage: 'Sharhlar yuklanmadi',
  });
  return mapPage(data, (r) => ({
    id: `${r.customer?.id ?? 'c'}-${r.created_at}`,
    title: (r.customer?.full_name ?? '').trim(),
    category: r.category?.name ?? null,
    workDate: r.created_at ?? null,
    rating: r.rating ?? null,
    comment: r.comment ?? '',
    photos: r.photos ?? [],
  }));
}

/**
 * Ustaning platformada bajargan ishlari (oldin va keyin suratlari, baho). Natija `WorksCarousel` va
 * `WorkDetailScreen` kutadigan shaklda; `publicToken` ochiq buyurtma ma'lumotini olish uchun.
 */
export async function getWorkerCompletedJobsPage(workerId, { page = 1, size = 10 } = {}) {
  const data = await request(ENDPOINTS.WORKER_COMPLETED_JOBS(workerId, page, size), {
    fallbackMessage: 'Bajarilgan ishlar yuklanmadi',
  });
  return mapPage(data, (j) => ({
    id: j.public_token,
    publicToken: j.public_token,
    title: j.category?.name ?? '',
    category: j.category?.name ?? null,
    rating: j.rating ?? null,
    photo: j.after_photos?.[0] ?? j.before_photos?.[0] ?? null,
    photos: j.after_photos ?? [],
    beforePhotos: j.before_photos ?? [],
    completedAt: j.completed_at ?? null,
    workDate: j.completed_at ?? null,
  }));
}

export async function getTopOrders({ limit = 10 } = {}) {
  const data = await request(ENDPOINTS.TOP_ORDERS(limit), {
    fallbackMessage: 'Ishlar yuklanmadi',
  });
  return mapTopOrders(data ?? []);
}

import { ENDPOINTS } from '../constants/config';
import { request } from '../utils/request';
import { devLog } from '../utils/log';

export const AVATAR_COLORS = [
  '#2fa37a',
  '#e87a45',
  '#3f7fd4',
  '#ec4899',
  '#8b5cf6',
  '#f5c451',
  '#06b6d4',
];

const formatPrice = (price) =>
  String(Math.round(parseFloat(price))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Ro'yxat va profil javobida umumiy: bandlik holati va nishonlar.
function mapWorkerExtras(w) {
  return {
    // online | busy | offline; eski javoblarda faqat `is_online` bo'ladi.
    availability: w.availability ?? null,
    busyUntil: w.busy_until ?? null,
    isPro: !!w.is_pro,
    isTop: !!w.is_top,
    contestWins: w.contest_wins ?? 0,
    complaintsCount: w.complaints_count ?? 0,
    brigade: w.brigade
      ? { id: w.brigade.id ?? null, name: w.brigade.name ?? '', size: w.brigade.size ?? null }
      : null,
  };
}

/** Backenddan kelgan worker obyektini UI formatiga o'giradi */
export function mapWorker(w) {
  return {
    ...mapWorkerExtras(w),
    id: w.id,
    name: `${w.first_name} ${w.last_name}`,
    initial: w.first_name?.[0]?.toUpperCase() ?? '?',
    color: AVATAR_COLORS[w.id % AVATAR_COLORS.length],
    profile_photo: w.profile_photo ?? null,
    profession: w.bio?.split(/[.,،]/)[0]?.trim() ?? '',
    bio: w.bio ?? '',
    rating: parseFloat(w.overall_rating ?? '0'),
    location: [w.district, w.region].filter(Boolean).join(', '),
    experienceYears: w.experience_years ?? 0,
    startingPrice: formatPrice(w.min_price ?? '0'),
    minPrice: parseFloat(w.min_price ?? '0'),
    is_online: w.is_online ?? false,
    isIdentityVerified: !!w.is_identity_verified,
    reliability_badge: w.reliability_badge ?? 'none',
    vip_status: w.vip_status ?? 'none',
    reviewCount: w.review_count ?? 0,
    // Joylashuv kiritilmagan ustalar uchun null; `distanceKm` faqat near_lat/near_lon bilan so'ralganda keladi.
    latitude: w.latitude != null ? Number(w.latitude) : null,
    longitude: w.longitude != null ? Number(w.longitude) : null,
    distanceKm: w.distance_km != null ? Number(w.distance_km) : null,
    // Ish hududi (radius rejimida) — ustalar xaritasida tanlanganda doira bo'lib chiqadi.
    workAreaMode: w.work_area_mode ?? null,
    workRadiusKm: w.work_radius_km ?? null,
    mainCategory: w.main_category?.name ?? '',
    categoryId: w.main_category?.id ?? null,
    skills: Array.isArray(w.skills) ? w.skills : [],
  };
}

const UNION_PAGE_SIZE = 100;
// Bir nechta yo'nalish tanlanganda har biri uchun ko'pi bilan shuncha sahifa olinadi (xavfsizlik chegarasi).
const UNION_MAX_PAGES = 5;

// Bir nechta yo'nalish birlashtirilganda tartib mijoz tomonda tiklanadi (server faqat bitta `category_id` biladi).
const UNION_SORTERS = {
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => b.id - a.id,
  price: (a, b) => a.minPrice - b.minPrice,
  experience: (a, b) => b.experienceYears - a.experienceYears,
  distance: (a, b) =>
    (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY),
};

/** Faqat ustalar ro'yxati (umumiy sonsiz): bosh sahifa va so'rovlar uchun. Parametrlar `getWorkersPage` dagidek. */
export async function getWorkers(params) {
  return (await getWorkersPage(params)).items;
}

/**
 * @param {{ page?: number, size?: number, categoryId?: number|string|null,
 *   categoryIds?: Array<number|string>, sort?: string,
 *   regionId?: number|null, districtId?: number|null, minRating?: number|null,
 *   verifiedOnly?: boolean, isOnline?: boolean, badge?: 'gold'|'silver'|'bronze'|null, q?: string,
 *   nearLat?: number|null, nearLon?: number|null }} params
 *   `categoryIds` — bir nechta yo'nalish: har biri alohida so'raladi, natija birlashtiriladi (takrorlarsiz)
 *   va bitta sahifada qaytadi (server bir nechta `category_id` ni qo'llamaydi).
 * @returns {Promise<{ items: ReturnType<mapWorker>[], total: number|null }>}
 */
export async function getWorkersPage({ categoryIds, ...rest } = {}) {
  if (categoryIds?.length > 1) return getWorkersUnion(categoryIds, rest);
  return getWorkersSingle({ ...rest, categoryId: categoryIds?.[0] ?? rest.categoryId });
}

async function getWorkersUnion(categoryIds, params) {
  const { page = 1, size: _size, ...filters } = params;
  if (page > 1) return { items: [], total: null };
  const byId = new Map();
  await Promise.all(
    categoryIds.map(async (categoryId) => {
      for (let p = 1; p <= UNION_MAX_PAGES; p += 1) {
        const res = await getWorkersSingle({
          ...filters,
          categoryId,
          page: p,
          size: UNION_PAGE_SIZE,
        });
        res.items.forEach((w) => byId.set(w.id, w));
        if (res.items.length < UNION_PAGE_SIZE) break;
      }
    })
  );
  const items = [...byId.values()].sort(UNION_SORTERS[filters.sort] ?? UNION_SORTERS.rating);
  return { items, total: items.length };
}

async function getWorkersSingle({
  page = 1,
  size = 5,
  categoryId,
  sort = 'rating',
  regionId,
  districtId,
  minRating,
  verifiedOnly,
  isOnline,
  badge,
  q,
  nearLat,
  nearLon,
  covers,
} = {}) {
  const params = [`sort=${sort}`, `page=${page}`, `size=${size}`];
  if (q?.trim()) params.push(`q=${encodeURIComponent(q.trim().slice(0, 100))}`);
  if (categoryId) params.push(`category_id=${categoryId}`);
  if (regionId) params.push(`region_id=${regionId}`);
  if (districtId) params.push(`district_id=${districtId}`);
  if (minRating) params.push(`min_rating=${minRating}`);
  if (verifiedOnly) params.push('is_verified=true');
  if (isOnline) params.push('is_online=true');
  if (badge) params.push(`badge=${badge}`);
  // `covers`: buyurtma yo'nalishlari (vergul bilan) — shularni bajaradigan ustalar.
  if (covers) params.push(`covers=${covers}`);
  if (nearLat != null && nearLon != null) params.push(`near_lat=${nearLat}`, `near_lon=${nearLon}`);
  const data = await request(`${ENDPOINTS.WORKERS}?${params.join('&')}`, {
    fallbackMessage: "Mutaxassislar ro'yxati yuklanmadi",
  });
  const items = data?.items ?? data ?? [];
  return {
    items: items.map(mapWorker),
    total: data?.pagination?.total ?? null,
  };
}

/**
 * @param {{ page?: number, size?: number }} params
 * @returns {Promise<ReturnType<mapWorker>[]>}
 */
export async function getFavorites({ page = 1, size = 10 } = {}) {
  const data = await request(ENDPOINTS.CUSTOMER_FAVORITES(page, size), {
    fallbackMessage: 'Sevimlilar yuklanmadi',
  });
  devLog('[getFavorites] /customers/me/favorites response:', data);
  return (data?.items ?? []).map(mapWorker);
}

/** Sevimli ustalar (jami soni bilan): `{ items, total }`. */
export async function getFavoritesPage({ page = 1, size = 20 } = {}) {
  const data = await request(ENDPOINTS.CUSTOMER_FAVORITES(page, size), {
    fallbackMessage: 'Sevimlilar yuklanmadi',
  });
  return {
    items: (data?.items ?? []).map(mapWorker),
    total: data?.pagination?.total ?? 0,
  };
}

/** Sevimli ustalar soni (sahifalashdagi `total`, faqat 1 ta element so'raladi). */
export async function getFavoritesCount() {
  const data = await request(ENDPOINTS.CUSTOMER_FAVORITES(1, 1), {
    fallbackMessage: 'Sevimlilar soni yuklanmadi',
  });
  return data?.pagination?.total ?? 0;
}

function mapWorkerCategory(c) {
  return {
    id: c.id,
    categoryId: c.category?.id ?? null,
    name: c.category?.name ?? 'Xizmat',
    isPrimary: !!c.is_primary,
    experience: c.experience_years,
    price: c.price != null ? formatPrice(c.price) : null,
    minPrice: c.min_price != null ? formatPrice(c.min_price) : null,
    currency: c.currency ?? 'UZS',
    isNegotiable: !!c.is_negotiable,
  };
}

function mapPortfolioItem(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    photo: p.photos?.[0] ?? null,
    photos: p.photos ?? [],
    rating: p.rating ?? null,
    comment: p.comment ?? '',
    workDate: p.work_date,
  };
}

function mapCertificate(c) {
  return {
    id: c.id,
    title: c.title,
    issuedBy: c.issued_by,
    issuedAt: c.issued_at,
    expiresAt: c.expires_at,
    category: c.category?.name ?? null,
  };
}

/** Backenddan kelgan ish kunini UI formatiga o'giradi */
function mapWorkDay(d) {
  return {
    id: d.id,
    name: d.name,
    workStart: d.work_start,
    workEnd: d.work_end,
  };
}

function mapSchedule(s) {
  if (!s) return null;
  return {
    workingDays: (s.working_days ?? []).map(mapWorkDay),
    daysOff: (s.days_off ?? []).map((d) => ({ id: d.id, name: d.name })),
    offDates: s.off_dates ?? [],
    timezone: s.timezone ?? null,
  };
}

/** Backenddan kelgan worker detail obyektini UI formatiga o'giradi */
export function mapWorkerDetail(w) {
  const mappedCategories = (w.categories ?? []).map(mapWorkerCategory);
  const primary = mappedCategories.find((c) => c.isPrimary) ?? mappedCategories[0] ?? null;
  const ratingBreakdown = w.rating_breakdown ?? null;

  return {
    ...mapWorkerExtras(w),
    id: w.id,
    name: `${w.first_name} ${w.last_name}`,
    initial: w.first_name?.[0]?.toUpperCase() ?? '?',
    color: AVATAR_COLORS[w.id % AVATAR_COLORS.length],
    profile_photo: w.profile_photo ?? null,
    bio: w.bio ?? '',
    trade: w.main_category?.name ?? primary?.name ?? '',
    profession: w.main_category?.name ?? primary?.name ?? '',
    mainCategoryId: w.main_category?.id ?? primary?.categoryId ?? null,
    location: [w.district, w.region].filter(Boolean).join(', '),
    rating: parseFloat(w.overall_rating ?? '0'),
    reliability_badge: w.reliability_badge ?? 'none',
    is_online: w.is_online ?? false,
    isIdentityVerified: !!w.is_identity_verified,
    experienceYears: w.experience_years ?? 0,
    vip_status: w.vip_status ?? 'none',
    acceptanceRate: w.acceptance_rate != null ? parseFloat(w.acceptance_rate) : null,
    repeatClientRate: w.repeat_client_rate != null ? parseFloat(w.repeat_client_rate) : null,
    avgResponseMin: w.avg_response_min ?? null,
    languages: (w.languages ?? [])
      .map((l) => (typeof l === 'string' ? l : l?.name))
      .filter(Boolean),
    // false — usta hozir buyurtma qabul qila olmaydi (bloklangan yoki telefoni tasdiqlanmagan).
    takesOrders: w.takes_orders !== false,
    reviewCount: w.review_count ?? 0,
    completedJobsCount: w.completed_jobs_count ?? 0,
    ratingBreakdown: ratingBreakdown && {
      5: ratingBreakdown.five ?? 0,
      4: ratingBreakdown.four ?? 0,
      3: ratingBreakdown.three ?? 0,
      2: ratingBreakdown.two ?? 0,
      1: ratingBreakdown.one ?? 0,
    },
    startingPrice: primary?.minPrice ?? primary?.price ?? '0',
    categories: mappedCategories,
    portfolio: (w.portfolio ?? []).map(mapPortfolioItem),
    certificates: (w.certificates ?? []).map(mapCertificate),
    schedule: mapSchedule(w.schedule),
    registeredAt: w.registered_at ?? null,
    // Ishlash hududi: radius (km) yoki alohida tumanlar ro'yxati.
    workAreaMode: w.work_area_mode ?? null,
    workRadiusKm: w.work_radius_km ?? null,
    workDistricts: (w.work_districts ?? [])
      .map((d) => (typeof d === 'string' ? d : d?.name))
      .filter(Boolean),
  };
}

/**
 * @param {number|string} workerId
 * @returns {Promise<ReturnType<mapWorkerDetail>>}
 */
export async function getWorkerById(workerId) {
  const data = await request(ENDPOINTS.WORKER_DETAIL(workerId), {
    fallbackMessage: "Mutaxassis ma'lumoti yuklanmadi",
  });
  devLog('[getWorkerById] /workers/{id} response:', data);
  return mapWorkerDetail(data);
}

/**
 * Ekrandagi ustalarning joriy holati (ko'pi bilan 100 ta id): `{ [id]: { availability, busyUntil, isOnline } }`.
 */
export async function getWorkersPresence(ids) {
  const unique = [...new Set(ids)].slice(0, 100);
  if (unique.length === 0) return {};
  const data = await request(ENDPOINTS.WORKER_PRESENCE(unique), {
    auth: false,
    fallbackMessage: 'Mutaxassislar holati yuklanmadi',
  });
  const map = {};
  for (const p of data ?? []) {
    map[p.id] = {
      availability: p.availability ?? null,
      busyUntil: p.busy_until ?? null,
      isOnline: !!p.is_online,
    };
  }
  return map;
}

/**
 * Ustaning keyingi kunlari: `{ hasSchedule, days: [{ day: 'YYYY-MM-DD', status, start, end }] }`.
 * `status`: open | full | off (server qiymatlari: bo'sh / to'la / dam).
 */
export async function getWorkerAvailability(workerId, days = 35) {
  const data = await request(ENDPOINTS.WORKER_AVAILABILITY(workerId, days), {
    fallbackMessage: "Mutaxassisning bo'sh kunlari yuklanmadi",
  });
  return {
    hasSchedule: !!data?.has_schedule,
    days: (data?.days ?? []).map((d) => ({
      day: d.day,
      status: d.status ?? null,
      start: d.start ?? null,
      end: d.end ?? null,
    })),
  };
}

/**
 * Xarita uzoqlashtirilganda viloyat/tuman bo'yicha ustalar soni.
 * @param {{ level?: 'region'|'district', regionId?: number|null, categoryId?: number|null,
 *   isOnline?: boolean, verifiedOnly?: boolean, minRating?: number|null, badge?: string|null, q?: string }} params
 */
export async function getMapClusters({
  level = 'region',
  regionId,
  categoryId,
  isOnline,
  verifiedOnly,
  minRating,
  badge,
  q,
} = {}) {
  const params = [`level=${level}`];
  if (regionId) params.push(`region_id=${regionId}`);
  if (categoryId) params.push(`category_id=${categoryId}`);
  if (isOnline) params.push('is_online=true');
  if (verifiedOnly) params.push('is_verified=true');
  if (minRating) params.push(`min_rating=${minRating}`);
  if (badge) params.push(`badge=${badge}`);
  if (q?.trim()) params.push(`q=${encodeURIComponent(q.trim().slice(0, 100))}`);
  const data = await request(`${ENDPOINTS.WORKER_MAP_CLUSTERS}?${params.join('&')}`, {
    auth: false,
    fallbackMessage: 'Xarita yuklanmadi',
  });
  return (data ?? [])
    .map((c) => ({
      name: c.name ?? '',
      workerCount: c.worker_count ?? 0,
      locatedCount: c.located_count ?? 0,
      latitude: c.latitude != null ? Number(c.latitude) : null,
      longitude: c.longitude != null ? Number(c.longitude) : null,
    }))
    .filter((c) => c.latitude != null && c.longitude != null);
}

/** O'tgan oyning "Tumanning eng yaxshi ustasi" g'oliblari: `{ period, winners }`. */
export async function getContestWinners({ limit = 12 } = {}) {
  const data = await request(ENDPOINTS.CONTEST_WINNERS(limit), {
    auth: false,
    fallbackMessage: "G'oliblar yuklanmadi",
  });
  return {
    period: data?.period ?? null,
    winners: (data?.winners ?? [])
      .filter((x) => x?.worker)
      .map((x) => ({
        period: x.period ?? data?.period ?? null,
        region: x.region ?? '',
        district: x.district ?? '',
        jobs: x.jobs ?? 0,
        rating: x.rating != null ? Number(x.rating) : null,
        worker: mapWorker(x.worker),
      })),
  };
}

// Shaxsiy sevimlilar (POST 201 / DELETE 200, ikkalasi idempotent). Ochiq "layk"
// (`/workers/{id}/like`) bilan aralashtirmang: u hammaga ko'rinadigan `likes_count`ni o'zgartiradi.
/**
 * @param {number|string} workerId
 */
export async function favoriteWorker(workerId) {
  await request(ENDPOINTS.CUSTOMER_FAVORITE(workerId), {
    method: 'POST',
    fallbackMessage: "Sevimlilarga qo'shib bo'lmadi",
  });
}

/**
 * @param {number|string} workerId
 */
export async function unfavoriteWorker(workerId) {
  await request(ENDPOINTS.CUSTOMER_FAVORITE(workerId), {
    method: 'DELETE',
    fallbackMessage: "Sevimlilardan olib tashlab bo'lmadi",
  });
}

/**
 * @param {number|string} workerId
 * @param {number|string|null} [categoryId]
 * @returns {Promise<ReturnType<mapCertificate>[]>}
 */
export async function getWorkerCertificates(workerId, categoryId) {
  const data = await request(ENDPOINTS.WORKER_CERTIFICATES(workerId, categoryId), {
    fallbackMessage: 'Sertifikatlar yuklanmadi',
  });
  devLog('[getWorkerCertificates] /workers/{id}/certificates response:', data);
  return (data ?? []).map(mapCertificate);
}

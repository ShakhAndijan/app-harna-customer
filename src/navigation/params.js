// Marshrut parametrlari faqat matn bo'lgani uchun ekranlararo uzatiladigan kichik obyektlar
// (usta, ish, buyurtma) JSON ko'rinishida `data` parametrida yuboriladi.
export const encodeParam = (value) => JSON.stringify(value ?? null);

export function decodeParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Ekranlarga o'tish uchun tayyor `href` obyektlari — manzillar shu yerda bitta joyda.
export const ustaRoute = (usta) => ({
  pathname: '/usta/[id]',
  params: { id: String(usta?.id ?? 'profil'), data: encodeParam(usta) },
});

export const workRoute = (work) => ({
  pathname: '/work',
  params: { data: encodeParam(work) },
});

export const orderRoute = (order) => ({
  pathname: '/order/[id]',
  params: { id: String(order?.id ?? 'buyurtma'), data: encodeParam(order) },
});

// Murojaatlar / takliflar (saytdagi kabinet "Murojaatlarim" va "Takliflarim").
export const supportRoute = (kind = 'question') => ({
  pathname: '/support',
  params: { kind: kind === 'suggestion' ? 'suggestion' : 'question' },
});

// Foydali maqola (sayt: /maqolalar/{slug}).
export const articleRoute = (slug) => ({ pathname: '/article/[slug]', params: { slug } });

// Usta haqida shikoyat yozish ekrani.
export const complaintRoute = ({ id, name }) => ({
  pathname: '/complaint',
  params: { workerId: String(id), name: name ?? '' },
});

// Hujjat sahifasi: 'about' (statik) | 'privacy' | 'terms' | 'consent' | 'delete-account' (backend /legal/{key}).
export const documentRoute = (key) => ({ pathname: '/document', params: { key } });

// Ochiq buyurtma (kutilmoqda / kelishilmoqda / jarayonda) jonli kuzatuv ekranida ochiladi,
// yopilgani (bajarilgan / bekor qilingan) — tafsilot ekranida.
export const requestRoute = (order) => ({
  pathname: '/request/[id]',
  params: { id: String(order?.id ?? '') },
});

// Yangi buyurtma yaratilgach: omonat kutayotgan (`awaiting_deposit`) buyurtma to'lov qadami bilan ochiladi,
// qolgani bosh sahifaga o'tadi (u yerda "Faol buyurtmalar"da ko'rinadi).
export const afterOrderCreatedRoute = (created) =>
  created?.raw?.status === 'awaiting_deposit' && created.id != null
    ? requestRoute({ id: created.id })
    : '/home';

const OPEN_STATUSES = ['awaiting_deposit', 'pending', 'accepted', 'active'];
export const orderOrRequestRoute = (order) =>
  OPEN_STATUSES.includes(order?.rawStatus) ? requestRoute(order) : orderRoute(order);

// Usta profilidan "Chaqirish": ustaga buyurtma berish oynasi (profil ustida ochiladi).
export const orderWorkerRoute = (worker) => ({
  pathname: '/order-worker',
  params: { worker: encodeParam(worker) },
});

// E'lonlar ro'yxati. `saved` — "Saqlanganlar" bo'limi ochiq holda; `workerId` — faqat shu usta e'lonlari.
export const listingsRoute = ({ saved, workerId, workerName } = {}) => ({
  pathname: '/listings',
  params: {
    ...(saved ? { saved: '1' } : {}),
    ...(workerId ? { workerId: String(workerId), workerName: workerName ?? '' } : {}),
  },
});

// Bitta e'lon. `data` (kartadagi tayyor ma'lumot) berilsa, to'liq javob kelguncha o'sha ko'rsatiladi.
export const listingRoute = (listing) => ({
  pathname: '/listing/[id]',
  params: { id: String(listing?.id ?? ''), data: encodeParam(listing) },
});

// E'lonlarni to'liq ekranda (Reels ko'rinishida) ochish. `listing` — bosilgani; `filters`/`saved` — u chiqqan ro'yxat,
// shu ro'yxat bo'yicha keyingi e'lonlarga surib o'tiladi.
export const reelsRoute = (listing, { filters, saved } = {}) => ({
  pathname: '/reels',
  params: {
    id: String(listing?.id ?? ''),
    data: encodeParam(listing),
    ...(filters ? { filters: encodeParam(filters) } : {}),
    ...(saved ? { saved: '1' } : {}),
  },
});

// `againFrom` — "Yana chaqirish": forma shu yakunlangan buyurtma ma'lumotlari bilan ochiladi.
export const newOrderRoute = (worker, againFrom) => ({
  pathname: '/new-order',
  params: {
    worker: encodeParam(worker),
    ...(againFrom != null ? { again: String(againFrom) } : {}),
  },
});

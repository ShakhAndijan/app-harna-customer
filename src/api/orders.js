import { ENDPOINTS } from '../constants/config';
import { request } from '../utils/request';
import { uploadImageToPresignedUrl } from './auth';

// Backend faqat shu turlarni qabul qiladi (POST /api/v1/orders/upload-url).
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT_TO_TYPE = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/**
 * Picker'dan kelgan mimeType yoki fayl kengaytmasidan ruxsat etilgan
 * content-type'ni aniqlaydi. Qo'llab-quvvatlanmasa (masalan HEIC) null qaytaradi.
 */
export function resolvePhotoContentType(uri, mimeType) {
  const mime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
  if (mime && ALLOWED_PHOTO_TYPES.includes(mime)) return mime;
  const ext = String(uri || '')
    .split('?')[0]
    .split('.')
    .pop()
    .toLowerCase();
  return EXT_TO_TYPE[ext] || null;
}

/**
 * Buyurtma rasmi uchun bitta presigned URL so'raydi (har bir rasmga alohida).
 * @returns {Promise<{ upload_url: string, temp_key: string, expires_in: number }>}
 */
export const requestOrderPhotoUpload = (contentType) =>
  request(ENDPOINTS.ORDER_UPLOAD_URL, {
    method: 'POST',
    body: { content_type: contentType },
    fallbackMessage: 'Rasm yuklash manzili olinmadi',
  });

/**
 * Bitta rasmni presigned URL orqali yuklab, `photo_temp_keys`ga qo'yiladigan
 * `temp_key`ni qaytaradi.
 */
export async function uploadOrderPhoto(uri, mimeType) {
  const contentType = resolvePhotoContentType(uri, mimeType);
  if (!contentType) {
    const e = new Error('UNSUPPORTED_PHOTO_TYPE');
    e.code = 'UNSUPPORTED_PHOTO_TYPE';
    throw e;
  }
  const { upload_url, temp_key } = await requestOrderPhotoUpload(contentType);
  await uploadImageToPresignedUrl(upload_url, uri, contentType);
  return temp_key;
}

// ─── Buyurtmalar tarixi ──────────────────────────────────────────

const AVATAR_COLORS = ['#2fa37a', '#e87a45', '#3f7fd4', '#ec4899', '#8b5cf6', '#f5c451', '#06b6d4'];
const PAGE_SIZE = 100; // backend maksimumi
const MAX_PAGES = 5;

// Backend holati → UI guruhi: kutilayotgan/qabul qilingan/jarayondagi buyurtmalar "active".
const STATUS_GROUP = {
  awaiting_deposit: 'active',
  pending: 'active',
  accepted: 'active',
  active: 'active',
  completed: 'done',
  cancelled: 'cancelled',
};

const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const getJson = (url, errorLabel) => request(url, { fallbackMessage: errorLabel });

// Kafolat murojaati holati: awaiting_worker | fixing | customer_check | disputed | fixed | refunded | rejected.
function mapGuarantee(g) {
  if (!g) return null;
  const c = g.claim;
  return {
    eligible: !!g.eligible,
    until: g.until ?? null,
    reason: g.reason ?? null,
    claim: c
      ? {
          status: c.status ?? null,
          description: c.description?.trim() || null,
          photos: Array.isArray(c.photos) ? c.photos : [],
          resolution: c.resolution ?? null,
          refundAmount: toNumber(c.refund_amount),
          refundMethod: c.refund_method ?? null,
          // Holatga mos javob muddati (saytdagi `li` funksiyasi).
          deadline:
            c.deadline ??
            (c.status === 'awaiting_worker'
              ? c.worker_answer_deadline
              : c.status === 'fixing'
                ? c.fix_deadline
                : c.status === 'customer_check'
                  ? c.customer_check_deadline
                  : null) ??
            null,
        }
      : null,
  };
}

// Qo'shimcha ish: status pending | approved | declined | lapsed | closed.
function mapExtra(x) {
  const note = x.description?.trim() || null;
  return {
    id: x.id,
    status: x.status ?? 'pending',
    // Sayt "ish nomi (izoh)" ko'rinishida ko'rsatadi.
    title: x.task_name && note ? `${x.task_name} (${note})` : (note ?? x.task_name ?? ''),
    price: toNumber(x.price),
    photoUrl: x.photo_url ?? null,
    deadline: x.deadline ?? null,
  };
}

// Omonat: `{ amount, status, due_at, reason, provider, paid_at, resolution, refunded_at }` yoki null.
function mapDeposit(d) {
  if (!d || typeof d !== 'object') return null;
  return {
    amount: d.amount ?? null,
    status: d.status ?? null,
    dueAt: d.due_at ?? null,
    reason: d.reason ?? null,
    provider: d.provider ?? null,
    paidAt: d.paid_at ?? null,
    resolution: d.resolution ?? null,
    refundedAt: d.refunded_at ?? null,
  };
}

/**
 * Backenddagi OrderOut / OrderDetailOut obyektini UI formatiga o'giradi.
 * Ikkala shakl ham qo'llab-quvvatlanadi (ro'yxat: worker_name/task_names,
 * tafsilot: worker{}/tasks[]/category{}).
 */
// Ustaning ish suratlari (13.11): `before` — oxirgi urinishning «oldin» to'plami, `after` — joriy urinishning
// «keyin» to'plami (mijoz shu bilan tasdiqlaydi), `rounds` — hammasi, eskisidan boshlab.
const urls = (v) => (Array.isArray(v) ? v.filter((u) => typeof u === 'string') : []);
export function mapWorkPhotos(w) {
  if (!w || typeof w !== 'object') return null;
  return {
    round: Number(w.round) || 1,
    before: urls(w.before),
    after: urls(w.after),
    rounds: (Array.isArray(w.rounds) ? w.rounds : []).map((r) => ({
      round: Number(r.round) || 1,
      before: urls(r.before),
      after: urls(r.after),
    })),
  };
}

export function mapOrder(o) {
  // Familiyasiz usta uchun server "Aziz " (oxirida bo'shliq) qaytarishi mumkin.
  const workerName = (o.worker_name ?? o.worker?.full_name)?.trim() || null;
  const workerPhoto = o.worker_photo ?? o.worker?.profile_photo ?? null;
  const workerId = o.worker_id ?? o.worker?.id ?? null;
  const taskNames = o.task_names ?? (o.tasks || []).map((t) => t.name);

  const hours = toNumber(o.estimated_hours);
  const hourlyRate = toNumber(o.hourly_rate);
  const agreed = toNumber(o.agreed_price);
  const budget = toNumber(o.budget);
  const computed = hourlyRate != null && hours != null ? hourlyRate * hours : null;

  let price = null;
  let priceKind = null;
  if (agreed != null) [price, priceKind] = [agreed, 'agreed'];
  else if (budget != null) [price, priceKind] = [budget, 'budget'];
  else if (computed != null) [price, priceKind] = [computed, 'estimate'];

  const description = (o.description || '').trim();

  return {
    id: o.id,
    rawStatus: o.status,
    status: STATUS_GROUP[o.status] || 'active',
    task: taskNames.join(', ') || description.split('\n')[0].slice(0, 80),
    categoryId: o.category_id ?? o.category?.id ?? null,
    categoryIds: o.task_category_ids?.length
      ? o.task_category_ids
      : (o.category_id ?? o.category?.id) != null
        ? [o.category_id ?? o.category?.id]
        : [],
    service: o.category?.name ?? null,
    // Ish nomlari (tavsifdan olingan qisqa matnsiz) va mijoz yozgan to'liq tavsif.
    taskNames: taskNames.join(', '),
    description,
    master: workerName,
    workerId,
    // Telefon raqamlar narx kelishilgach ochiladi (backend shu paytgacha `worker.phone`ni bermaydi).
    workerPhone: o.worker?.phone ?? o.worker_phone ?? null,
    contactPhone: o.contact_phone ?? null,
    backupPhone: o.backup_phone ?? null,
    masterPhoto: workerPhoto,
    letter: workerName ? workerName.trim()[0].toUpperCase() : '?',
    color: AVATAR_COLORS[(workerId ?? o.id) % AVATAR_COLORS.length],
    createdAt: o.created_at,
    address: [o.region, o.district, o.mahalla, o.location_landmark].filter(Boolean).join(', '),
    estimatedHours: hours,
    hourlyRate,
    priceMode: o.price_mode ?? null,
    // Qo'shimcha maydonlar: uskunalar kimniki ('customer' | 'worker'), ustaning yoshi oralig'i, qulay vaqt.
    toolsProvidedBy: o.tools_provided_by ?? null,
    workerAgeMin: toNumber(o.worker_age_min),
    workerAgeMax: toNumber(o.worker_age_max),
    preferredTime: o.preferred_time ?? null,
    // «O'zgarmas narx»: buyurtma berilganda qotirilgan, platforma belgilagan summa (null — kelishiladigan buyurtma).
    platformPrice: toNumber(o.platform_price),
    // Kelishuv bosqichi (ACCEPTED): kim qanday narx taklif qilgan va kelishilgan narx.
    offerPrice: toNumber(o.offer_price),
    offerBy: o.offer_by ?? null,
    agreedPrice: agreed,
    price,
    priceKind,
    paymentMethod: o.payment_method ?? null,
    paymentStatus: 'not_charged',
    beforePhotos: o.before_photos || [],
    afterPhotos: o.after_photos || [],
    workPhotos: mapWorkPhotos(o.work_photos),
    cancelReason: o.cancel_reason ?? null,
    // Omonat (14.11): mijozning o'z omonati (faqat o'z buyurtmalarida) va ustaga ko'rinadigan belgi.
    deposit: mapDeposit(o.deposit),
    depositHeld: !!o.deposit_held,
    // Kelishuv to'xtatilgach buyurtma mijozga qaytadi (PENDING + returned_at): boshqa ustaga yuborish yoki ommaga chiqarish mumkin.
    returnedAt: o.returned_at ?? null,
    returnedBy: o.returned_by ?? null,
    returnedWorkerId: o.returned_worker_id ?? null,
    returnedWorkerName: o.returned_worker_name?.trim() || null,
    returnedRecalled: !!o.returned_recalled,
    // Qaytarish sababi va muddat tugagani uchun avtomatik qaytarilganmi.
    returnedReason: o.returned_reason?.trim() || null,
    returnedLapsed: !!o.returned_lapsed,
    // Kim bekor qilgan (customer | worker | system) va asosiy sanalar.
    cancelledBy: o.cancelled_by ?? null,
    agreedAt: o.agreed_at ?? null,
    completedAt: o.completed_at ?? null,
    // "Tarix" (vaqt chizig'i) uchun: usta qabul qilgan va buyurtma bekor qilingan vaqtlar, e'lon.
    acceptedAt: o.accepted_at ?? null,
    cancelledAt: o.cancelled_at ?? null,
    // E'lon nomi va kodi: ro'yxatda tekis (`listing_title`, `listing_code`), tafsilotda `listing` ichida.
    listingTitle: (o.listing_title ?? o.listing?.title)?.trim() || null,
    listingCode: o.listing_code ?? o.listing?.code ?? null,
    // Smeta: ustaning ish/material qatorlari.
    estimate: (o.estimate ?? []).map((row) => ({
      name: row.name ?? '',
      qty: toNumber(row.qty),
      unit: row.unit ?? null,
      price: toNumber(row.price),
    })),
    // Saytdagi kelishuv jarayoni uchun: kelib chiqishi, muddatlar, sana va takliflar.
    origin: o.origin ?? null,
    offersCount: o.offers_count ?? 0,
    chooseUntil: o.choose_until ?? null,
    confirmUntil: o.confirm_until ?? null,
    completeUntil: o.complete_until ?? null,
    workerDoneAt: o.worker_done_at ?? null,
    workNotDoneLeft: o.work_not_done_left ?? null,
    offerDate: o.offer_date ?? null,
    scheduledDate: o.scheduled_date ?? null,
    // Usta kelish vaqti oralig'i: kelishilgan (`window_*`) va kelishuvdagi taklif (`offer_window_*`).
    windowStart: o.window_start ?? null,
    windowEnd: o.window_end ?? null,
    windowMinutes: o.window_minutes ?? null,
    offerWindowStart: o.offer_window_start ?? null,
    offerWindowEnd: o.offer_window_end ?? null,
    timingKind: o.timing_kind ?? null,
    // «Shoshilinch» (13.11): mijoz tanlagan yoki so'ralgan vaqt yaqin bo'lgani uchun server o'zi qo'ygan belgi.
    // Eski serverda faqat mijozning tanlovi (`timing_kind`) bor.
    isUrgent: o.is_urgent != null ? !!o.is_urgent : o.timing_kind === 'urgent',
    budget,
    reposted: !!o.reposted,
    // "Usta bog'lana olmadi" da'vosi (status: awaiting_customer | disputed | ...) va javob muddati.
    matchComplaint: o.match_complaint
      ? {
          id: o.match_complaint.id ?? null,
          status: o.match_complaint.status ?? null,
          note: o.match_complaint.note?.trim() || null,
          answerDeadline: o.match_complaint.answer_deadline ?? o.complaint_until ?? null,
          customerReached: o.match_complaint.customer_reached ?? null,
          // Shikoyat turi (no_contact | no_work): chatdagi tizim xabari matni shunga bog'liq.
          kind: o.match_complaint.kind ?? null,
        }
      : null,
    // Usta yetib kelgan vaqt va "Usta keldimi?" tekshiruvi (javob berish mumkinmi, muddat, holat).
    workerArrivedAt: o.worker_arrived_at ?? null,
    // Buyurtma pini (xaritadagi nuqta): usta yetib kelganda shu nuqta bilan solishtiriladi.
    gpsLat: o.gps_lat ?? null,
    gpsLng: o.gps_lng ?? null,
    arrivalCheck: o.arrival_check
      ? {
          canAnswer: !!o.arrival_check.can_answer,
          until: o.arrival_check.until ?? null,
          deadline: o.arrival_check.deadline ?? null,
          status: o.arrival_check.status ?? null,
          complaintId: o.arrival_check.complaint_id ?? null,
          resolution: o.arrival_check.resolution ?? null,
          answer: o.arrival_check.answer ?? null,
        }
      : null,
    // Kafolat: murojaat berish mumkinmi (`eligible`, `until`, `reason`) yoki mavjud murojaat holati.
    guarantee: mapGuarantee(o.guarantee),
    // Qo'shimcha ishlar: mijoz javobini kutayotgan taklif, tasdiqlanganlar yig'indisi va jami narx.
    pendingExtra: o.pending_extra ? mapExtra(o.pending_extra) : null,
    extras: Array.isArray(o.extras) ? o.extras.map(mapExtra) : [],
    extrasTotal: toNumber(o.extras_total) ?? 0,
    totalPrice:
      toNumber(o.total_price) ?? (agreed != null ? agreed + (toNumber(o.extras_total) ?? 0) : null),
    // Usta reytingi faqat tafsilot javobida (`worker{}`) keladi.
    workerRating: toNumber(o.worker?.overall_rating),
    workerReviewCount: o.worker?.review_count ?? null,
    workerBadge: o.worker?.reliability_badge ?? null,
    // Yakuniy izohlar: mijozniki (`customer_*`) va ustaniki (`worker_*`).
    customerFinalComment: o.customer_final_comment?.trim() || null,
    workerFinalComment: o.worker_final_comment?.trim() || null,
    // Mijoz ustaga baho berganmi (`customer_rated`/`customer_rating` — ustaning mijozga bahosi, bu yerga tegishli emas).
    workerRated: !!o.worker_rated,
    // Berilgan yulduzlar faqat ro'yxat javobida (`worker_rating`); tafsilotda yo'q, shuning uchun
    // kalit yo'q bo'lsa `{...ro'yxat, ...tafsilot}` birlashtirishda ro'yxatdagi qiymat saqlanadi.
    ...(o.worker_rating != null ? { givenRating: toNumber(o.worker_rating) } : {}),
  };
}

/**
 * Mijozning barcha buyurtmalari (yangisi birinchi). Backend sahifalab beradi,
 * shuning uchun to'liq ro'yxat yig'iladi (eng ko'pi bilan MAX_PAGES * PAGE_SIZE ta).
 */
export async function getMyOrders() {
  const all = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await getJson(
      ENDPOINTS.MY_ORDERS(PAGE_SIZE, page * PAGE_SIZE),
      'Buyurtmalar yuklanmadi'
    );
    all.push(...(batch || []));
    if (!batch || batch.length < PAGE_SIZE) break;
  }
  return all.map(mapOrder);
}

/** Eng so'nggi buyurtmalar (yangisidan eskisiga) — bosh sahifadagi qisqa ko'rinish uchun. */
export async function getRecentOrders(limit = 30) {
  const batch = await getJson(ENDPOINTS.MY_ORDERS(limit, 0), 'Buyurtmalar yuklanmadi');
  return (batch || []).map(mapOrder);
}

/** Buyurtma tafsiloti (to'lov holatisiz): ro'yxat javobida bo'lmagan maydonlar (masalan, tavsif) uchun. */
export async function getOrderBrief(orderId) {
  return mapOrder(await getJson(ENDPOINTS.ORDER_DETAIL(orderId), 'Buyurtma yuklanmadi'));
}

// to'lov holati backendda yo'q bo'lishi mumkin (null) — bu xato emas.
const PAYMENT_STATE_TO_UI = { paid: 'paid', refunded: 'refunded' };

/** Bitta buyurtma tafsiloti + to'lov holati. */
export async function getOrderDetail(orderId) {
  const [detail, payment] = await Promise.all([
    getJson(ENDPOINTS.ORDER_DETAIL(orderId), 'Buyurtma yuklanmadi'),
    getJson(ENDPOINTS.ORDER_PAYMENT(orderId), "To'lov yuklanmadi").catch(() => null),
  ]);
  const order = mapOrder(detail);
  order.paymentStatus = PAYMENT_STATE_TO_UI[payment?.state] || 'not_charged';
  order.paymentState = payment?.state ?? null;
  // pending | created | paid | cancelled | refunded. Faqat paid va refunded "to'langan/qaytarilgan";
  // qolgani (null, pending, cancelled, created) uchun to'lov formasi ochiq turadi.
  const cents = Number(payment?.amount_tiyin);
  order.paidAmount = Number.isFinite(cents) && cents > 0 ? cents / 100 : null;
  // refund_reason — operatorning mijozga matni (ixtiyoriy). Tizim haqi (fee_tiyin) mijozga tegishli emas.
  order.refundReason = payment?.refund_reason?.trim() || null;
  return order;
}

/**
 * "Yana chaqirish": yakunlangan buyurtma yangi buyurtma formasining boshlang'ich nuqtasi sifatida
 * (`GET /orders/{id}/again`). Narx, sana va telefon yo'q. Xatolar: 404 order_not_found,
 * 409 order_not_completed, 403 permission_denied.
 */
export async function getOrderAgain(orderId) {
  const d = await getJson(ENDPOINTS.ORDER_AGAIN(orderId), 'Buyurtma yuklanmadi');
  const coord = (v) => {
    const n = v == null || v === '' ? NaN : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    orderId: d.order_id ?? orderId,
    workerId: d.worker_id ?? null,
    categoryIds: Array.isArray(d.task_category_ids) ? d.task_category_ids : [],
    description: (d.description ?? '').trim(),
    workersNeeded: Number(d.workers_needed) > 0 ? Number(d.workers_needed) : 1,
    extraRequirements: d.extra_requirements ?? '',
    regionId: d.region?.id ?? null,
    districtId: d.district?.id ?? null,
    mahalla: d.mahalla ?? '',
    landmark: d.location_landmark ?? '',
    entrance: d.entrance ?? '',
    floor: d.floor ?? '',
    gpsLat: coord(d.gps_lat),
    gpsLng: coord(d.gps_lng),
    // Eski buyurtma rasmlari (URL, ko'pi bilan 10): qayta yuklanmaydi, `kept_photos` bilan yuboriladi.
    photos: Array.isArray(d.photos) ? d.photos.filter((u) => typeof u === 'string') : [],
  };
}

// 422 validatsiya xatolarining maydon nomlari ApiError xabariga request() ichida qo'shiladi.
export const createOrder = (payload, idempotencyKey) =>
  request(ENDPOINTS.ORDERS, {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    body: payload,
    fallbackMessage: 'Buyurtma yuborishda xatolik yuz berdi',
  });

// ─── Kelishuv: chat, narx taklifi, kelishish, bekor qilish ───────────

const postJson = (url, body, fallbackMessage) =>
  request(url, { method: 'POST', body, fallbackMessage });

// Chat xabari: sender_type 'customer' — mijozning o'zi (bu ilova mijoz uchun).
function mapChatMessage(m) {
  return {
    id: m.id,
    from: m.sender_type === 'customer' ? 'me' : m.sender_type,
    kind: m.kind,
    body: m.body ?? '',
    offerPrice: toNumber(m.offer_price),
    // Narx taklifi xabarida: ish sanasi va kelish vaqti oralig'i boshlanishi.
    offerDate: m.offer_date ?? null,
    offerWindowStart: m.offer_window_start ?? null,
    // Qo'shimcha ish taklifi xabarida (kind: 'extra'): buyurtmadagi `extras[]` elementi id'si.
    extraId: m.extra_id ?? null,
    at: m.created_at,
  };
}

/**
 * Buyurtma chati. Mijoz buyurtmadagi barcha ustalar bilan suhbatlarni ko'radi (ustalar navbat bilan
 * kelishadi); `isActive` — hozirgi usta.
 * @returns {Promise<{ threads: object[], unread: number, canSend: boolean }>}
 */
export function mapChat(data) {
  return {
    threads: (data?.threads ?? []).map((t) => ({
      workerId: t.worker_id ?? null,
      workerName: t.worker_name?.trim() || null,
      workerPhoto: t.worker_photo ?? null,
      isActive: !!t.is_active,
      // Boshqa tomon o'qigan oxirgi xabar id'si: shundan kichik/teng o'z xabarlarim "o'qildi" (✓✓).
      peerReadId: Number(t.peer_read_id) || 0,
      messages: (t.messages ?? []).map(mapChatMessage),
    })),
    unread: data?.unread ?? 0,
    canSend: data?.can_send !== false,
  };
}

export async function getOrderChat(orderId) {
  return mapChat(await getJson(ENDPOINTS.ORDER_CHAT(orderId), 'Chat yuklanmadi'));
}

/**
 * Xabar yuboradi; yangilangan butun chatni qaytaradi. `workerId` — usta hali tanlanmagan ommaviy
 * buyurtmada aynan shu taklif egasiga yozish uchun (tanlashdan oldin gaplashish).
 */
export async function sendOrderChat(orderId, body, workerId) {
  const payload = workerId != null ? { body, worker_id: workerId } : { body };
  return mapChat(await postJson(ENDPOINTS.ORDER_CHAT(orderId), payload, 'Xabar yuborilmadi'));
}

export const markOrderChatRead = (orderId) =>
  postJson(ENDPOINTS.ORDER_CHAT_READ(orderId), undefined, "Chat o'qilmadi");

/**
 * Narx (va ish sanasi "YYYY-MM-DD", ixtiyoriy kelish vaqti boshlanishi "HH:MM") taklif qiladi
 * yoki qarshi narx aytadi (ACCEPTED bosqichida).
 */
export const offerOrderPrice = (orderId, price, scheduledDate, windowStart) =>
  postJson(
    ENDPOINTS.ORDER_OFFER(orderId),
    {
      // Narxi platforma belgilagan buyurtmada narx yuborilmaydi: taklif faqat kun.
      ...(price != null ? { price } : {}),
      ...(scheduledDate ? { scheduled_date: scheduledDate } : {}),
      ...(windowStart ? { window_start: windowStart } : {}),
    },
    'Narx yuborilmadi'
  );

/** Kelish vaqti oralig'i sozlamalari (davomiylik, birinchi/oxirgi soat) — ommaviy, tokensiz. */
export const getOrderTiming = () => request(ENDPOINTS.SYSTEM_ORDER_TIMING, { auth: false });

/** Ustaning taklifini qabul qiladi: ACCEPTED → ACTIVE. */
export const agreeOrder = (orderId, scheduledDate) =>
  postJson(
    ENDPOINTS.ORDER_AGREE(orderId),
    scheduledDate ? { scheduled_date: scheduledDate } : undefined,
    'Kelishuv amalga oshmadi'
  );

/** Javob bermagan ustaga yuborilgan buyurtmani qaytarib oladi (PENDING). */
/**
 * Mijoz buyurtma pinini qo'yadi yoki to'g'rilaydi (usta yetib kelgani yozilguncha; undan keyin 409 `location_locked`).
 */
export const setOrderLocation = (orderId, lat, lng) =>
  postJson(
    ENDPOINTS.ORDER_LOCATION(orderId),
    { gps_lat: lat, gps_lng: lng },
    'Manzil nuqtasi yuborilmadi'
  );

export const recallOrder = (orderId) =>
  postJson(ENDPOINTS.ORDER_RECALL(orderId), undefined, 'Buyurtma qaytarib olinmadi');

/**
 * Bekor qilingan buyurtmani qayta e'lon qiladi. `payload`: { timing_kind?, scheduled_date?, budget? }.
 */
export const repostOrder = (orderId, payload) =>
  postJson(ENDPOINTS.ORDER_REPOST(orderId), payload ?? {}, "Buyurtma qayta e'lon qilinmadi");

/** Ish bajarilganini tasdiqlaydi (ACTIVE → COMPLETED); yakuniy izoh ixtiyoriy. */
export const completeOrder = (orderId, comment) =>
  postJson(
    ENDPOINTS.ORDER_COMPLETE(orderId),
    { agreed_price: null, comment: comment || null },
    'Buyurtma yakunlanmadi'
  );

/** "Ish hali bajarilmadi": ustaga xabar boradi, buyurtma o'z-o'zidan yakunlanmaydi. */
export const workNotDone = (orderId) =>
  postJson(ENDPOINTS.ORDER_WORK_NOT_DONE(orderId), undefined, 'Amal bajarilmadi');

/**
 * Mijozning "usta bog'lana olmadi" da'vosiga javobi: `reached` false — usta to'lovni qaytarib oladi,
 * true — operator hal qiladi. Bir marta (409 complaint_already_answered).
 */
export const answerMatchComplaint = (orderId, reached) =>
  postJson(ENDPOINTS.ORDER_COMPLAINT_ANSWER(orderId), { reached }, "Javob yuborib bo'lmadi");

// Ommaviy buyurtmaga kelgan takliflar (faqat PENDING, ustasiz buyurtma uchun).
function mapOffer(o) {
  const w = o.worker ?? {};
  return {
    id: o.id,
    status: o.status,
    price: toNumber(o.price),
    priceBy: o.price_by ?? null,
    offerDate: o.offer_date ?? null,
    windowStart: o.window_start ?? null,
    arrival: o.arrival ?? null,
    comment: o.comment ?? null,
    createdAt: o.created_at,
    worker: {
      id: w.id ?? null,
      name: (w.full_name ?? '').trim(),
      photo: w.profile_photo ?? null,
      verified: !!w.is_identity_verified,
      rating: toNumber(w.overall_rating),
      reviews: w.review_count ?? 0,
      jobs: w.completed_jobs ?? 0,
      experience: w.experience_years ?? 0,
    },
    // Taklif smetasi, brigada (id, nomi, a'zolar soni) va talabdan qaysi bandlar bajarilmagani.
    estimate: (o.estimate ?? []).map((row) => ({
      name: row.name ?? '',
      qty: toNumber(row.qty),
      unit: row.unit ?? null,
      price: toNumber(row.price),
    })),
    brigade: o.brigade
      ? { id: o.brigade.id, name: o.brigade.name, size: o.brigade.size ?? null }
      : null,
    unmet: (Array.isArray(o.unmet) ? o.unmet : [])
      .map((u) => (typeof u === 'string' ? u : (u?.label ?? u?.name ?? u?.code ?? null)))
      .filter(Boolean),
  };
}

export async function getOrderOffers(orderId) {
  const list = await getJson(ENDPOINTS.ORDER_OFFERS(orderId), 'Takliflar yuklanmadi');
  return (list || []).map(mapOffer);
}

/** Taklifni tanlaydi — usta kelishuvni tasdiqlashi kutiladi (buyurtma ACCEPTED bo'ladi). */
export const chooseOrderOffer = (orderId, offerId) =>
  postJson(ENDPOINTS.ORDER_OFFER_CHOOSE(orderId, offerId), undefined, 'Taklif tanlanmadi');

/** Ustaning taklifiga qarshi narx aytadi; usta shu taklifni tasdiqlasa, kelishuv tuziladi. */
export const repriceOrderOffer = (orderId, offerId, price) =>
  postJson(ENDPOINTS.ORDER_OFFER_PRICE(orderId, offerId), { price }, 'Narx yuborilmadi');

export const rejectOrderOffer = (orderId, offerId) =>
  postJson(ENDPOINTS.ORDER_OFFER_REJECT(orderId, offerId), undefined, 'Taklif rad etilmadi');

/** Kelishuvni rad etadi (sabab bilan): kelishuv to'xtaydi, buyurtma mijozga qaytadi. */
export const declineOrder = (orderId, reason) =>
  postJson(ENDPOINTS.ORDER_DECLINE(orderId), { reason }, 'Kelishuv rad etilmadi');

/** Qaytgan buyurtmani boshqa mutaxassisga yuboradi. */
export const sendOrderTo = (orderId, workerId) =>
  postJson(ENDPOINTS.ORDER_SEND_TO(orderId), { worker_id: workerId }, 'Buyurtma yuborilmadi');

/** Qaytgan buyurtmani umumiy ro'yxatga chiqaradi (mos ustalar narx taklif qiladi). */
export const publishOrder = (orderId) =>
  postJson(ENDPOINTS.ORDER_PUBLISH(orderId), undefined, "Buyurtma ro'yxatga chiqarilmadi");

export const cancelOrderByCustomer = (orderId, reason) =>
  postJson(ENDPOINTS.ORDER_CANCEL(orderId), { reason }, 'Buyurtma bekor qilinmadi');

/** Yopilgan buyurtmaga keyinroq yakuniy izoh qo'shadi (bir marta; 409 final_comment_already_set). */
export const addFinalComment = (orderId, comment) =>
  postJson(ENDPOINTS.ORDER_FINAL_COMMENT(orderId), { comment }, "Izoh yuborib bo'lmadi");

// ─── Ish bosqichlari ─────────────────────────────────────────────────

function mapStage(st) {
  const confirmed = !!st.confirmed_at || st.status === 'confirmed';
  const done = !confirmed && (st.status === 'done' || !!st.done_at);
  return {
    id: st.id,
    position: st.position ?? 0,
    title: st.title ?? '',
    note: st.note?.trim() || null,
    amount: toNumber(st.amount),
    state: confirmed ? 'confirmed' : done ? 'done' : 'waiting',
    doneAt: st.done_at ?? null,
    confirmedAt: st.confirmed_at ?? null,
  };
}

export async function getOrderStages(orderId) {
  const list = await getJson(ENDPOINTS.ORDER_STAGES(orderId), 'Bosqichlar yuklanmadi');
  return (list || []).map(mapStage).sort((a, b) => a.position - b.position);
}

/** Usta bajarilgan deb belgilagan bosqichni tasdiqlaydi (409 stage_not_done). */
export const confirmOrderStage = (orderId, stageId) =>
  postJson(ENDPOINTS.ORDER_STAGE_CONFIRM(orderId, stageId), undefined, 'Bosqich tasdiqlanmadi');

/**
 * Ustaning qo'shimcha ish taklifiga javob: `approve` true — narxga qo'shiladi, false — narx o'zgarmaydi.
 * Muddat o'tgan bo'lsa 409 (extra_lapsed | extra_not_pending | extra_not_found).
 */
export const decideOrderExtra = (orderId, extraId, approve) =>
  postJson(ENDPOINTS.ORDER_EXTRA_DECISION(orderId, extraId), { approve }, 'Javob yuborilmadi');

/**
 * "Usta keldimi?" savoliga javob: `on_time` (vaqtida) | `late` (kechikib) | `no_show` (kelmadi —
 * ustaga xabar ketadi, tasdiqlansa buyurtma bekor qilinadi).
 */
export const answerArrivalCheck = (orderId, answer) =>
  postJson(ENDPOINTS.ORDER_ARRIVAL_CHECK(orderId), { answer }, 'Javob yuborilmadi');

/** Kafolat bo'yicha murojaat: nima noto'g'ri bajarilgani (1–1000 belgi) va rasmlar (`temp_key`lar). */
export const fileGuaranteeClaim = (orderId, description, photoKeys = []) =>
  postJson(
    ENDPOINTS.ORDER_GUARANTEE_CLAIM(orderId),
    { description, photo_temp_keys: photoKeys },
    'Murojaat yuborilmadi'
  );

/** Usta "tuzatdim" degach mijoz javobi: `fixed` true — tuzatildi, false — operatorga o'tadi. */
export const checkGuaranteeFix = (orderId, fixed) =>
  postJson(ENDPOINTS.ORDER_GUARANTEE_CHECK(orderId), { fixed }, 'Javob yuborilmadi');

// ─── Onlayn to'lov ───────────────────────────────────────────────────

const DEFAULT_PAY_MIN = 1000;
const DEFAULT_PAY_MAX = 10000000;

const providerId = (p) => (typeof p === 'string' ? p : (p?.id ?? p?.provider ?? p?.code));

// Payme birinchi, qolganlari alifbo tartibida.
const sortProviders = (list) =>
  [...list].sort((a, b) => (a === 'payme' ? -1 : b === 'payme' ? 1 : a.localeCompare(b)));

// Chegara o'nlik satr ("1000"); yo'q yoki musbat bo'lmasa standart qiymat.
const limit = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * Ochiq `GET /payments/providers`. Ish uchun to'lovda `order_providers` ishlatiladi (onlayn ish
 * to'lovi o'chiq bo'lsa [] — hamyon to'ldirish ishlab tursa ham `providers` bo'sh emas). Maydon
 * faqat eski serverda bo'lmaydi: shundagina `providers` ga qaytiladi.
 * @returns {Promise<{ providers: string[], minAmount: number, maxAmount: number }>}
 */
export async function getPaymentProviders() {
  const data = await request(ENDPOINTS.PAYMENT_PROVIDERS, { auth: false });
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.order_providers)
      ? data.order_providers
      : (data?.providers ?? []);
  const depositRaw = Array.isArray(data?.deposit_providers) ? data.deposit_providers : [];
  return {
    providers: sortProviders(raw.map(providerId).filter(Boolean)),
    minAmount: limit(data?.min_amount, DEFAULT_PAY_MIN),
    maxAmount: limit(data?.max_amount, DEFAULT_PAY_MAX),
    // Omonat uchun to'lov tizimlari (eski serverda yo'q: omonat taklif qilinmaydi) va uning yoqilgani.
    depositProviders: sortProviders(depositRaw.map(providerId).filter(Boolean)),
    depositEnabled: data?.deposit_enabled !== false,
    // Serverning tizim nomlari: `{ payme: 'Payme', ... }`.
    labels: data?.labels && typeof data.labels === 'object' ? data.labels : {},
    // Harna kafolati: server yoqqan bo'lsa to'lov kartasida eslatma; `cap` — eng ko'p qaytariladigan summa.
    guaranteeEnabled: data?.guarantee_enabled === true,
    guaranteeCap: Math.floor(Number(data?.guarantee_cap ?? 0)) || 0,
  };
}

/**
 * Bajarilgan buyurtma uchun to'lov yaratadi; `checkout_url` — brauzerda ochiladigan to'lov sahifasi
 * (409 order_payments_off / order_not_completed / order_already_paid / payment_in_progress). `fee_tiyin` mijozga ko'rsatilmaydi.
 */
export async function createOrderPayment(orderId, { amountUzs, provider, locale }) {
  const body = { amount_uzs: Math.round(amountUzs) };
  if (provider) body.provider = provider;
  if (locale) body.locale = locale;
  body.return_to = 'app';
  const data = await postJson(ENDPOINTS.ORDER_PAYMENT(orderId), body, "To'lov boshlanmadi");
  return {
    id: data?.id ?? null,
    checkoutUrl: data?.checkout_url ?? null,
    state: data?.state ?? null,
  };
}

// ─── Omonat (tanlab olinadigan) ──────────────────────────────────────

/**
 * `GET /orders/deposit-requirement`: hozir berilgan buyurtma omonat kutadimi. `required` omonat
 * o'chiq yoki hech bir to'lov tizimi qabul qilmasa false. Maydonlar: `amount` (so'm, satr), `reason`
 * (`marks` | `admin`), `marks`, `window_days`, `threshold`, `payment_minutes`, `providers`.
 */
export const getDepositRequirement = () =>
  request(ENDPOINTS.ORDER_DEPOSIT_REQUIREMENT, {
    fallbackMessage: 'Omonat holati yuklanmadi',
  });

/**
 * `awaiting_deposit` buyurtma uchun omonat to'lov sahifasi (`return_to: 'app'`). Javob:
 * `{ checkout_url, deposit }`. Xatolar: 400 `deposit_provider_unsupported`; 409 `deposit_not_required`,
 * `deposit_already_paid`, `deposit_off`, `deposit_expired`; 404 `order_not_found`.
 */
export const payOrderDeposit = (orderId, provider, locale) =>
  request(ENDPOINTS.ORDER_DEPOSIT_PAY(orderId), {
    method: 'POST',
    body: { provider, locale, return_to: 'app' },
    fallbackMessage: "To'lov boshlanmadi",
  });

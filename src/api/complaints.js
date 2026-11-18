import { ENDPOINTS } from '../constants/config';
import { request } from '../utils/request';

// Shikoyat sabablari (backend `ComplaintReason`). Matnlari i18n `complaints.reasons.*` da.
export const COMPLAINT_REASONS = [
  'no_show',
  'poor_quality',
  'overcharge',
  'rude',
  'fraud',
  'other',
];

// Shikoyat matnining eng ko'p uzunligi (backend `maxLength`).
export const COMPLAINT_MAX_LENGTH = 1000;

const mapComplaint = (c) => ({
  id: c.id,
  status: c.status, // pending | approved | rejected | withdrawn
  reason: c.reason,
  body: c.body ?? '',
  createdAt: c.created_at ?? null,
  decidedAt: c.decided_at ?? null,
  adminNote: c.admin_note ?? null, // rad etilganda sababi
  reply: c.reply ?? null, // usta javobi
  repliedAt: c.replied_at ?? null,
  workerId: c.worker_id,
  workerName: (c.worker_name ?? '').trim(),
  orderId: c.order_id,
  orderCode: c.order_code ?? '',
});

/** Ustaning e'lon qilingan shikoyatlari (ochiq; yozgan odam ko'rinmaydi): `{ items, total }`. */
export async function getWorkerComplaints(workerId, { page = 1, size = 10 } = {}) {
  const data = await request(ENDPOINTS.WORKER_COMPLAINTS(workerId, page, size), {
    auth: false,
    fallbackMessage: 'Shikoyatlar yuklanmadi',
  });
  return {
    items: (data?.items ?? []).map((c) => ({
      id: c.id,
      reason: c.reason,
      body: c.body ?? '',
      category: c.category ?? null,
      createdAt: c.created_at ?? null,
      publishedAt: c.published_at ?? null,
      reply: c.reply ?? null,
      repliedAt: c.replied_at ?? null,
    })),
    total: data?.pagination?.total ?? 0,
  };
}

/**
 * Mijozning shu usta bilan buyurtmalari, ular bo'yicha shikoyat yozish mumkin (suhbatgacha yetganlari).
 * Bo'sh ro'yxat — birga ishlamagan. `complaintStatus` — shu buyurtma bo'yicha allaqachon yozilgan shikoyat holati.
 */
export async function getComplaintOptions(workerId) {
  const data = await request(ENDPOINTS.WORKER_COMPLAINT_OPTIONS(workerId), {
    fallbackMessage: 'Buyurtmalar yuklanmadi',
  });
  return (data?.orders ?? []).map((o) => ({
    orderId: o.order_id,
    code: o.code ?? '',
    status: o.status,
    title: o.title ?? '',
    createdAt: o.created_at ?? null,
    complaintStatus: o.complaint_status ?? null,
  }));
}

/**
 * Shikoyat yuboradi; admin tasdiqlamaguncha hech qayerda ko'rinmaydi.
 * 409 `complaint_order_not_eligible` | `complaint_exists`, 400 `complaint_contains_*` (matnda aloqa ma'lumoti).
 */
export async function createComplaint(workerId, { orderId, reason, body }) {
  const data = await request(ENDPOINTS.WORKER_COMPLAINT_CREATE(workerId), {
    method: 'POST',
    body: { order_id: orderId, reason, body },
    fallbackMessage: 'Shikoyatni yuborib bo‘lmadi',
  });
  return mapComplaint(data);
}

/** Mijozning o'z shikoyatlari (yangisi birinchi): `{ items, total }`. */
export async function getMyComplaints({ page = 1, size = 20 } = {}) {
  const data = await request(ENDPOINTS.MY_COMPLAINTS(page, size), {
    fallbackMessage: 'Shikoyatlar yuklanmadi',
  });
  return { items: (data?.items ?? []).map(mapComplaint), total: data?.pagination?.total ?? 0 };
}

/** Shikoyatni qaytarib oladi (kutayotgan yoki e'lon qilingan; e'lon qilingani profildan ketadi). */
export async function withdrawComplaint(id) {
  const data = await request(ENDPOINTS.MY_COMPLAINT_WITHDRAW(id), {
    method: 'POST',
    body: {},
    fallbackMessage: 'Shikoyatni qaytarib bo‘lmadi',
  });
  return mapComplaint(data);
}

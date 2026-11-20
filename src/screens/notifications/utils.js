import { supportRoute } from '../../navigation/params';
import { formatDate, formatNumber } from '../../utils/format';
import { DEPOSIT_UNPAID, FORFEIT_RESOLUTIONS, depositAmount } from '../deposit/utils';
import { clockLabel, formatDeadline } from '../requests/utils';

// Backend dasturchisining `notificationText.ts` mantig'i (matn kaliti + o'zgaruvchilar) va sayt matnlari
// (`notifTypesWeb.*`, ya'ni `notifications.type.*`). Mijozga mos maxsus matn bo'lsa o'sha, bo'lmasa umumiy.

const COMPLAINT_NO_CONTACT = 'complaint_no_contact';
const COMPLAINT_NO_WORK = 'complaint_no_work';
const WORKER_NO_SHOW = 'worker_no_show';
const GUARANTEE_DISPUTE_ROWS = ['worker_refused', 'worker_silent', 'fix_overdue'];
const BRAND = 'Harna';

const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

// «Qo'shimcha ish» qatori ishi va summasini aytadimi.
function extraNamed(p) {
  const price = Number(p?.price);
  return nonEmpty(p?.description) && p?.price != null && Number.isFinite(price) && price > 0;
}

// Qator soat yoki kunni aytadi: noldan katta son (hech qachon ha/yo'q emas).
const counted = (v) => typeof v !== 'boolean' && Number(v) > 0;

// Mijozning `order.deposit` qatori: omonat qaysi holatda (summa yoki to'lov muddati bo'lmasa — oddiy so'zlar).
function depositKey(p) {
  const sum = depositAmount(p.amount) != null;
  switch (p.status) {
    case 'pending':
      return sum && nonEmpty(p.due_at) ? 'order.deposit_pending' : 'order.deposit_pending_plain';
    case 'held':
      return 'order.deposit_held';
    case 'refund_due':
      return sum ? 'order.deposit_refund_due' : 'order.deposit_refund_due_plain';
    case 'refunded':
      return sum ? 'order.deposit_refunded' : 'order.deposit_refunded_plain';
    case 'forfeited':
      return FORFEIT_RESOLUTIONS.includes(p.resolution)
        ? `order.deposit_forfeited_${p.resolution}`
        : 'order.deposit_forfeited';
    case 'void':
      return p.resolution === 'waived' ? 'order.deposit_waived' : 'fallback';
    default:
      return 'fallback';
  }
}

// «Harna kafolati»: bosqich, yuk bilan aniqlashtirilgan; raqam bo'lmasa oddiy so'zlar.
function guaranteeKey(n) {
  const p = n.payload ?? {};
  switch (n.type) {
    case 'guarantee.claim':
    case 'guarantee.filed':
    case 'guarantee.fix_reported':
      return counted(p.hours) ? n.type : `${n.type}_plain`;
    case 'guarantee.fixing':
      return counted(p.days) ? n.type : `${n.type}_plain`;
    case 'guarantee.checked':
      if (p.by_silence === true) return 'guarantee.checked_silence';
      if (p.fixed === true) return 'guarantee.checked_fixed';
      if (p.fixed === false) return 'guarantee.checked_not_fixed';
      return n.type;
    case 'guarantee.disputed':
      return GUARANTEE_DISPUTE_ROWS.includes(p.reason) ? `guarantee.disputed_${p.reason}` : n.type;
    case 'guarantee.decided':
      if (p.verdict === 'worker') return 'guarantee.decided_worker';
      if (p.verdict === 'customer') {
        return Number(p.refund_amount) > 0
          ? 'guarantee.decided_customer'
          : 'guarantee.decided_customer_plain';
      }
      return n.type;
    default:
      return n.type;
  }
}

export function notificationKey(n) {
  const p = n.payload ?? {};
  const free = !(Number(p.fee) > 0);
  const reason = typeof p.reason === 'string' ? p.reason : null;

  if (n.type.startsWith('guarantee.')) return guaranteeKey(n);
  if (n.type === 'order.deposit') return depositKey(p);
  if (n.type === 'wallet.deposit_forfeit') {
    return depositAmount(p.amount) != null ? n.type : 'wallet.deposit_forfeit_plain';
  }

  switch (n.type) {
    case 'offer.rejected':
      return free ? 'offer.rejected_free' : 'offer.rejected';
    case 'offer.expired':
      return [
        'too_old',
        'date_passed',
        'customer_blocked',
        'worker_blocked',
        'worker_phone_unverified',
      ].includes(reason)
        ? `offer.expired_${reason}`
        : n.type;
    case 'order.returned':
      if (p.recalled) return 'order.returned_recalled';
      if (p.lapsed) {
        return `order.returned_lapsed_by_${p.by === 'customer' ? 'customer' : 'worker'}${free ? '' : '_fee'}`;
      }
      return `order.returned${free ? '' : '_fee'}`;
    case 'order.completed':
      return p.auto ? 'order.completed_auto' : n.type;
    case 'order.message':
      return Number(p.count) > 1 ? 'order.message_many' : n.type;
    case 'order.digest':
      return Number(p.count) === 1 ? 'order.digest_one' : n.type;
    case 'order.negotiation_ended':
      return free ? n.type : 'order.negotiation_ended_fee';
    case 'order.cancelled':
      if (reason === DEPOSIT_UNPAID) return 'order.deposit_unpaid';
      if (reason === COMPLAINT_NO_CONTACT) {
        return free ? 'order.complaint_no_contact' : 'order.complaint_no_contact_fee';
      }
      if (reason === COMPLAINT_NO_WORK) {
        return free ? 'order.complaint_no_work' : 'order.complaint_no_work_fee';
      }
      if (reason === WORKER_NO_SHOW) {
        return Number(p.fee_kept) > 0 ? 'order.worker_no_show_fee' : 'order.worker_no_show';
      }
      if (reason?.startsWith('auto_closed_')) return `order.${reason}`;
      return free ? n.type : 'order.cancelled_fee';
    case 'order.arrived':
      return typeof p.arrived_at === 'string' ? n.type : 'order.arrived_plain';
    case 'order.extra':
      return extraNamed(p) ? n.type : 'order.extra_plain';
    case 'order.extra_decided':
      if (p.status === 'approved') {
        return extraNamed(p)
          ? 'order.extra_decided_approved'
          : 'order.extra_decided_approved_plain';
      }
      if (p.status === 'declined' || p.status === 'lapsed')
        return `order.extra_decided_${p.status}`;
      return n.type;
    case 'order.reminder':
      if (p.kind === 'job_day') {
        return nonEmpty(p.window) ? 'order.reminder_job_day' : 'order.reminder_job_day_plain';
      }
      if (p.kind === 'arrival_check' && !nonEmpty(p.window)) {
        return 'order.reminder_arrival_check_plain';
      }
      return typeof p.kind === 'string' ? `order.reminder_${p.kind}` : n.type;
    case 'order.new':
      return p.realert ? 'order.new_realert' : n.type;
    case 'match.no_show':
      return Number(p.hours) > 0 ? n.type : 'match.no_show_plain';
    case 'match.no_show_disputed':
      return p.by_arrival === true ? 'match.no_show_disputed_arrival' : n.type;
    case 'match.complaint':
      return p.kind === 'no_work' ? 'match.complaint_no_work' : n.type;
    case 'match.complaint_rejected':
      return Number(p.fee_kept) > 0 ? 'match.complaint_rejected_fee' : n.type;
    case 'offer.not_chosen':
    case 'offer.unanswered':
    case 'offer.customer_unanswered':
      return free ? `${n.type}_free` : n.type;
    case 'offer.lapsed':
      return Number(p.offers_left) > 0 ? 'offer.lapsed' : 'offer.lapsed_none';
    case 'offer.declined': {
      const base = p.lapsed ? 'offer.declined_unanswered' : 'offer.declined';
      return Number(p.offers_left) > 0 ? base : `${base}_none`;
    }
    default:
      return n.type;
  }
}

// Matn ichidagi {amount}, {due_at}, {time}, {window}, {hours}, {price}… o'zgaruvchilar.
function notificationVars(n, tr) {
  const p = n.payload ?? {};
  const money = (v) =>
    `${formatNumber(Math.round(Number(v ?? 0)) || 0)} ${tr('common.currencySom')}`;
  if (n.type === 'order.deposit' || n.type === 'wallet.deposit_forfeit') {
    return {
      amount: depositAmount(p.amount) ?? '',
      due_at: nonEmpty(p.due_at) ? formatDeadline(tr, p.due_at) || '' : '',
    };
  }
  if (n.type.startsWith('bonus.') || n.type.startsWith('wallet.')) {
    return { amount: money(p.amount), friend: String(p.friend ?? '') };
  }
  switch (n.type) {
    case 'order.repeat_reminder':
      return { category: String(p.category ?? '') };
    case 'order.arrived':
      return { time: typeof p.arrived_at === 'string' ? clockLabel(p.arrived_at) : '' };
    case 'order.reminder':
      return { window: typeof p.window === 'string' ? p.window : '' };
    case 'match.no_show':
      return { hours: Number(p.hours ?? 0) };
    case 'order.extra':
    case 'order.extra_decided':
      return {
        description: String(p.description ?? ''),
        price: formatNumber(Math.round(Number(p.price ?? 0)) || 0),
      };
    case 'order.message':
    case 'order.digest':
      return { count: Number(p.count ?? 1) };
    case 'order.stage_done':
    case 'order.stage_confirmed':
      return {
        brigade: String(p.brigade ?? ''),
        worker: String(p.worker ?? ''),
        stage: String(p.stage ?? ''),
      };
    case 'verification.expiring':
      return { date: nonEmpty(p.valid_until) ? formatDate(`${p.valid_until}T12:00:00`) : '' };
    default:
      break;
  }
  if (n.type.startsWith('guarantee.')) {
    return {
      hours: Number(p.hours ?? 0),
      days: Number(p.days ?? 0),
      refund_amount: formatNumber(Math.round(Number(p.refund_amount ?? 0)) || 0),
    };
  }
  return undefined;
}

/** Jamoa xabari: sarlavhasi va matni. */
function adminMessage(n) {
  if (n.type !== 'admin.message') return null;
  const p = n.payload ?? {};
  return {
    title: nonEmpty(p.title) ? p.title : null,
    body: typeof p.body === 'string' ? p.body : '',
  };
}

export function notificationText(n, tr) {
  const admin = adminMessage(n);
  if (admin) return admin.title ?? tr('notifTypesWeb.adminTitle', { brand: BRAND });
  const key = notificationKey(n);
  const vars = { ...(notificationVars(n, tr) ?? {}), brand: BRAND };
  for (const path of [
    `notifTypesWeb.customer.${key}`,
    `notifTypes.customer.${key}`,
    `notifTypesWeb.${key}`,
    `notifTypes.${key}`,
  ]) {
    const v = tr(path, vars);
    if (typeof v === 'string' && v !== path) return v;
  }
  return tr('notifTypes.fallback');
}

/** "#A1B2 · Sarlavha" ko'rinishidagi qo'shimcha qator (bo'lsa); jamoa xabarida — uning matni. */
export function notificationDetail(n) {
  const admin = adminMessage(n);
  if (admin) return admin.body || null;
  const p = n.payload ?? {};
  const code = typeof p.order_code === 'string' ? p.order_code : null;
  const title = typeof p.title === 'string' ? p.title : null;
  return [code ? `#${code}` : null, title].filter(Boolean).join(' · ') || null;
}

/** Bosilganda ochiladigan ekran: expo-router `href` (string yoki obyekt). */
export function notificationHref(n) {
  const p = n.payload ?? {};
  if (n.type === 'support.answered') return supportRoute(p.kind);
  // MyID tasdiqlash tugashi/bekor qilinishi va eski qo'lda tasdiqlash: hammasi tasdiqlash ekraniga.
  if (n.type.startsWith('verification.')) return '/verify-identity';
  // Takroriy eslatma: yakunlangan buyurtma ma'lumotlari bilan to'ldirilgan yangi buyurtma formasi.
  if (n.type === 'order.repeat_reminder' && p.order_id != null) {
    return { pathname: '/new-order', params: { again: String(p.order_id) } };
  }
  if (n.type === 'listing.commented' || n.type === 'listing.replied') {
    return typeof p.listing_id === 'number'
      ? { pathname: '/listing/[id]', params: { id: String(p.listing_id) } }
      : '/listings';
  }
  if (n.type === 'complaint.removed') return '/my-complaints';
  const orderId = p.order_id;
  // Usta manzil nuqtasini so'radi: buyurtma ochiladi, pin kartasi yorqin turadi.
  if (orderId != null && n.type === 'order.location_request') {
    return { pathname: '/request/[id]', params: { id: String(orderId), pin: '1' } };
  }
  if (orderId != null && /^(order|offer|match|guarantee)\./.test(n.type)) {
    const closed = n.type === 'order.completed' || n.type === 'order.cancelled';
    return closed
      ? { pathname: '/order/[id]', params: { id: String(orderId) } }
      : { pathname: '/request/[id]', params: { id: String(orderId) } };
  }
  return '/orders';
}

/** Bildirishnoma oynasidagi tugma matnining i18n kaliti; ochiladigan aniq ekran bo'lmasa — null. */
export function notificationAction(n) {
  const p = n.payload ?? {};
  if (n.type === 'support.answered') return 'notifList.openAnswer';
  if (n.type.startsWith('verification.')) return 'notifList.openVerify';
  if (n.type === 'order.repeat_reminder' && p.order_id != null) return 'notifList.openAgain';
  if (n.type === 'listing.commented' || n.type === 'listing.replied')
    return 'notifList.openListing';
  if (n.type === 'complaint.removed') return 'notifList.openComplaints';
  if (p.order_id != null && /^(order|offer|match|guarantee)\./.test(n.type)) {
    return 'notifList.openOrder';
  }
  return null;
}

export function notificationDate(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return '—';
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

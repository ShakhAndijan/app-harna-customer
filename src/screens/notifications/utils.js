import { supportRoute } from '../../navigation/params';

// Sayt (dev.harna.uz) bildirishnomalarining matn kaliti va yo'nalishi bilan bir xil mantiq.
// `type` + `payload` dan i18n kaliti (`notifTypes.*`) tanlanadi: mijoz uchun maxsus matn bo'lsa o'sha, bo'lmasa umumiy.

export function notificationKey(n) {
  const p = n.payload ?? {};
  const free = !(Number(p.fee) > 0);
  const reason = typeof p.reason === 'string' ? p.reason : null;

  switch (n.type) {
    case 'offer.rejected':
      return free ? 'offer.rejected_free' : 'offer.rejected';
    case 'offer.expired':
      return ['too_old', 'date_passed', 'customer_blocked', 'worker_blocked'].includes(reason)
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
    case 'order.negotiation_ended':
      return free ? n.type : 'order.negotiation_ended_fee';
    case 'order.cancelled':
      if (reason?.startsWith('auto_closed_')) return `order.${reason}`;
      return free ? n.type : 'order.cancelled_fee';
    case 'order.reminder':
      return typeof p.kind === 'string' ? `order.reminder_${p.kind}` : n.type;
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

export function notificationText(n, tr) {
  const key = notificationKey(n);
  for (const path of [`notifTypes.customer.${key}`, `notifTypes.${key}`]) {
    const v = tr(path);
    if (typeof v === 'string' && v !== path) return v;
  }
  return tr('notifTypes.fallback');
}

/** "#A1B2 · Sarlavha" ko'rinishidagi qo'shimcha qator (bo'lsa). */
export function notificationDetail(n) {
  const p = n.payload ?? {};
  const code = typeof p.order_code === 'string' ? p.order_code : null;
  const title = typeof p.title === 'string' ? p.title : null;
  return [code ? `#${code}` : null, title].filter(Boolean).join(' · ') || null;
}

/** Bosilganda ochiladigan ekran: expo-router `href` (string yoki obyekt). */
export function notificationHref(n) {
  const p = n.payload ?? {};
  if (n.type === 'support.answered') return supportRoute(p.kind);
  if (n.type === 'verification.manual_closed') return '/verify-identity';
  // Takroriy eslatma: yakunlangan buyurtma ma'lumotlari bilan to'ldirilgan yangi buyurtma formasi.
  if (n.type === 'order.repeat_reminder' && p.order_id != null) {
    return { pathname: '/new-order', params: { again: String(p.order_id) } };
  }
  if (n.type === 'listing.commented' || n.type === 'listing.replied') {
    return typeof p.listing_id === 'number'
      ? { pathname: '/listing/[id]', params: { id: String(p.listing_id) } }
      : '/listings';
  }
  const orderId = p.order_id;
  if (orderId != null && /^(order|offer)\./.test(n.type)) {
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
  if (n.type === 'verification.manual_closed') return 'notifList.openVerify';
  if (n.type === 'order.repeat_reminder' && p.order_id != null) return 'notifList.openAgain';
  if (n.type === 'listing.commented' || n.type === 'listing.replied')
    return 'notifList.openListing';
  if (p.order_id != null && /^(order|offer)./.test(n.type)) return 'notifList.openOrder';
  return null;
}

export function notificationDate(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return '—';
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

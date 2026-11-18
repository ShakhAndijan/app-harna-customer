import { formatNumber } from '../../utils/format';
import { toISODate } from '../new-order/utils';

export const toMs = (value) => (typeof value === 'number' ? value : new Date(value).getTime());

// Buyurtmaning ko'rinish holati (backend holati va kelishuv bosqichidan):
// pending | returned | negotiating | offer (usta narx aytgan, javobingiz kutilyapti) | active |
// workDone (usta "ish bajarildi" degan, tasdiqingiz kutilyapti) | done | cancelled
export function orderState(order) {
  switch (order.rawStatus) {
    case 'pending':
      return order.returnedAt ? 'returned' : 'pending';
    case 'accepted':
      // Narxni qarshi tomon (usta) aytgan bo'lsa — javob kutiladi; o'zimiz aytgan bo'lsa — kelishilmoqda.
      return order.offerBy !== 'customer' && order.offerPrice != null ? 'offer' : 'negotiating';
    case 'active':
      return order.workerDoneAt ? 'workDone' : 'active';
    case 'completed':
      return 'done';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

// Muddat ("deadline") o'tib ketganmi (bo'sh bo'lsa — yo'q).
export const isExpired = (value) => value != null && toMs(value) <= Date.now();

export const isOpenOrder = (order) => ['pending', 'accepted', 'active'].includes(order.rawStatus);

export const formatPrice = (tr, value) =>
  `${formatNumber(Math.round(value))} ${tr('common.currencySom')}`;

// Karta va banner uchun matnlar. `tone` — theme rangi nomi.
export function describeOrder(order, tr) {
  const state = orderState(order);
  const name = order.master ?? '';

  switch (state) {
    case 'offer':
      return {
        state,
        tone: 'orange',
        icon: 'cash-check',
        title: tr('requests.statusOfferTitle', { name }),
        sub: tr('requests.statusOfferSub'),
        short: tr('requests.cardOffer', { name }),
      };
    case 'negotiating':
      return {
        state,
        tone: 'blue',
        icon: 'chat-processing-outline',
        title: tr('requests.statusNegotiatingTitle', { name }),
        sub: tr('requests.statusNegotiatingSub'),
        short: tr('requests.cardNegotiating', { name }),
      };
    case 'returned':
      return {
        state,
        tone: 'red',
        icon: 'undo-variant',
        title:
          order.returnedBy === 'customer'
            ? tr('requests.statusReturnedByYouTitle')
            : tr('requests.statusReturnedTitle', {
                name: order.returnedWorkerName ?? tr('requests.workerFallback'),
              }),
        sub: tr('requests.statusReturnedSub'),
        short: tr('requests.cardReturned'),
      };
    case 'workDone':
      return {
        state,
        tone: 'orange',
        icon: 'check-decagram-outline',
        title: tr('requests.statusWorkDoneTitle'),
        sub: tr('orderFlow.stage.workDoneByWorker'),
        short: tr('requests.cardWorkDone'),
      };
    case 'active':
      return {
        state,
        tone: 'green',
        icon: 'hammer-wrench',
        title: tr('requests.statusActiveTitle'),
        sub: tr('requests.statusActiveSub', { name }),
        short: tr('requests.cardActive', { name }),
      };
    case 'done':
      return {
        state,
        tone: 'green',
        icon: 'check-circle-outline',
        title: tr('requests.statusDoneTitle'),
        sub: tr('requests.statusDoneSub'),
        short: tr('requests.cardDone'),
      };
    case 'cancelled':
      return {
        state,
        tone: 'red',
        icon: 'close-circle-outline',
        title: tr('requests.statusCancelledTitle'),
        sub: tr('requests.statusCancelledSub'),
        short: tr('requests.cardCancelled'),
      };
    default:
      // Mijoz aniq ustani tanlagan bo'lsa — "usta qidirilmoqda" emas, shu ustaning javobi kutiladi.
      if (name) {
        return {
          state,
          tone: 'gold',
          icon: 'account-clock-outline',
          title: tr('requests.statusPendingWorkerTitle', { name }),
          sub: tr('requests.statusPendingWorkerSub'),
          short: tr('requests.cardPendingWorker', { name }),
        };
      }
      // Ommaviy buyurtmaga takliflar kelgan bo'lsa — tanlash kerak.
      if (order.offersCount > 0) {
        return {
          state,
          tone: 'orange',
          icon: 'account-multiple-check-outline',
          title: tr('orderFlow.match.seeOffers', { n: order.offersCount }),
          sub: tr('orderFlow.match.chooseHint'),
          short: tr('orderFlow.match.seeOffers', { n: order.offersCount }),
        };
      }
      return {
        state,
        tone: 'gold',
        icon: 'magnify',
        title: tr('requests.statusPendingTitle'),
        sub: tr('requests.statusPendingSub'),
        short: tr('requests.cardPending'),
      };
  }
}

// ── Sanalar: backend "YYYY-MM-DD" ko'rinishida beradi (mahalliy kun).
export const todayISO = () => toISODate(new Date());

export function addDaysISO(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

// Taklif/qayta e'lon qilishda tanlash mumkin bo'lgan oxirgi kun (bugundan 30 kun).
export const MAX_DAYS_AHEAD = 30;

export function isoToDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// "2026-10-22" → "22-Okt"; sana bo'sh bo'lsa ''.
export function formatDay(tr, iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '';
  const d = isoToDate(iso.slice(0, 10));
  const months = tr('orders.monthsShort');
  const month = Array.isArray(months) ? months[d.getMonth()] : String(d.getMonth() + 1);
  return `${d.getDate()}-${month}`;
}

// Muddat ("gacha") uchun: "22-Okt, 14:30".
export function formatDeadline(tr, value) {
  if (!value) return '';
  const d = new Date(toMs(value));
  if (Number.isNaN(d.getTime())) return '';
  const months = tr('orders.monthsShort');
  const month = Array.isArray(months) ? months[d.getMonth()] : String(d.getMonth() + 1);
  return `${d.getDate()}-${month}, ${clockLabel(d.getTime())}`;
}

// Kelishuvdagi taklif sanasi: taklifdagi, bo'lmasa buyurtmadagi sana (bugundan oldin bo'lsa yaroqsiz).
export const offerDay = (order) => order.offerDate ?? order.scheduledDate ?? null;
export const isDayValid = (iso) => !!iso && iso.slice(0, 10) >= todayISO();

// Holat banneri ostidagi eslatma: javob/tasdiqlash muddatlari (saytdagi `orderStage.*` matnlari).
export function deadlineNote(order, tr) {
  const state = orderState(order);
  if (state === 'workDone') {
    const when = formatDeadline(tr, order.completeUntil);
    const notDone =
      order.workNotDoneLeft == null || order.workNotDoneLeft > 0
        ? tr('orderFlow.stage.notDoneNote')
        : tr('orderFlow.stage.notDoneSpent');
    return [when ? tr('orderFlow.stage.completeBy', { when }) : null, notDone]
      .filter(Boolean)
      .join(' ');
  }
  const when = formatDeadline(tr, order.confirmUntil);
  if (!when) return null;
  if (state === 'pending' && order.workerId != null) {
    return tr('orderFlow.stage.waitsWorker', { when });
  }
  if (state === 'negotiating') return tr('orderFlow.stage.waitsPrice', { when });
  if (state === 'offer' || (order.rawStatus === 'accepted' && order.offerBy === 'customer')) {
    return tr('orderFlow.stage.confirmBy', { when });
  }
  return null;
}

export function timeLabel(tr, value) {
  const ts = toMs(value);
  const minutes = Math.floor((Date.now() - ts) / 60000);
  if (minutes < 1) return tr('requests.justNow');
  if (minutes < 60) return tr('requests.minAgo', { n: minutes });
  return clockLabel(ts);
}

export function clockLabel(value) {
  const d = new Date(toMs(value));
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

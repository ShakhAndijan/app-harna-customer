// «Omonat» (tanlab olinadigan, 14.11) mantig'i. Mijozning hisobidagi qoidaga ko'ra (so'nggi oynadagi
// aybli belgilar yoki administrator qarori) buyurtma `awaiting_deposit` holatida turadi: hech kimga
// yuborilmaydi, chat yopiq — omonat to'langach e'lon qilinadi. Muddatda to'lanmasa bekor qilinadi.
// Server yoqmagan bo'lsa (yoki eski server) hech narsa ko'rinmaydi.
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { createURL } from 'expo-linking';
import { formatNumber } from '../../utils/format';
import { formatDeadline } from '../requests/utils';

/** Buyurtma bekor qilinish sababi: omonat o'z vaqtida to'lanmagan. */
export const DEPOSIT_UNPAID = 'deposit_unpaid';

/** Omonat ustaga o'tgan sabablar (mijozga aytiladi). */
export const FORFEIT_RESOLUTIONS = ['no_contact', 'no_work', 'customer_fault'];

/** Summa matn sifatida («50 000»); o'qib bo'lmasa yoki musbat bo'lmasa null. */
export function depositAmount(value) {
  if (value == null || value === '' || typeof value === 'boolean') return null;
  const sum = Number(value);
  return Number.isFinite(sum) && sum > 0 ? formatNumber(Math.round(sum)) : null;
}

/** Buyurtma hali e'lon qilinmagan: mijozning omonatini kutyapti. */
export const awaitsDeposit = (order) =>
  order?.rawStatus === 'awaiting_deposit' || order?.status === 'awaiting_deposit';

/** Omonat hozir to'lanishi kerak: to'lov qadami. */
export const depositDue = (order) => awaitsDeposit(order) && order?.deposit?.status === 'pending';

/**
 * Buyurtma formasidagi eslatma qatorlari: nima so'raladi va to'lashga qancha vaqt bor, nima bo'ladi,
 * nega so'raladi. Talab qilinmasa yoki o'qilmagan bo'lsa null.
 */
export function depositNoticeLines(tr, need) {
  if (need?.required !== true) return null;
  const amount = depositAmount(need.amount);
  if (amount == null) return null;
  const lines = [
    tr('deposit.formNeed', { amount, payment_minutes: need.payment_minutes }),
    tr('deposit.formRules'),
  ];
  if (need.reason === 'marks') {
    lines.push(tr('deposit.reasonMarks', { window_days: need.window_days, marks: need.marks }));
  } else if (need.reason === 'admin') {
    lines.push(tr('deposit.reasonAdmin'));
  }
  return lines;
}

/**
 * Yuborishdan oldin qayta o'qilgan qoida formada aytilmagan omonatni talab qiladimi: qoida forma
 * ochiq turganda o'zgarishi mumkin. Bunday bosish hech narsa yubormaydi — eslatma ko'rsatiladi,
 * keyingi bosish yuboradi. `said`: bosilganda eslatma ekranda turgan edi.
 */
export const depositNewlyRequired = (said, fresh) => !said && fresh?.required === true;

/** To'lov qadamining matni: «Omonatni to'lang: … so'm — … gacha. To'lanmasa, buyurtma bekor qilinadi.» */
export function depositPayText(tr, deposit) {
  return tr('deposit.pay', {
    amount: depositAmount(deposit?.amount) ?? '—',
    due_at: deposit?.dueAt ? formatDeadline(tr, deposit.dueAt) || '—' : '—',
  });
}

/**
 * Omonat mijozning to'lovi bo'lmay qolgach qayerda turgani: to'langan va ushlab turilgan; qaytariladi;
 * qaytarildi; ustaga o'tdi (sababi bilan); to'lanmadi. Aytadigan gap bo'lmasa null (hali to'lanishi
 * kerak — to'lov qadami aytadi; mijoz bekor qilgan — buyurtmaning o'zi bekor deydi).
 * @returns {{ text: string, tone: 'good'|'info'|'warn' } | null}
 */
export function depositState(tr, deposit) {
  if (!deposit) return null;
  const amount = depositAmount(deposit.amount) ?? '—';
  switch (deposit.status) {
    case 'held':
      return { text: tr('deposit.held', { amount }), tone: 'good' };
    case 'refund_due':
      return deposit.resolution === 'late_payment'
        ? { text: tr('deposit.refundDueLate', { amount }), tone: 'info' }
        : { text: tr('deposit.refundDue', { amount }), tone: 'info' };
    case 'refunded':
      return { text: tr('deposit.refunded', { amount }), tone: 'good' };
    case 'forfeited':
      return {
        text:
          deposit.resolution === 'no_contact'
            ? tr('deposit.forfeitedNoContact')
            : deposit.resolution === 'no_work'
              ? tr('deposit.forfeitedNoWork')
              : deposit.resolution === 'customer_fault'
                ? tr('deposit.forfeitedCustomerFault')
                : tr('deposit.forfeited'),
        tone: 'warn',
      };
    case 'void':
      if (deposit.resolution === 'unpaid') return { text: tr('deposit.voidUnpaid'), tone: 'warn' };
      if (deposit.resolution === 'waived') return { text: tr('deposit.voidWaived'), tone: 'info' };
      return null;
    default:
      return null;
  }
}

// ─── To'lov sahifasini ochish ────────────────────────────────────

/** Serverga to'lov sahifasi tili: Uzum o'quvchi tilida (kirill ham o'zbek), Payme va Click o'zbekcha. */
export function paymentPageLocale(provider, language) {
  if (provider !== 'uzum') return 'uz';
  const code = String(language ?? '')
    .slice(0, 2)
    .toLowerCase();
  return code === 'ru' || code === 'en' ? code : 'uz';
}

const NAMES = { payme: 'Payme', click: 'Click', uzum: 'Uzum' };

/** To'lov tizimi nomi: serverniki, so'ng ilovaniki, so'ng kodning o'zi. */
export function providerLabel(code, labels, tr) {
  const server = labels?.[code];
  if (typeof server === 'string' && server.trim()) return server.trim();
  if (code === 'uzum') return tr('deposit.payment.labelUzum');
  return NAMES[code] ?? code;
}

/**
 * To'lov sahifasini ochadi. Click havolasi telefonning o'z ishlovchisiga beriladi (Click ilovasi
 * o'rnatilgan bo'lsa shu, aks holda brauzer); Uzum o'zi yopiladigan oynada (server ilovaning o'z
 * sxemasiga qaytaradi); Payme ilova ichidagi brauzerda.
 */
export async function openCheckout(url, provider) {
  if (provider === 'click') {
    await Linking.openURL(url);
    return;
  }
  if (provider === 'uzum') {
    const back = `${createURL('').split(':')[0]}://`;
    await WebBrowser.openAuthSessionAsync(url, back, { preferEphemeralSession: true });
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

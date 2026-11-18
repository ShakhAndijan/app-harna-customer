// Buyurtma chatidagi tizim xabarlari (saytdagi `orderChat.system` + mijoz uchun `systemFor.customer`).
// Backend xabar o'rniga kalit (order_agreed...) yuboradi; mijoz nuqtai nazaridagi matnlar shu yerda.
// Kalitlar `chatSystem.*` ostida.
export const CHAT_SYSTEM = {
  uz: {
    negotiation_ended_by_customer: 'Siz kelishuvdan chiqdingiz — buyurtma qayta ochildi',
    negotiation_ended_by_worker: 'Mutaxassis kelishuvdan chiqdi — buyurtma qayta ochildi',
    order_accepted: 'Mutaxassis buyurtmani qabul qildi — shartlarni kelishing',
    order_accepted_past: 'Mutaxassis buyurtmani qabul qildi',
    order_agreed: 'Shartlar kelishildi — telefon raqamlar ochildi',
    order_cancelled_by_customer: 'Siz buyurtmani bekor qildingiz',
    order_cancelled_by_worker: 'Mutaxassis bekor qildi',
    offer_chosen:
      'Siz bu mutaxassisning taklifini tanladingiz — u tasdiqlagach telefon raqamlar ochiladi',
    order_work_done: 'Mutaxassis ish bajarilganini bildirdi',
    order_rejected_by_worker:
      "Mutaxassis buyurtmani rad etdi — uni boshqasiga yuboring yoki umumiy ro'yxatga chiqaring",
    order_returned_by_worker: 'Mutaxassis kelishuvni rad etdi — buyurtma sizga qaytdi',
    order_returned_by_customer: "Siz kelishuvni to'xtatdingiz — buyurtma sizga qaytdi",
    offer_unanswered: "Mutaxassis belgilangan vaqtda javob bermadi — tanlov bekor bo'ldi",
    offer_unanswered_by_customer: "Belgilangan vaqtda javob bermadingiz — tanlov bekor bo'ldi",
    order_unanswered_by_worker:
      'Mutaxassis belgilangan vaqtda javob bermadi — buyurtma sizga qaytdi',
    order_unanswered_by_customer: 'Belgilangan vaqtda javob bermadingiz — buyurtma sizga qaytdi',
    order_auto_completed: "Belgilangan vaqtda tasdiqlamadingiz — buyurtma o'z-o'zidan yakunlandi",
    order_work_not_done: 'Ish hali bajarilmaganini bildirdingiz',
    order_completed: 'Siz buyurtmani yakunladingiz',
    order_cancelled_by_complaint: 'Buyurtma bekor qilindi',
    order_cancelled_by_complaint_no_work: 'Buyurtma bekor qilindi',
    match_complaint_filed: "Usta siz bilan bog'lana olmaganini bildirdi — javob bering",
    match_complaint_filed_past: "Usta siz bilan bog'lana olmaganini bildirdi",
    match_complaint_filed_no_work: 'Usta ish qildirilmaganini bildirdi — javob bering',
    match_complaint_filed_no_work_past: 'Usta ish qildirilmaganini bildirdi',
    match_complaint_filed_any: 'Usta shikoyat qildi',
    match_complaint_disputed:
      "Usta bilan bog'langaningizni bildirdingiz — operator ko'rib chiqmoqda",
    match_complaint_disputed_no_work: "Shikoyatni rad etdingiz — operator ko'rib chiqmoqda",
    match_complaint_disputed_any: "Shikoyatni rad etdingiz — operator ko'rib chiqmoqda",
    match_complaint_rejected: 'Operator ustaning shikoyatini rad etdi — buyurtma davom etadi',
    match_complaint_rejected_no_work:
      'Operator ustaning shikoyatini rad etdi — buyurtma davom etadi',
    match_complaint_rejected_any: 'Operator ustaning shikoyatini rad etdi — buyurtma davom etadi',
    order_worker_arrived: 'Usta manzilga yetib keldi',
    order_location_requested: "Usta manzil nuqtasini so'radi",
    order_extra_approved: "Qo'shimcha ishga rozi bo'ldingiz",
    order_extra_declined: "Qo'shimcha ishni rad etdingiz",
    order_extra_lapsed: "Qo'shimcha ish taklifiga javob bermadingiz — taklif bekor bo'ldi",
    no_show_reported: 'Siz usta kelmadi deb bildirdingiz',
    no_show_disputed: "Usta kelganini aytdi — operator ko'rib chiqadi",
    no_show_rejected: 'Operator usta kelgan deb topdi',
    order_cancelled_by_no_show: 'Usta kelmagani tasdiqlandi — buyurtma bekor qilindi',
    guarantee_claim_filed: "Siz kafolat bo'yicha murojaat qildingiz",
    guarantee_fix_promised: 'Usta tuzatib berishga rozi bo‘ldi',
    guarantee_fix_refused: 'Usta tuzatishni rad etdi — operator hal qiladi',
    guarantee_worker_silent: 'Usta javob bermadi — operator hal qiladi',
    guarantee_fix_reported: 'Usta tuzatganini aytdi — tekshirib, javob bering',
    guarantee_fix_overdue: 'Usta muddatida tuzatmadi — operator hal qiladi',
    guarantee_fix_confirmed: 'Siz tuzatilganini tasdiqladingiz',
    guarantee_fix_rejected: 'Siz tuzatilmaganini aytdingiz — operator hal qiladi',
    guarantee_check_silent: 'Javob bermaganingiz uchun tuzatildi deb hisoblandi',
    guarantee_refunded: 'Operator sizning foydangizga hal qildi — pul qaytariladi',
    guarantee_rejected: 'Operator murojaatni rad etdi',
  },
  ru: {
    negotiation_ended_by_customer: 'Вы отказались — заказ снова открыт',
    negotiation_ended_by_worker: 'Специалист отказался — заказ снова открыт',
    order_accepted: 'Специалист принял заказ — обсудите условия',
    order_accepted_past: 'Специалист принял заказ',
    order_agreed: 'Условия согласованы — номера открыты',
    order_cancelled_by_customer: 'Вы отменили заказ',
    order_cancelled_by_worker: 'Специалист отменил',
    offer_chosen:
      'Вы выбрали предложение этого специалиста — номера откроются, когда он подтвердит',
    order_work_done: 'Специалист отметил работу выполненной',
    order_rejected_by_worker:
      'Специалист отклонил заказ — отправьте его другому или опубликуйте для всех',
    order_returned_by_worker: 'Специалист отказался от договорённости — заказ снова у вас',
    order_returned_by_customer: 'Вы прекратили переговоры — заказ снова у вас',
    offer_unanswered: 'Специалист не ответил вовремя — выбор отменён',
    offer_unanswered_by_customer: 'Вы не ответили вовремя — выбор отменён',
    order_unanswered_by_worker: 'Специалист не ответил вовремя — заказ вернулся к вам',
    order_unanswered_by_customer: 'Вы не ответили вовремя — заказ вернулся к вам',
    order_auto_completed: 'Вы не подтвердили вовремя — заказ завершён автоматически',
    order_work_not_done: 'Вы сообщили, что работа ещё не выполнена',
    order_completed: 'Вы завершили заказ',
    order_cancelled_by_complaint: 'Заказ отменён',
    order_cancelled_by_complaint_no_work: 'Заказ отменён',
    match_complaint_filed: 'Специалист сообщил, что не смог с вами связаться, — ответьте',
    match_complaint_filed_past: 'Специалист сообщил, что не смог с вами связаться',
    match_complaint_filed_no_work: 'Специалист сообщил, что ему не дали работать, — ответьте',
    match_complaint_filed_no_work_past: 'Специалист сообщил, что ему не дали работать',
    match_complaint_filed_any: 'Специалист подал жалобу',
    match_complaint_disputed:
      'Вы сообщили, что связывались со специалистом, — разбирается оператор',
    match_complaint_disputed_no_work: 'Вы оспорили жалобу — разбирается оператор',
    match_complaint_disputed_any: 'Вы оспорили жалобу — разбирается оператор',
    match_complaint_rejected: 'Оператор отклонил жалобу специалиста — заказ продолжается',
    match_complaint_rejected_no_work: 'Оператор отклонил жалобу специалиста — заказ продолжается',
    match_complaint_rejected_any: 'Оператор отклонил жалобу специалиста — заказ продолжается',
    order_worker_arrived: 'Специалист прибыл на место',
    order_location_requested: 'Специалист попросил отметить адрес на карте',
    order_extra_approved: 'Вы согласились на дополнительную работу',
    order_extra_declined: 'Вы отказались от дополнительной работы',
    order_extra_lapsed: 'Вы не ответили на предложение доп. работы — оно отменено',
    no_show_reported: 'Вы сообщили, что специалист не пришёл',
    no_show_disputed: 'Специалист говорит, что приходил, — оператор рассмотрит',
    no_show_rejected: 'Оператор решил, что специалист приходил',
    order_cancelled_by_no_show: 'Неявка специалиста подтверждена — заказ отменён',
    guarantee_claim_filed: 'Вы подали обращение по гарантии',
    guarantee_fix_promised: 'Специалист согласился исправить',
    guarantee_fix_refused: 'Специалист отказался исправлять — решит оператор',
    guarantee_worker_silent: 'Специалист не ответил — решит оператор',
    guarantee_fix_reported: 'Специалист сообщил, что исправил, — проверьте и ответьте',
    guarantee_fix_overdue: 'Специалист не исправил в срок — решит оператор',
    guarantee_fix_confirmed: 'Вы подтвердили, что исправлено',
    guarantee_fix_rejected: 'Вы сообщили, что не исправлено, — решит оператор',
    guarantee_check_silent: 'Вы не ответили, поэтому работа считается исправленной',
    guarantee_refunded: 'Оператор решил в вашу пользу — деньги вернут',
    guarantee_rejected: 'Оператор отклонил обращение',
  },
  en: {
    negotiation_ended_by_customer: 'You backed out — the order is open again',
    negotiation_ended_by_worker: 'The specialist backed out — the order is open again',
    order_accepted: 'The specialist accepted the order — agree on the terms',
    order_accepted_past: 'The specialist accepted the order',
    order_agreed: 'Terms agreed — phone numbers are open',
    order_cancelled_by_customer: 'You cancelled the order',
    order_cancelled_by_worker: 'The specialist cancelled',
    offer_chosen: "You chose this specialist's offer — phone numbers open once they confirm",
    order_work_done: 'The specialist marked the work as done',
    order_rejected_by_worker:
      'The specialist declined the order — send it to someone else or publish it for everyone',
    order_returned_by_worker: 'The specialist withdrew from the deal — the order is back with you',
    order_returned_by_customer: 'You stopped the negotiation — the order is back with you',
    offer_unanswered: "The specialist didn't reply in time — the choice was cancelled",
    offer_unanswered_by_customer: "You didn't reply in time — the choice was cancelled",
    order_unanswered_by_worker: "The specialist didn't reply in time — the order is back with you",
    order_unanswered_by_customer: "You didn't reply in time — the order is back with you",
    order_auto_completed: "You didn't confirm in time — the order was completed automatically",
    order_work_not_done: 'You said the work is not done yet',
    order_completed: 'You completed the order',
    order_cancelled_by_complaint: 'The order was cancelled',
    order_cancelled_by_complaint_no_work: 'The order was cancelled',
    match_complaint_filed: "The specialist said they couldn't reach you — please respond",
    match_complaint_filed_past: "The specialist said they couldn't reach you",
    match_complaint_filed_no_work:
      'The specialist said they were not allowed to work — please respond',
    match_complaint_filed_no_work_past: 'The specialist said they were not allowed to work',
    match_complaint_filed_any: 'The specialist filed a complaint',
    match_complaint_disputed:
      'You said you were in touch with the specialist — an operator is reviewing',
    match_complaint_disputed_no_work: 'You disputed the complaint — an operator is reviewing',
    match_complaint_disputed_any: 'You disputed the complaint — an operator is reviewing',
    match_complaint_rejected:
      "The operator rejected the specialist's complaint — the order continues",
    match_complaint_rejected_no_work:
      "The operator rejected the specialist's complaint — the order continues",
    match_complaint_rejected_any:
      "The operator rejected the specialist's complaint — the order continues",
    order_worker_arrived: 'The specialist has arrived',
    order_location_requested: 'The specialist asked you to mark the address on the map',
    order_extra_approved: 'You agreed to the extra work',
    order_extra_declined: 'You declined the extra work',
    order_extra_lapsed: "You didn't reply to the extra-work offer — it was cancelled",
    no_show_reported: 'You reported that the specialist did not show up',
    no_show_disputed: 'The specialist says they came — an operator will review',
    no_show_rejected: 'The operator decided the specialist did come',
    order_cancelled_by_no_show: 'The no-show was confirmed — the order was cancelled',
    guarantee_claim_filed: 'You filed a warranty claim',
    guarantee_fix_promised: 'The specialist agreed to fix it',
    guarantee_fix_refused: 'The specialist refused to fix it — an operator will decide',
    guarantee_worker_silent: "The specialist didn't reply — an operator will decide",
    guarantee_fix_reported: 'The specialist says it is fixed — please check and reply',
    guarantee_fix_overdue: "The specialist didn't fix it in time — an operator will decide",
    guarantee_fix_confirmed: 'You confirmed it was fixed',
    guarantee_fix_rejected: 'You said it was not fixed — an operator will decide',
    guarantee_check_silent: "You didn't reply, so it counts as fixed",
    guarantee_refunded: 'The operator ruled in your favour — the money will be refunded',
    guarantee_rejected: 'The operator rejected the claim',
  },
};

const COMPLAINT_KEYS = new Set([
  'match_complaint_filed',
  'match_complaint_disputed',
  'match_complaint_rejected',
  'order_cancelled_by_complaint',
]);

/**
 * Chatdagi tizim xabari matni (saytdagi `_i` tanlash mantig'i): shikoyat xabarlari shikoyat turiga
 * (`kind`: no_work | no_contact | boshqa) qarab, `order_accepted` esa kelishuv tugagach `_past`
 * variantida. Kalit tanilmasa — null (xabar yashiriladi).
 */
export function chatSystemText(tr, body, { live = true, kind = null, awaiting = false } = {}) {
  const keys = [];
  if (COMPLAINT_KEYS.has(body)) {
    const suffix = kind === 'no_work' ? '_no_work' : kind === 'no_contact' ? '' : '_any';
    const past = body === 'match_complaint_filed' && !awaiting ? '_past' : '';
    keys.push(`${body}${suffix}${past}`, `${body}${suffix}`);
  }
  keys.push(body === 'order_accepted' && !live ? 'order_accepted_past' : body);
  for (const k of keys) {
    const key = `chatSystem.${k}`;
    const label = tr(key);
    if (label !== key) return label;
  }
  return null;
}

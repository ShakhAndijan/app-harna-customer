// Buyurtmadagi qo'shimcha maydonlar (matn qatorlari): qulay vaqt, uskunalar kimniki, ustaning yoshi.
// Ular bo'sh bo'lsa qator chiqmaydi. `key` — qator belgisi (har ekran o'z ikonkasini tanlaydi).
const PREFERRED_KEYS = {
  morning: 'timeMorning',
  afternoon: 'timeAfternoon',
  evening: 'timeEvening',
};

export function orderExtraRows(order, tr) {
  const rows = [];
  // Qulay vaqt: eski forma savoli, shu bilan berilgan buyurtmalarda bor ('anytime' — aytadigan gap yo'q).
  const preferred = PREFERRED_KEYS[order?.preferredTime];
  if (preferred) {
    rows.push({
      key: 'preferred',
      label: tr('orderExtra.preferredTime'),
      value: tr(`orderExtra.${preferred}`),
    });
  }
  if (order?.toolsProvidedBy === 'customer' || order?.toolsProvidedBy === 'worker') {
    rows.push({
      key: 'tools',
      label: tr('orderExtra.tools'),
      value: tr(
        order.toolsProvidedBy === 'customer' ? 'orderExtra.toolsCustomer' : 'orderExtra.toolsWorker'
      ),
    });
  }
  // Yosh oralig'i: "25 – 40"; bir tomoni aytilmagan bo'lsa "—".
  if (order?.workerAgeMin != null || order?.workerAgeMax != null) {
    rows.push({
      key: 'age',
      label: tr('orderExtra.workerAge'),
      value: `${order.workerAgeMin ?? '—'} – ${order.workerAgeMax ?? '—'}`,
    });
  }
  return rows;
}

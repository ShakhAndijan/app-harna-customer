// «O'zgarmas narx»: ba'zi yo'nalishlar narxini platformaning o'zi belgilaydi (`platform_price`, viloyat bo'yicha
// farqi `region_prices`). Bunday buyurtmada narx yozilmaydi va kelishilmaydi — faqat kun kelishiladi.
// Qoidalar backend dasturchisining `lib/platformPrice` (sayt `taskTree.ts` bilan bir xil nusxa) dan: server
// formaning ko'rsatgan summasini o'zi hisoblagani bilan solishtiradi, shuning uchun hisob bir xil bo'lishi shart.
//  - meros yo'q: narx faqat aynan shu yo'nalish tanlanganda hisoblanadi (ota-yo'nalish bolasiga narx bermaydi);
//  - narxni buyurtma viloyati tanlaydi: `region_prices` dagi qatori, bo'lmasa asosiy narx;
//  - viloyat noma'lum bo'lsa aniq narx yo'q, faqat oraliq (eng past – eng baland);
//  - bir nechta narxli ish qo'shiladi; narxli va kelishiladigan ish bir buyurtmaga sig'maydi (400 `platform_price_mixed`).

import { formatNumber } from '../../utils/format';

export const isPlatformPriced = (node) => node?.platform_price != null;

/** Bitta ishning viloyat uchun narxi; kelishiladigan yo'nalish uchun null. */
export function taskPrice(node, regionId) {
  if (node?.platform_price == null) return null;
  if (regionId != null) {
    const row = node.region_prices?.find((r) => r.region_id === regionId);
    if (row) return Number(row.price);
  }
  return Number(node.platform_price);
}

/** Ish eng kami va eng ko'pi bilan qancha turadi (asosiy narx va barcha viloyatlar bo'yicha). */
export function priceSpan(node) {
  if (node?.platform_price == null) return null;
  const all = [
    Number(node.platform_price),
    ...(node.region_prices ?? []).map((r) => Number(r.price)),
  ];
  return { low: Math.min(...all), high: Math.max(...all) };
}

/**
 * Tanlangan ishlar server hisoblaganidek baholanadi:
 *  - `{kind: 'none'}` — narxli ish yo'q, narxni mijoz o'zi yozadi;
 *  - `{kind: 'mixed'}` — narxli va kelishiladigan ish aralash, server rad etadi;
 *  - `{kind: 'priced', exact, low, high, perTask}` — hammasi narxli: `exact` viloyat ma'lum bo'lgandagi yig'indi.
 * Katalogda topilmagan id tashlab yuboriladi.
 */
export function platformQuote(taskIds, byId, regionId) {
  const priced = [];
  const negotiable = [];
  for (const id of taskIds) {
    const node = byId.get(id);
    if (!node) continue;
    (isPlatformPriced(node) ? priced : negotiable).push(id);
  }
  if (!priced.length) return { kind: 'none' };
  if (negotiable.length) return { kind: 'mixed', priced, negotiable };
  const known = regionId != null;
  const perTask = priced.map((id) => {
    const node = byId.get(id);
    const span = priceSpan(node);
    return {
      id,
      name: node.name,
      price: known ? taskPrice(node, regionId) : null,
      low: span.low,
      high: span.high,
    };
  });
  const sum = (pick) => perTask.reduce((total, task) => total + pick(task), 0);
  return {
    kind: 'priced',
    exact: known ? sum((task) => task.price ?? 0) : null,
    low: sum((task) => task.low),
    high: sum((task) => task.high),
    perTask,
  };
}

/**
 * Ish tanlanganlarga qo'shilishi mumkinmi: boshqa turdagisi (narxli/kelishiladigan) tanlanmagan bo'lsa ha.
 * Tanlab qo'yilgan ish har doim sig'adi.
 */
export function fitsPicks(id, taskIds, byId) {
  if (taskIds.includes(id)) return true;
  const node = byId.get(id);
  if (!node) return true;
  const priced = isPlatformPriced(node);
  return !taskIds.some((other) => {
    const picked = byId.get(other);
    return picked != null && isPlatformPriced(picked) !== priced;
  });
}

// Katalog formadan keyin o'zgargan: narx o'zgardi yoki ish narxli/kelishiladigan bo'lib qoldi (409).
export const catalogMoved = (err) =>
  err?.code === 'platform_price_changed' || err?.code === 'platform_price_mixed';

/** "150 000 so'm" yoki "120 000 – 200 000 so'm" — pul birligi bir marta aytiladi. */
export function amountText(tr, { exact, low, high }) {
  const som = tr('common.currencySom');
  if (exact != null) return `${formatNumber(exact)} ${som}`;
  if (low === high) return `${formatNumber(low)} ${som}`;
  return tr('platformPrice.range', {
    low: formatNumber(low),
    high: `${formatNumber(high)} ${som}`,
  });
}

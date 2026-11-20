import { ENDPOINTS } from '../constants/config';
import { request } from '../utils/request';

// `sub_category_only=false` (backend default): daraxt — asosiy yo'nalishlar, ularning ichida `children`.
// `true` bo'lsa faqat quyi yo'nalishlar (parent_id bilan) tekis ro'yxatda qaytadi, asosiylari yo'q.
export async function getCategories() {
  return (await request(`${ENDPOINTS.CATEGORIES}?sub_category_only=false`)) ?? [];
}

/**
 * Buyurtma tavsifiga qarab yo'nalish taklif qiladi (`POST /categories/suggest`, mehmonga ham ochiq).
 * Javob — faol yo'nalish id'lari, eng mosi birinchi (hozircha ko'pi bilan bittasi); taklif yo'q bo'lsa
 * (AI kaliti yo'q, ishonchli javob yo'q) bo'sh ro'yxat. Har so'rov serverda model chaqiruvi: so'rov
 * soatiga cheklangan, shuning uchun uni faqat `useCategorySuggestion` yuboradi.
 */
export async function suggestCategories(text) {
  const data = await request(ENDPOINTS.CATEGORIES_SUGGEST, { method: 'POST', body: { text } });
  return Array.isArray(data?.category_ids) ? data.category_ids.filter(Number.isInteger) : [];
}

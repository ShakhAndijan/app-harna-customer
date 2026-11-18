import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrderDetail, mapOrder } from '../../../api/orders';

// Buyurtma tafsiloti: ro'yxatdagi ma'lumot darhol ko'rsatiladi, to'liq tafsilot va to'lov holati
// orqada yuklanib, ustiga qo'shiladi.
// `refresh` — amaldan keyin (masalan bekor qilingach) tafsilotni qayta yuklaydi.
export default function useOrderDetail(listOrder) {
  // Havola (harna://order/{id}) yoki bildirishnoma orqali faqat `{ id }` bilan ochilishi mumkin:
  // GET /orders/{id} javob berguncha ekran o'qiydigan ro'yxatlar (rasmlar, smeta, qo'shimcha ishlar...)
  // bo'sh qiymat bilan to'ldiriladi.
  const [order, setOrder] = useState(() => ({ ...mapOrder({ id: listOrder.id }), ...listOrder }));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const detail = await getOrderDetail(listOrder.id);
    if (!mountedRef.current) return;
    setOrder((prev) => ({ ...prev, ...detail, service: detail.service ?? prev.service }));
  }, [listOrder.id]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return { order, refresh };
}

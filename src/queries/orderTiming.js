import { useQuery } from '@tanstack/react-query';
import { getOrderTiming } from '../api/orders';
import { DEFAULT_TIMING, mapTiming, setTiming } from '../screens/requests/arrival';

// Kelish vaqti oralig'i sozlamalari: kamdan-kam o'zgaradi, shuning uchun bir marta yuklanadi.
// Yuklanguncha (yoki xato bo'lsa) standart qiymatlar ishlatiladi. Natija `windowLabel` kabi
// hook'siz funksiyalar uchun ham saqlanadi.
export function useOrderTiming() {
  const { data } = useQuery({
    queryKey: ['system', 'order-timing'],
    queryFn: async () => {
      const timing = mapTiming(await getOrderTiming());
      setTiming(timing);
      return timing;
    },
    staleTime: Infinity,
    retry: 1,
  });
  return data ?? DEFAULT_TIMING;
}

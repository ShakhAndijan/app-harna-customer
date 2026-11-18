import { useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import OrderDetailScreen from '../../screens/OrderDetailScreen';
import useGoBack from '../../navigation/useGoBack';
import { decodeParam, ustaRoute, newOrderRoute } from '../../navigation/params';

export default function OrderRoute() {
  const router = useRouter();
  const goBack = useGoBack();
  const { id, data } = useLocalSearchParams();
  const order = useMemo(() => decodeParam(data) ?? { id }, [id, data]);

  return (
    <OrderDetailScreen
      order={order}
      onBack={goBack}
      onSelectUsta={(usta) => router.push(ustaRoute(usta))}
      onReorder={(o) =>
        o.workerId
          ? router.navigate(
              newOrderRoute(
                {
                  id: o.workerId,
                  name: o.master,
                  trade: o.service,
                  bgColor: o.color,
                  initial: o.letter,
                  categoryId: o.categoryId,
                },
                // Usta bilan yakunlangan buyurtma: forma eski buyurtma ma'lumotlari bilan ochiladi
                // (bekor qilinganida /again 409 qaytaradi — oddiy qayta buyurtma).
                o.status === 'done' ? o.id : undefined
              )
            )
          : router.navigate('/new-order')
      }
    />
  );
}

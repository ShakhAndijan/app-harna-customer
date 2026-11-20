import { useRouter } from 'expo-router';
import NewOrderScreen from '../screens/NewOrderScreen';
import useGoBack from '../navigation/useGoBack';
import { afterOrderCreatedRoute } from '../navigation/params';

// Mehmon buyurtmasi: forma hisobsiz to'ldiriladi, "Tasdiqlash" bosilganda telefon kodi bilan kirish oynasi
// chiqadi (hisob ochiladi yoki mavjudiga kiriladi), so'ng buyurtma yuboriladi. Kirgach ham shu ekranda
// qolinadi (AuthRedirect bu marshrutni o'tkazib yuboradi) — buyurtma yaratilgach bosh sahifaga o'tiladi.
export default function GuestOrderRoute() {
  const router = useRouter();
  const goBack = useGoBack();
  return (
    <NewOrderScreen
      onBack={goBack}
      onOrderCreated={(created) => router.replace(afterOrderCreatedRoute(created))}
    />
  );
}

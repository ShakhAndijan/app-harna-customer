import { useRouter, useLocalSearchParams } from 'expo-router';
import NewOrderScreen from '../screens/NewOrderScreen';
import useGoBack from '../navigation/useGoBack';
import { afterOrderCreatedRoute, decodeParam } from '../navigation/params';

// Usta profilidan "Chaqirish": yangi buyurtma formasi, usta avtomatik tanlangan va uning
// tanlangan yo'nalishi xizmat sifatida belgilangan. Profil ustida ochiladi, orqaga qaytish mumkin.
export default function OrderWorkerRoute() {
  const router = useRouter();
  const goBack = useGoBack();
  const { worker } = useLocalSearchParams();

  return (
    <NewOrderScreen
      key={String(worker ?? '')}
      targetWorker={decodeParam(worker)}
      onBack={goBack}
      onOrderCreated={(created) => router.navigate(afterOrderCreatedRoute(created))}
    />
  );
}

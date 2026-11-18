import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useNavigation, useLocalSearchParams, useFocusEffect } from 'expo-router';
import NewOrderScreen from '../../screens/NewOrderScreen';
import { decodeParam } from '../../navigation/params';

// Tabdan chiqilganda forma qayta ochiladi; kiritilgan ma'lumotlar qoralamadan tiklanadi (NewOrderScreen); `worker` — ma'lum ustaga
// buyurtma berilganda uzatiladigan usta.
export default function NewOrderRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const { worker, again } = useLocalSearchParams();
  const [formKey, setFormKey] = useState(0);

  // Ekran butunlay olib tashlanganda (chiqish, qayta yuklash) marshrut yo'q — `setParams` "hech bir navigator
  // qayta ishlamadi" ogohlantirishini beradi. Bayroq fokus tozalashidan oldin o'rnatilishi uchun shu yerda.
  const unmounted = useRef(false);
  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  useFocusEffect(
    useCallback(
      () => () => {
        if (!unmounted.current) navigation.setParams({ worker: undefined, again: undefined });
        setFormKey((k) => k + 1);
      },
      [navigation]
    )
  );

  return (
    <NewOrderScreen
      key={`${formKey}:${worker ?? ''}:${again ?? ''}`}
      targetWorker={decodeParam(worker)}
      againFrom={again ? Number(again) : undefined}
      // Tiklangan qoralama ustidagi "Yangidan boshlash": forma bo'sh holda qayta ochiladi.
      onRestartDraft={() => setFormKey((k) => k + 1)}
      // Buyurtma berilgach bosh sahifaga qaytiladi — u yerda "Faol buyurtmalar" ro'yxatida ko'rinadi.
      onOrderCreated={() => router.navigate('/home')}
    />
  );
}

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../constants/config';
import { getToken } from '../utils/token';
import { devLog } from '../utils/log';
import { emitRealtime, setRealtimeConnected } from '../utils/realtime';

// Hodisa nomi → yangilanadigan so'rovlar. Hodisa tarkibiga tayanilmaydi: tegishli ro'yxat/tafsilot
// shunchaki qayta yuklanadi (ma'lumot har doim serverdan).
function keysFor(event, payload) {
  if (event.startsWith('order.') || event.startsWith('offer.')) {
    return [['orders'], ['notifications']];
  }
  // Hisob o'zgardi (telefon tasdiqlandi, blok qo'yildi/olindi, MyID): profil qayta o'qiladi.
  // `what: 'support'` — jamoa murojaat/taklif yoki chatga javob berdi: ro'yxatlar va yozishma yangilanadi.
  if (event === 'account.changed') {
    const keys = [['customer', 'me'], ['me'], ['identity', 'status']];
    if (payload?.what === 'support') keys.push(['support'], ['notifications']);
    return keys;
  }
  if (event === 'complaint.changed') return [['complaints'], ['notifications']];
  if (event === 'review.received') {
    return [['reviews'], ['customer', 'me'], ['notifications']];
  }
  return null;
}

// Kirgan foydalanuvchi uchun Socket.IO ulanishi: `auth: { token }` bilan ulanadi (server foydalanuvchini
// o'z xonasiga qo'shadi). Chiqishda uziladi. Ulanmasa ekranlar avvalgidek tez so'rab turadi.
export default function RealtimeSync({ enabled }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnectionDelayMax: 15000,
      // Qayta ulanishda yangi token olinishi uchun funksiya ko'rinishida.
      auth: (cb) => {
        getToken().then((token) => cb({ token }));
      },
    });

    socket.on('connect', () => {
      devLog('[realtime] ulandi');
      setRealtimeConnected(true);
      // Uzilish paytida o'tkazib yuborilgan o'zgarishlar uchun.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    socket.on('disconnect', () => setRealtimeConnected(false));
    socket.on('connect_error', (err) => {
      devLog('[realtime] ulanmadi', err?.message);
      setRealtimeConnected(false);
    });

    socket.onAny((event, payload) => {
      const keys = keysFor(event, payload);
      if (!keys) return;
      devLog('[realtime] hodisa', event);
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      emitRealtime(event, payload);
    });

    return () => {
      socket.offAny();
      socket.disconnect();
      setRealtimeConnected(false);
    };
  }, [enabled, queryClient]);

  return null;
}

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { orderWorkerRoute } from '../../../navigation/params';

// "Shu xizmatni buyurtma qilish": buyurtma shu e'longa bog'lanadi (`listingId`), usta va yo'nalish
// oldindan tanlanadi. Mehmon bo'lsa — kirish sahifasiga o'tkaziladi.
export default function useOrderListing() {
  const router = useRouter();
  const { signedIn } = useAuth();

  return useCallback(
    (listing) => {
      if (!signedIn) {
        router.push('/login');
        return;
      }
      const worker = listing?.worker;
      if (!worker) return;
      router.push(
        orderWorkerRoute({
          id: worker.id,
          name: worker.name,
          initial: worker.initial,
          bgColor: worker.color,
          trade: listing.title,
          categoryId: listing.categoryId,
          listingId: listing.id,
          listingCode: listing.code ?? null,
        })
      );
    },
    [signedIn, router]
  );
}

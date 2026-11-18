import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesQuery } from '../../../queries/categories';
import { getFavorites } from '../../../api/workers';
import { markStartup } from '../../../utils/startup';
import { topWorkersQuery, homeStatsQuery, homeReviewsQuery } from '../../../queries/home';
import { getRecentOrders } from '../../../api/orders';

// Mijozning shaxsiy xulosasi: faol buyurtmalar va qayta buyurtma berish mumkin bo'lgan
// oxirgi bajarilgan buyurtma. Buyurtmalar ro'yxati olinmasa ham xato emas — bo'sh xulosa.
async function loadSummary() {
  const orders = await getRecentOrders(30).catch(() => []);
  return {
    activeOrders: orders.filter((o) => o.status === 'active'),
    lastDone: orders.find((o) => o.status === 'done' && o.workerId != null) ?? null,
  };
}

// Har bir bo'lim ekranga { data: null | ma'lumot, loading, error } ko'rinishida beriladi:
//  - data === null  → hali birorta muvaffaqiyatli javob kelmagan
//  - loading        → ko'rsatadigan ma'lumot yo'q va so'rov ketmoqda (qayta urinishda ham)
//  - error          → so'rov xato bergan va ko'rsatadigan ma'lumot yo'q
// Fon rejimidagi yangilanish xato bersa, eski ma'lumot saqlanadi.
function toSection(q) {
  const noData = q.data === undefined;
  return {
    data: q.data ?? null,
    loading: noData && (q.isPending || q.isFetching),
    error: noData && q.isError && !q.isFetching,
  };
}

// Bosh sahifa ma'lumotlari: har bir bo'lim mustaqil so'rov — biri xato bersa, qolganlari
// baribir o'z holatini yangilaydi. Kesh va qayta yuklash React Query'da.
export default function useHomeData() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const categories = useQuery(categoriesQuery);
  // Kategoriya almashganda kalit o'zgaradi: yangi ro'yxat yuklanguncha loader ko'rinadi.
  const workers = useQuery(topWorkersQuery(selectedCategoryId));
  const favorites = useQuery({
    queryKey: ['favorites', 'home'],
    queryFn: () => getFavorites({ page: 1, size: 10 }),
  });
  const stats = useQuery(homeStatsQuery);
  const reviews = useQuery(homeReviewsQuery);
  // Faol buyurtmalar tez o'zgaradi: har safar bosh sahifa ochilganda/qaytilganda yangilanadi.
  const summary = useQuery({
    queryKey: ['home', 'summary'],
    queryFn: loadSummary,
    staleTime: 0,
  });

  const queries = { categories, workers, favorites, stats, reviews, summary };

  // Pull-to-refresh: kesh yangi bo'lsa ham hamma bo'lim qayta olinadi; tanlangan xizmat (kategoriya)
  // bekor qilinadi va "Eng zo'r ustalar" umumiy ro'yxatga qaytadi.
  const refresh = useCallback(() => {
    setRefreshing(true);
    const wasSelected = selectedCategoryId !== null;
    setSelectedCategoryId(null);
    const jobs = [categories, favorites, stats, reviews, summary].map((q) => q.refetch());
    jobs.push(
      wasSelected
        ? queryClient.refetchQueries({ queryKey: topWorkersQuery(null).queryKey, exact: true })
        : workers.refetch()
    );
    return Promise.allSettled(jobs).finally(() => setRefreshing(false));
    // refetch funksiyalari barqaror; so'rov obyektlari har renderda yangi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategoryId,
    queryClient,
    categories.refetch,
    workers.refetch,
    favorites.refetch,
    stats.refetch,
    reviews.refetch,
    summary.refetch,
  ]);

  // Foydalanuvchi xato bergan bo'limni qayta yuklaydi
  const retry = (name) => queries[name]?.refetch();

  const sections = {
    categories: toSection(categories),
    workers: toSection(workers),
    favorites: toSection(favorites),
    stats: toSection(stats),
    reviews: toSection(reviews),
    summary: toSection(summary),
  };
  const all = Object.values(sections);

  const initialLoading = all.every((s) => s.loading);
  const logged = useRef(false);
  useEffect(() => {
    if (!initialLoading && !logged.current) {
      logged.current = true;
      markStartup("bosh sahifa ma'lumoti ko'rindi");
    }
  }, [initialLoading]);

  return {
    ...sections,
    selectedCategoryId,
    selectCategory: setSelectedCategoryId,
    refreshing,
    refresh,
    refreshSummary: summary.refetch,
    retry,
    initialLoading,
    allFailed: all.every((s) => s.error),
  };
}

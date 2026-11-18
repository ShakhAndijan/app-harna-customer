import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getListingsPage,
  getListing,
  getFavoriteListingsPage,
  favoriteListing,
  unfavoriteListing,
  likeListing,
  unlikeListing,
  getListingComments,
  addListingComment,
  deleteListingComment,
} from '../api/listings';

// Barcha e'lon so'rovlari ['listings', ...] ostida: bitta invalidate hammasini yangilaydi.
// (Disk keshiga yozilmaydi: `is_favorite` har bir mijozga alohida.)
const PAGE_SIZE = 12;
const EMPTY = [];

const dedupe = (pages) => {
  const seen = new Set();
  return pages
    .flatMap((p) => p.items)
    .filter((item) => (seen.has(item.id) ? false : seen.add(item.id)));
};

/**
 * Cheksiz ro'yxat. `saved` bo'lsa filtrlar e'tiborga olinmaydi va mijozning saqlangan e'lonlari keladi.
 * @returns {{ items, total, loading, error, refreshing, fetchingMore, hasMore, loadMore, refetch }}
 */
export function useListingsFeed(
  filters,
  { saved = false, enabled = true, pageSize = PAGE_SIZE } = {}
) {
  const query = useInfiniteQuery({
    queryKey: saved ? ['listings', 'saved'] : ['listings', 'browse', filters, pageSize],
    queryFn: ({ pageParam }) =>
      saved
        ? getFavoriteListingsPage({ page: pageParam, size: pageSize })
        : getListingsPage({ ...filters, page: pageParam, size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    staleTime: 60 * 1000,
    enabled,
  });

  const items = useMemo(() => (query.data ? dedupe(query.data.pages) : EMPTY), [query.data]);

  return {
    items,
    total: query.data?.pages[0]?.total ?? 0,
    loading: query.isPending && enabled,
    error: query.isError && !query.data,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    fetchingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    refetch: query.refetch,
  };
}

/** Bosh sahifa karuseli: eng yangi (mashhurlari oldinda) e'lonlar. */
export function useHomeListings(size = 8) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['listings', 'home', size],
    queryFn: () => getListingsPage({ size }),
    staleTime: 2 * 60 * 1000,
  });
  return { items: data?.items ?? EMPTY, loading: isPending, error: isError, refetch };
}

/** Bitta usta e'lonlari (usta profili uchun). */
export function useWorkerListings(workerId, size = 10) {
  const { data, isPending } = useQuery({
    queryKey: ['listings', 'worker', workerId, size],
    queryFn: () => getListingsPage({ workerId, size }),
    enabled: !!workerId,
    staleTime: 2 * 60 * 1000,
  });
  return { items: data?.items ?? EMPTY, loading: isPending && !!workerId };
}

export function useListingDetail(listingId) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['listings', 'detail', String(listingId)],
    queryFn: () => getListing(listingId),
    enabled: !!listingId,
    staleTime: 60 * 1000,
  });
  return { listing: data ?? null, loading: isPending, error, refetch };
}

export function useListingComments(listingId) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['listings', 'comments', String(listingId)],
    queryFn: () => getListingComments(listingId),
    enabled: !!listingId,
    staleTime: 30 * 1000,
  });
  return { comments: data?.items ?? EMPTY, loading: isPending, error: isError, refetch };
}

// Keshdagi barcha ro'yxat va detal nusxalarida e'lonni `change` bilan darhol o'zgartiradi
// (saqlangan belgisi, layk). Izohlar kabi boshqa obyektlarga tegmaydi.
function patchListing(queryClient, listingId, change) {
  const patch = (item) =>
    item && 'isFavorite' in item && item.id === listingId ? { ...item, ...change(item) } : item;
  queryClient.setQueriesData({ queryKey: ['listings'] }, (data) => {
    if (!data) return data;
    // Cheksiz ro'yxatda `pages` — sahifalar massivi; oddiy sahifa javobida esa jami sahifalar soni (raqam).
    if (Array.isArray(data.pages)) {
      return { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map(patch) })) };
    }
    if (Array.isArray(data.items)) return { ...data, items: data.items.map(patch) };
    return patch(data);
  });
}

const setFavorite = (value) => () => ({ isFavorite: value });
const setLiked = (value) => (item) => ({
  isLiked: value,
  likeCount: Math.max(0, item.likeCount + (value ? 1 : -1)),
});

/** Saqlash / saqlangandan olish: natija darhol ko'rinadi, xatoda qaytariladi. */
export function useToggleListingFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, next }) => (next ? favoriteListing(id) : unfavoriteListing(id)),
    onMutate: ({ id, next }) => patchListing(queryClient, id, setFavorite(next)),
    onError: (_err, { id, next }) => patchListing(queryClient, id, setFavorite(!next)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });
}

/** Layk bosish / olib tashlash: son darhol o'zgaradi, xatoda qaytariladi. */
export function useToggleListingLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, next }) => (next ? likeListing(id) : unlikeListing(id)),
    onMutate: ({ id, next }) => patchListing(queryClient, id, setLiked(next)),
    onError: (_err, { id, next }) => patchListing(queryClient, id, setLiked(!next)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });
}

export function useAddListingComment(listingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => addListingComment(listingId, body),
    // Izohlar ro'yxati va kartalardagi izohlar soni yangilanadi.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });
}

export function useDeleteListingComment(listingId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => deleteListingComment(listingId, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });
}

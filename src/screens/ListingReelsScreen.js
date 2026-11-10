import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AppLoader from '../components/AppLoader';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCategoryTreeQuery } from '../queries/categories';
import { useListingDetail, useListingsFeed } from '../queries/listings';
import { listingRoute, ustaRoute } from '../navigation/params';
import ReelPage from './listings/components/ReelPage';
import CommentsSheet from './listings/components/CommentsSheet';
import ReelFilterSheet from './listings/components/ReelFilterSheet';
import useListingFavorite from './listings/hooks/useListingFavorite';
import useListingLike from './listings/hooks/useListingLike';
import useOrderListing from './listings/hooks/useOrderListing';
import { shareListing, workerToUsta } from './listings/utils';

const BG = '#0b1117';
const SHEET_RATIO = 0.62;
// Pastki suzuvchi menyu egallaydigan joy (menyu balandligi + chetdan masofa): tabda tugmalar uning ustida turadi.
const TAB_BAR_SPACE = 86;
const NO_FILTERS = {};
const NO_TAB_FILTER = {
  parentId: null,
  subId: null,
  sort: 'new',
  price: { priceMin: null, priceMax: null, priced: null },
  hasPhoto: false,
  author: null,
};

// E'lonlarni Instagram Reels kabi to'liq ekranda ko'rish: yuqoriga/pastga surib keyingi e'longa o'tiladi.
// Ro'yxat bosilgan e'lon ochilgan ro'yxat (`filters`/`saved`) bilan bir xil, shuning uchun keshdan darhol keladi.
// `initial` — bosilgan e'lon: ro'yxat kelguncha va ro'yxatda topilmasa ham ko'rsatiladi.
// `tab` — pastki menyudagi "E'lonlar" tabi: boshlang'ich e'lon yo'q, orqaga tugmasi o'rniga qidiruv va filtr tugmalari (`onSearch`) bor.
export default function ListingReelsScreen({
  initial,
  filters,
  saved = false,
  onBack,
  onSearch,
  tab = false,
}) {
  const safeInsets = useSafeAreaInsets();
  const insets = useMemo(
    () => (tab ? { ...safeInsets, bottom: safeInsets.bottom + TAB_BAR_SPACE } : safeInsets),
    [tab, safeInsets]
  );
  const { t: tr } = useLanguage();
  const { tree } = useCategoryTreeQuery();
  // Tabdagi filtr: yo'nalish, saralash, narx, foto va mutaxassis; boshqa joylarda filtr tashqaridan keladi.
  const [fv, setFv] = useState(NO_TAB_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const feedFilters = useMemo(
    () =>
      tab
        ? {
            categoryId: fv.subId ?? fv.parentId,
            sort: fv.sort,
            workerId: fv.author?.id ?? null,
            hasPhoto: fv.hasPhoto,
            ...fv.price,
          }
        : (filters ?? NO_FILTERS),
    [tab, fv, filters]
  );
  const filterActive =
    fv.parentId != null ||
    fv.sort !== 'new' ||
    fv.hasPhoto ||
    !!fv.author ||
    fv.price.priceMin != null ||
    fv.price.priceMax != null ||
    fv.price.priced != null;
  const feed = useListingsFeed(feedFilters, { saved });
  const tools = useMemo(
    () => (tab ? { onSearch, onFilter: () => setFilterOpen(true), filterActive } : null),
    [tab, onSearch, filterActive]
  );
  const ready = !feed.loading && !feed.error;
  // Ro'yxat kelguncha bitta e'lon kesh bilan yangilanib turishi uchun (layk/saqlash natijasi ko'rinsin).
  const detail = useListingDetail(ready ? null : initial?.id);
  const single = detail.listing ?? initial ?? null;

  const [size, setSize] = useState(null);
  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev?.width === width && prev?.height === height ? prev : { width, height }
    );
  };

  let body = null;
  if (size && ready && feed.items.length === 0 && !initial) {
    body = (
      <View style={s.center}>
        <MaterialCommunityIcons
          name="text-box-search-outline"
          size={44}
          color="rgba(255,255,255,0.4)"
        />
        <Text style={s.errTxt}>{tr('listings.emptyTitle')}</Text>
      </View>
    );
  } else if (size && ready) {
    body = (
      <ReelsPager
        // Filtr o'zgarsa ro'yxat boshidan boshlanadi (eski o'rin saqlanmasin).
        key={JSON.stringify(feedFilters)}
        size={size}
        insets={insets}
        initial={initial}
        feedItems={feed.items}
        loadMore={feed.loadMore}
        onBack={onBack}
        tools={tools}
      />
    );
  } else if (size && single) {
    body = (
      <SingleReel listing={single} size={size} insets={insets} onBack={onBack} tools={tools} />
    );
  } else if (size && feed.error) {
    body = (
      <View style={s.center}>
        <Text style={s.errTxt}>{tr('common.error')}</Text>
        <TouchableOpacity onPress={feed.refetch} activeOpacity={0.85} style={s.retry}>
          <Text style={s.retryTxt}>{tr('common.retry')}</Text>
        </TouchableOpacity>
        {!!onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[s.backBtn, { top: insets.top + 10 }]}
            accessibilityRole="button"
            accessibilityLabel={tr('common.back')}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  } else if (size) {
    body = (
      <View style={s.center}>
        <AppLoader size={120} />
        {!!onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[s.backBtn, { top: insets.top + 10 }]}
            accessibilityRole="button"
            accessibilityLabel={tr('common.back')}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={s.root} onLayout={onLayout}>
      <StatusBar style="light" />
      {body}
      {tab && size && filterOpen && (
        <ReelFilterSheet
          tree={tree}
          value={fv}
          onApply={(next) => {
            setFv(next);
            setFilterOpen(false);
          }}
          onClose={() => setFilterOpen(false)}
          maxHeight={size.height * 0.8}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}

// Amallar (layk, saqlash, ulashish, buyurtma...) va izohlar oynasi — bitta e'lon ham, ro'yxat ham uchun umumiy.
function useReelActions() {
  const router = useRouter();
  const { t: tr } = useLanguage();
  const like = useListingLike();
  const save = useListingFavorite();
  const order = useOrderListing();

  return useMemo(
    () => ({
      onLike: like,
      onSave: save,
      onContact: order,
      onShare: (listing) => shareListing(listing, tr),
      // Batafsil sahifa reels ustida ochiladi, orqaga bosilsa shu e'longa qaytiladi.
      onDetails: (listing) => router.push(listingRoute(listing)),
      onOpenWorker: (worker) => router.push(ustaRoute(workerToUsta(worker))),
    }),
    [like, save, order, router, tr]
  );
}

function SingleReel({ listing, size, insets, onBack, tools }) {
  const actions = useReelActions();
  const router = useRouter();
  const { signedIn } = useAuth();
  const [commentsFor, setCommentsFor] = useState(null);

  return (
    <>
      <ReelPage
        listing={listing}
        width={size.width}
        height={size.height}
        insets={insets}
        onBack={onBack}
        {...tools}
        onComments={(l) => setCommentsFor(l.id)}
        {...actions}
      />
      {commentsFor != null && (
        <CommentsSheet
          listingId={commentsFor}
          signedIn={signedIn}
          onLogin={() => router.push('/login')}
          onClose={() => setCommentsFor(null)}
          height={size.height * SHEET_RATIO}
          bottomInset={insets.bottom}
        />
      )}
    </>
  );
}

const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

function ReelsPager({ size, insets, initial, feedItems, loadMore, onBack, tools }) {
  const router = useRouter();
  const { signedIn } = useAuth();
  const actions = useReelActions();
  const [commentsFor, setCommentsFor] = useState(null);

  // Bosilgan e'lon ro'yxatda bo'lmasa (masalan, filtr o'zgargan) — eng boshiga qo'shiladi.
  // Boshlang'ich o'rin faqat ochilganda hisoblanadi, keyin ro'yxat pastga qarab o'sadi.
  const [extra] = useState(() =>
    initial && !feedItems.some((i) => i.id === initial.id) ? initial : null
  );
  const items = useMemo(() => {
    if (!extra) return feedItems;
    const live = feedItems.find((i) => i.id === extra.id);
    return [live ?? extra, ...feedItems.filter((i) => i.id !== extra.id)];
  }, [extra, feedItems]);
  const [startIndex] = useState(() =>
    Math.max(
      0,
      items.findIndex((i) => i.id === initial?.id)
    )
  );

  // Faqat ko'rinib turgan sahifadagi video o'ynaydi.
  const [activeId, setActiveId] = useState(items[startIndex]?.id ?? null);
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first) setActiveId(first.item.id);
  }, []);

  const onComments = useCallback((l) => setCommentsFor(l.id), []);
  const renderItem = useCallback(
    ({ item }) => (
      <ReelPage
        listing={item}
        active={item.id === activeId}
        width={size.width}
        height={size.height}
        insets={insets}
        onBack={onBack}
        {...tools}
        onComments={onComments}
        {...actions}
      />
    ),
    [size, insets, onBack, tools, onComments, actions, activeId]
  );

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        pagingEnabled
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        // Pager balandligi ekran balandligiga teng, shuning uchun sahifa o'rni oldindan ma'lum.
        getItemLayout={(_, index) => ({ length: size.height, offset: size.height * index, index })}
        initialScrollIndex={startIndex}
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={1}
        removeClippedSubviews
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY}
        onEndReached={loadMore}
        onEndReachedThreshold={2}
        scrollEnabled={commentsFor == null}
      />
      {commentsFor != null && (
        <CommentsSheet
          listingId={commentsFor}
          signedIn={signedIn}
          onLogin={() => router.push('/login')}
          onClose={() => setCommentsFor(null)}
          height={size.height * SHEET_RATIO}
          bottomInset={insets.bottom}
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  errTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  retry: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: '#e87a45',
    justifyContent: 'center',
  },
  retryTxt: { color: '#fff', fontSize: 14.5, fontWeight: '800' },
  backBtn: {
    position: 'absolute',
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

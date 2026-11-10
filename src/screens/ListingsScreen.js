import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AppLoader from '../components/AppLoader';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCategoryTreeQuery } from '../queries/categories';
import { useListingsFeed } from '../queries/listings';
import { reelsRoute } from '../navigation/params';
import EmptyCard from './zakazchi-main/components/EmptyCard';
import SectionError from './zakazchi-main/components/SectionError';
import ListingCard from './listings/components/ListingCard';
import ListingsFilters from './listings/components/ListingsFilters';
import ReelFilterSheet from './listings/components/ReelFilterSheet';

const H_PAD = 20;
const GAP = 12;
const SEARCH_DELAY_MS = 400;
const NO_PRICE = { priceMin: null, priceMax: null, priced: null };

// Usta xizmat e'lonlari: qidiruv, yo'nalish, narx va saralash filtrlari bilan ikki ustunli ro'yxat.
// `workerId` berilsa faqat shu usta e'lonlari; `initialSaved` — "Saqlanganlar" ochiq holda boshlanadi.
export default function ListingsScreen({
  onBack,
  initialSaved = false,
  workerId = null,
  workerName = '',
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { signedIn } = useAuth();
  const { tree } = useCategoryTreeQuery();

  const [saved, setSaved] = useState(initialSaved && signedIn && !workerId);
  const [queryInput, setQueryInput] = useState('');
  const [q, setQ] = useState('');
  const [parentId, setParentId] = useState(null);
  const [subId, setSubId] = useState(null);
  const [sort, setSort] = useState('new');
  const [price, setPrice] = useState(NO_PRICE);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  // "Mutaxassis" filtri: tanlangan muallif ({ id, name }).
  const [author, setAuthor] = useState(null);

  // Har harf uchun so'rov yuborilmasligi uchun qidiruv matni biroz kutib qo'llanadi.
  useEffect(() => {
    const id = setTimeout(() => setQ(queryInput.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [queryInput]);

  const filters = useMemo(
    () => ({
      q,
      categoryId: subId ?? parentId,
      workerId: workerId ?? author?.id ?? null,
      sort,
      priceMin: price.priceMin,
      priceMax: price.priceMax,
      priced: price.priced,
      hasPhoto,
    }),
    [q, subId, parentId, workerId, author, sort, price, hasPhoto]
  );

  const feed = useListingsFeed(filters, { saved });

  const cardWidth = (width - H_PAD * 2 - GAP) / 2;
  const title = workerName
    ? tr('listings.workerTitle', { name: workerName })
    : tr('listings.title');
  const filtersActive =
    parentId != null ||
    sort !== 'new' ||
    hasPhoto ||
    !!author ||
    price.priceMin != null ||
    price.priceMax != null ||
    price.priced != null;

  const header = (
    <View>
      <ListingsFilters
        saved={saved}
        query={queryInput}
        onQueryChange={setQueryInput}
        onOpenFilters={() => setFilterOpen(true)}
        filtersActive={filtersActive}
      />
      {!feed.loading && !feed.error && feed.total > 0 && (
        <Text style={[s.count, { color: t.muted }]}>{tr('listings.count', { n: feed.total })}</Text>
      )}
    </View>
  );

  let empty = null;
  if (feed.loading) {
    empty = (
      <View style={s.center}>
        <AppLoader size={120} />
      </View>
    );
  } else if (feed.error) {
    empty = <SectionError style={{ marginHorizontal: H_PAD }} onRetry={feed.refetch} />;
  } else {
    empty = (
      <EmptyCard
        icon={
          <MaterialCommunityIcons
            name={saved ? 'bookmark-outline' : 'text-box-search-outline'}
            size={26}
            color={t.muted}
          />
        }
        title={tr(saved ? 'listings.savedEmptyTitle' : 'listings.emptyTitle')}
        subtitle={tr(saved ? 'listings.savedEmptySub' : 'listings.emptySub')}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={tr('common.back')}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: t.text }]} numberOfLines={1}>
          {title}
        </Text>
        {signedIn && !workerId && (
          <TouchableOpacity
            style={[
              s.backBtn,
              {
                backgroundColor: saved ? t.orange : t.card,
                borderColor: saved ? t.orange : t.border,
              },
            ]}
            onPress={() => setSaved((v) => !v)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            accessibilityLabel={tr('listings.saved')}
          >
            <MaterialCommunityIcons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={21}
              color={saved ? '#fff' : t.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={feed.items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: H_PAD }}
        contentContainerStyle={{
          gap: GAP,
          paddingBottom: 28 + insets.bottom,
          flexGrow: 1,
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          feed.fetchingMore ? (
            <ActivityIndicator color={t.orange} style={{ marginVertical: 14 }} />
          ) : null
        }
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            width={cardWidth}
            onPress={(l) => router.push(reelsRoute(l, { filters, saved }))}
          />
        )}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.6}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={feed.refetch}
            tintColor={t.orange}
            colors={[t.orange]}
          />
        }
      />

      {filterOpen && (
        <ReelFilterSheet
          tree={tree}
          value={{ parentId, subId, sort, price, hasPhoto, author }}
          onApply={(next) => {
            setParentId(next.parentId);
            setSubId(next.subId);
            setSort(next.sort);
            setPrice(next.price);
            setHasPhoto(next.hasPhoto);
            setAuthor(next.author);
            setFilterOpen(false);
          }}
          onClose={() => setFilterOpen(false)}
          maxHeight={height * 0.8}
          bottomInset={insets.bottom}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontWeight: '700', fontSize: 20 },
  count: { fontSize: 12.5, fontWeight: '600', paddingHorizontal: H_PAD, marginBottom: 2 },
  center: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
});

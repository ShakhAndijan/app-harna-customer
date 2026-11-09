import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackEvent } from '../utils/analytics';
import { useWithPresence } from '../queries/presence';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AppLoader from '../components/AppLoader';
import ListingCard from '../components/ListingCard';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LocationMapPicker from '../components/LocationMapPicker';
import { useWorkersFeed } from '../queries/workers';
import { getMapClusters, getWorkerById } from '../api/workers';
import { useRegions, useDistricts } from '../queries/reference';
import { useCategoryTreeQuery } from '../queries/categories';
import { ustaRoute, newOrderRoute } from '../navigation/params';
import EmptyCard from './zakazchi-main/components/EmptyCard';
import SectionError from './zakazchi-main/components/SectionError';
import WorkersFilterSheet from './workers/WorkersFilterSheet';
import WorkersMap from './workers/WorkersMap';
import { toListingCardShape } from './xizmatlar/utils';
import { formatPrice } from './listings/utils';
import { CATEGORY_ACCENT } from './xizmatlar/constants';

const H_PAD = 20;
const SEARCH_DELAY_MS = 400;
const SORTS = ['rating', 'newest', 'price', 'experience'];
const LIST_PAGE = 20;
// Xaritada bir martada ko'proq usta ko'rinishi uchun sahifa kattaroq.
const MAP_PAGE = 50;
const formatKm = (km) => (km < 10 ? km.toFixed(1) : String(Math.round(km)));
// Shu masshtabdan uzoqroqda xarita nuqtalar o'rniga hudud bo'yicha ustalar sonini ko'rsatadi.
const CLUSTER_MAX_ZOOM = 8;

const NO_FILTERS = {
  parentIds: [],
  subIds: [],
  regionId: null,
  districtId: null,
  minRating: null,
  badge: null,
  isOnline: false,
  verifiedOnly: false,
};

// Barcha ustalar: qidiruv, saralash, "Yaqinimda" (joylashuv bo'yicha eng yaqinlar) va filtrlar
// (viloyat/tuman, reyting, status, onlayn, tasdiqlangan). Natija ro'yxat yoki xarita ko'rinishida.
export default function WorkersScreen({ onBack }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { signedIn } = useAuth();

  const [queryInput, setQueryInput] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('rating');
  const [filter, setFilter] = useState(NO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState('list');
  const [coords, setCoords] = useState(null);
  // "Men" nuqtasi haqiqiy GPS'dan olinganmi (shundagina yo'nalish strelkasi ko'rsatiladi), yoki xaritadan qo'lda tanlanganmi.
  const [meFromGps, setMeFromGps] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  // Joylashuvni xaritadan qo'lda tanlash (ruxsat berilmaganda yoki aniqlab bo'lmaganda).
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  // Har harf uchun so'rov yuborilmasligi uchun qidiruv matni biroz kutib qo'llanadi.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = queryInput.trim();
      setQ(next);
      if (next) trackEvent('search_performed');
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [queryInput]);

  // Tanlangan yo'nalishlar: asosiy yo'nalishning quyi turlari tanlangan bo'lsa shular, aks holda yo'nalishning o'zi.
  const { tree } = useCategoryTreeQuery();
  const categoryIds = useMemo(
    () =>
      filter.parentIds.flatMap((pid) => {
        const subs = tree.find((c) => c.id === pid)?.children ?? [];
        const chosen = subs.filter((c) => filter.subIds.includes(c.id)).map((c) => c.id);
        return chosen.length > 0 ? chosen : [pid];
      }),
    [tree, filter.parentIds, filter.subIds]
  );

  const filters = useMemo(
    () => ({
      q,
      sort,
      ...filter,
      categoryIds,
      nearLat: coords?.lat ?? null,
      nearLon: coords?.lon ?? null,
    }),
    [q, sort, filter, categoryIds, coords]
  );
  const mapMode = view === 'map';
  const feed = useWorkersFeed(filters, mapMode ? MAP_PAGE : LIST_PAGE);
  const liveItems = useWithPresence(feed.items);

  // Viloyat/tuman tanlangan bo'lsa xarita shu hududga markazlanadi (ustalar bo'lmasa ham boshqa shaharda qolib ketmaydi).
  const regions = useRegions().data;
  const districts = useDistricts(filter.regionId).data;
  const mapArea = useMemo(() => {
    const region = regions?.find((r) => r.id === filter.regionId);
    if (!region) return null;
    const hasPoint = (x) => x?.latitude != null && x?.longitude != null;
    const regionZoom = region.code === 'toshkent-shahri' ? 11 : 8;
    const regionPoint = hasPoint(region)
      ? { lat: Number(region.latitude), lon: Number(region.longitude), zoom: regionZoom }
      : null;
    const district = districts?.find((d) => d.id === filter.districtId);
    if (district) {
      if (hasPoint(district)) {
        return { lat: Number(district.latitude), lon: Number(district.longitude), zoom: 11 };
      }
      return {
        query: `${district.name}, ${region.name}, Uzbekistan`,
        fallback: regionPoint
          ? { ...regionPoint, zoom: 9 }
          : { lat: 41.2995, lon: 69.2401, zoom: 9 },
      };
    }
    return regionPoint;
  }, [regions, districts, filter.regionId, filter.districtId]);

  // Nuqta bosilganda xarita ustida chiqadigan kartochka uchun ism, kasb, reyting va narx ham yuboriladi.
  const mapPins = useMemo(
    () =>
      feed.items
        .filter((w) => w.latitude != null && w.longitude != null)
        .map((w) => ({
          id: w.id,
          lat: w.latitude,
          lon: w.longitude,
          name: w.name,
          role: w.mainCategory || w.profession || '',
          rating: w.rating > 0 ? w.rating.toFixed(1) : null,
          price:
            w.minPrice > 0
              ? tr('workersList.mapPriceFrom', { price: formatPrice(w.minPrice) })
              : null,
        })),
    [feed.items, tr]
  );
  // Xarita uzoqlashtirilganda (viloyat darajasi) alohida ustalar o'rniga hudud bo'yicha soni ko'rsatiladi.
  const [mapZoom, setMapZoom] = useState(null);
  const showClusters = mapMode && mapZoom != null && mapZoom <= CLUSTER_MAX_ZOOM;
  const clusterQuery = useQuery({
    queryKey: ['workers', 'map-clusters', filter, categoryIds, q],
    queryFn: () =>
      getMapClusters({
        level: filter.regionId ? 'district' : 'region',
        regionId: filter.regionId,
        categoryId: categoryIds.length === 1 ? categoryIds[0] : null,
        isOnline: filter.isOnline,
        verifiedOnly: filter.verifiedOnly,
        minRating: filter.minRating,
        badge: filter.badge,
        q,
      }),
    enabled: showClusters,
    staleTime: 60 * 1000,
  });
  const clusters = useMemo(
    () =>
      showClusters && clusterQuery.data
        ? clusterQuery.data.map((c) => ({
            name: c.name,
            count: c.workerCount,
            lat: c.latitude,
            lon: c.longitude,
            zoom: filter.regionId ? 11 : 9,
          }))
        : null,
    [showClusters, clusterQuery.data, filter.regionId]
  );
  const noLocationCount = feed.items.length - mapPins.length;
  const selected = selectedId != null ? feed.items.find((w) => w.id === selectedId) : null;
  const hasMore = feed.total != null && feed.items.length < feed.total;

  // Tanlangan mutaxassisning ish hududi (radius): ro'yxatda yo'q, shuning uchun tafsiloti so'raladi
  // (mutaxassis sahifasi bilan bir xil kalit — keshdan olinadi).
  const detailQuery = useQuery({
    queryKey: ['worker', selectedId],
    queryFn: () => getWorkerById(selectedId),
    enabled: mapMode && selectedId != null,
    staleTime: 5 * 60 * 1000,
  });
  const detail = detailQuery.data;
  const workArea =
    selected &&
    selected.latitude != null &&
    selected.longitude != null &&
    detail?.id === selected.id &&
    detail.workAreaMode === 'radius' &&
    detail.workRadiusKm > 0
      ? { lat: selected.latitude, lon: selected.longitude, km: Number(detail.workRadiusKm) }
      : null;

  // "Yaqinimda": joylashuvga ruxsat so'raladi, aniqlangach ro'yxat masofa bo'yicha saralanadi.
  // Koordinata saqlanadi — qayta yoqilganda ruxsat qaytadan so'ralmaydi.
  const toggleNearby = async () => {
    if (sort === 'distance') {
      setSort('rating');
      return;
    }
    if (coords) {
      setSort('distance');
      return;
    }
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        appAlert(tr('workersList.nearbyDeniedTitle'), tr('workersList.nearbyDeniedMsg'), [
          { text: tr('common.cancel'), style: 'cancel' },
          { text: tr('workersList.pickOnMap'), onPress: () => setPickerOpen(true) },
        ]);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      // 4 xona (~10 m) — har bir kichik siljishda so'rov keshi yangilanib ketmasligi uchun.
      setCoords({
        lat: Number(pos.coords.latitude.toFixed(4)),
        lon: Number(pos.coords.longitude.toFixed(4)),
      });
      setMeFromGps(true);
      setSort('distance');
    } catch {
      appAlert(tr('workersList.nearby'), tr('workersList.nearbyError'), [
        { text: tr('common.cancel'), style: 'cancel' },
        { text: tr('workersList.pickOnMap'), onPress: () => setPickerOpen(true) },
      ]);
    } finally {
      setLocating(false);
    }
  };

  const confirmPicked = () => {
    if (picked) {
      setCoords({
        lat: Number(Number(picked.lat).toFixed(4)),
        lon: Number(Number(picked.lng).toFixed(4)),
      });
      setMeFromGps(false);
      setSort('distance');
    }
    setPickerOpen(false);
  };

  // "Bog'lanish": shu ustaga buyurtma berish (kirmagan bo'lsa avval kirish).
  const contact = (w) => {
    if (!signedIn) {
      router.push('/login');
      return;
    }
    router.navigate(
      newOrderRoute({
        id: w.id,
        name: w.name,
        trade: w.mainCategory || w.profession,
        bgColor: w.color,
        initial: w.initial,
        categoryId: w.categoryId,
      })
    );
  };

  // Karta ma'lumotiga masofa (km) qo'shiladi: "2.3 km · Chilonzor, Toshkent".
  const toCard = (w) => {
    const card = {
      ...toListingCardShape(w, tr),
      reviewCount: w.reviewCount,
      tags: w.skills.slice(0, 3),
    };
    if (w.mainCategory) card.title = w.mainCategory;
    if (w.distanceKm != null) {
      card.location = [tr('workersList.distance', { n: formatKm(w.distanceKm) }), card.location]
        .filter(Boolean)
        .join(' · ');
    }
    return card;
  };
  const activeCount =
    (filter.parentIds.length > 0 ? 1 : 0) +
    (filter.regionId != null ? 1 : 0) +
    (filter.minRating != null ? 1 : 0) +
    (filter.badge != null ? 1 : 0) +
    (filter.isOnline ? 1 : 0) +
    (filter.verifiedOnly ? 1 : 0);

  const cardColors = {
    card: t.card,
    border: t.border,
    text: t.text,
    muted: t.muted,
    gold: t.gold,
  };

  const header = (
    <View style={s.headWrap}>
      <View style={s.searchRow}>
        <View style={[s.search, { backgroundColor: t.card, borderColor: t.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={t.muted} />
          <TextInput
            value={queryInput}
            onChangeText={setQueryInput}
            placeholder={tr('workersList.searchPlaceholder')}
            placeholderTextColor={t.faint}
            returnKeyType="search"
            style={[s.searchInput, { color: t.text }]}
          />
          {!!queryInput && (
            <TouchableOpacity onPress={() => setQueryInput('')} hitSlop={10}>
              <MaterialCommunityIcons name="close-circle" size={18} color={t.faint} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={tr('workersList.filters.title')}
          style={[
            s.filterBtn,
            {
              backgroundColor: activeCount > 0 ? t.orange : t.card,
              borderColor: activeCount > 0 ? t.orange : t.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={22}
            color={activeCount > 0 ? '#fff' : t.text}
          />
          {activeCount > 0 && (
            <View style={[s.badge, { backgroundColor: t.text }]}>
              <Text style={[s.badgeTxt, { color: t.bg }]}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.sortRow}
      >
        <TouchableOpacity
          onPress={toggleNearby}
          disabled={locating}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: sort === 'distance', busy: locating }}
          style={[
            s.sortChip,
            s.nearChip,
            {
              backgroundColor: sort === 'distance' ? t.orange : t.card,
              borderColor: sort === 'distance' ? t.orange : t.border,
            },
          ]}
        >
          {locating ? (
            <ActivityIndicator size="small" color={t.orange} />
          ) : (
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={16}
              color={sort === 'distance' ? '#fff' : t.orange}
            />
          )}
          <Text style={[s.sortTxt, { color: sort === 'distance' ? '#fff' : t.text }]}>
            {tr('workersList.nearby')}
          </Text>
        </TouchableOpacity>
        {SORTS.map((key) => {
          const on = sort === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSort(key)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[
                s.sortChip,
                {
                  backgroundColor: on ? t.orange : t.card,
                  borderColor: on ? t.orange : t.border,
                },
              ]}
            >
              <Text style={[s.sortTxt, { color: on ? '#fff' : t.text }]}>
                {tr(`workersList.sort.${key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!mapMode && !feed.loading && !feed.error && feed.total != null && (
        <Text style={[s.count, { color: t.muted }]}>
          {tr('workersList.count', { n: feed.total })}
        </Text>
      )}
    </View>
  );

  let empty;
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
        icon={<MaterialCommunityIcons name="account-search-outline" size={26} color={t.muted} />}
        title={tr('workersList.emptyTitle')}
        subtitle={tr('workersList.emptySub')}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {mapMode && (
        <WorkersMap
          style={StyleSheet.absoluteFill}
          pins={mapPins}
          clusters={clusters}
          onZoom={setMapZoom}
          me={coords}
          workArea={workArea}
          showHeading={meFromGps}
          dark={t.isDark}
          openLabel={tr('workersList.mapOpen')}
          onOpen={(id) => {
            const w = feed.items.find((x) => x.id === id);
            if (w) router.push(ustaRoute(w));
          }}
          area={mapArea}
          selectedId={selected ? selected.id : null}
          onSelect={setSelectedId}
          fitKey={JSON.stringify([filters, mapArea])}
        />
      )}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']} pointerEvents="box-none">
        <StatusBar style={t.isDark && !mapMode ? 'light' : 'dark'} />

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
          {mapMode ? (
            <View style={{ flex: 1 }} pointerEvents="none" />
          ) : (
            <Text style={[s.title, { color: t.text }]} numberOfLines={1}>
              {tr('workersList.title')}
            </Text>
          )}
          <View style={[s.viewToggle, { backgroundColor: t.card, borderColor: t.border }]}>
            {[
              ['list', 'format-list-bulleted'],
              ['map', 'map-outline'],
            ].map(([key, icon]) => {
              const on = view === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setView(key)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={tr(`workersList.view.${key}`)}
                  accessibilityState={{ selected: on }}
                  style={[s.viewBtn, on && { backgroundColor: t.orange }]}
                >
                  <MaterialCommunityIcons name={icon} size={20} color={on ? '#fff' : t.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {mapMode ? (
          <>
            {header}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {!selected && !feed.error && (feed.loading || noLocationCount > 0 || hasMore) && (
                <View
                  style={[s.mapBottom, { bottom: insets.bottom + 16 }]}
                  pointerEvents="box-none"
                >
                  {feed.loading && (
                    <View style={[s.mapNote, { backgroundColor: t.card, borderColor: t.border }]}>
                      <ActivityIndicator size="small" color={t.orange} />
                    </View>
                  )}
                  {!feed.loading && noLocationCount > 0 && (
                    <View
                      style={[s.mapNote, { backgroundColor: t.card, borderColor: t.border }]}
                      pointerEvents="none"
                    >
                      <Text style={[s.mapNoteTxt, { color: t.muted }]}>
                        {tr('workersList.map.noLocation', { n: noLocationCount })}
                      </Text>
                    </View>
                  )}
                  {hasMore && (
                    <TouchableOpacity
                      onPress={feed.loadMore}
                      disabled={feed.fetchingMore}
                      activeOpacity={0.85}
                      style={[s.moreBtn, { backgroundColor: t.orange }]}
                    >
                      {feed.fetchingMore ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={s.moreTxt}>{tr('workersList.map.more')}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {!feed.loading && !feed.error && mapPins.length === 0 && (
                <View style={s.mapEmpty} pointerEvents="none">
                  <View style={[s.mapEmptyBox, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[s.mapNoteTxt, { color: t.text, textAlign: 'center' }]}>
                      {tr(mapArea ? 'workersList.map.emptyArea' : 'workersList.map.empty')}
                    </Text>
                  </View>
                </View>
              )}
              {feed.error && !feed.loading && (
                <View style={s.mapEmpty} pointerEvents="box-none">
                  <SectionError onRetry={feed.refetch} />
                </View>
              )}
              {selected && (
                <View style={[s.mapCard, { bottom: insets.bottom + 12 }]}>
                  <ListingCard
                    listing={toCard(selected)}
                    accent={CATEGORY_ACCENT}
                    colors={cardColors}
                    onPress={() => router.push(ustaRoute(selected))}
                    onContact={() => contact(selected)}
                  />
                </View>
              )}
            </View>
          </>
        ) : (
          <FlatList
            data={liveItems}
            keyExtractor={(w) => String(w.id)}
            contentContainerStyle={{ paddingBottom: 28 + insets.bottom, flexGrow: 1 }}
            ListHeaderComponent={header}
            ListEmptyComponent={empty}
            ListFooterComponent={
              feed.fetchingMore ? (
                <ActivityIndicator color={t.orange} style={{ marginVertical: 14 }} />
              ) : null
            }
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: H_PAD, marginBottom: 12 }}>
                <ListingCard
                  listing={toCard(item)}
                  accent={CATEGORY_ACCENT}
                  colors={cardColors}
                  onPress={() => router.push(ustaRoute(item))}
                  onContact={() => contact(item)}
                />
              </View>
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
        )}
      </SafeAreaView>

      {pickerOpen && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg }]}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
            <View style={s.header}>
              <TouchableOpacity
                style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
                onPress={() => setPickerOpen(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={tr('common.back')}
              >
                <MaterialCommunityIcons name="close" size={22} color={t.text} />
              </TouchableOpacity>
              <Text style={[s.title, { color: t.text }]} numberOfLines={1}>
                {tr('workersList.pickTitle')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <LocationMapPicker
                fill
                showExpand={false}
                borderRadius={0}
                lat={picked?.lat}
                lng={picked?.lng}
                onChange={(lat, lng) => setPicked({ lat, lng })}
                showTapHint
                tapHint={tr('workersList.pickHint')}
              />
            </View>
            <View style={[s.pickActions, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity
                onPress={confirmPicked}
                disabled={!picked}
                activeOpacity={0.85}
                style={[s.pickBtn, { backgroundColor: t.orange, opacity: picked ? 1 : 0.5 }]}
              >
                <Text style={s.moreTxt}>{tr('workersList.pickConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {filterOpen && (
        <WorkersFilterSheet
          value={filter}
          onChange={setFilter}
          onReset={() => setFilter(NO_FILTERS)}
          onClose={() => setFilterOpen(false)}
          maxHeight={height * 0.82}
          bottomInset={insets.bottom}
        />
      )}
    </View>
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
  headWrap: { gap: 12, paddingBottom: 14 },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: H_PAD },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 14.5, padding: 0 },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: { fontSize: 10.5, fontWeight: '800' },
  sortRow: { paddingHorizontal: H_PAD, gap: 8, alignItems: 'center' },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  viewBtn: {
    width: 38,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  mapNote: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
  },
  mapNoteTxt: { fontSize: 12.5, fontWeight: '600' },
  mapEmpty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: H_PAD,
  },
  mapEmptyBox: { borderRadius: 16, borderWidth: 1, padding: 16 },
  moreBtn: {
    height: 42,
    minWidth: 130,
    paddingHorizontal: 20,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickActions: { paddingHorizontal: H_PAD, paddingTop: 12 },
  pickBtn: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  moreTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  mapCard: { position: 'absolute', left: H_PAD, right: H_PAD },
  sortChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
  },
  sortTxt: { fontSize: 13, fontWeight: '700' },
  count: { fontSize: 12.5, fontWeight: '600', paddingHorizontal: H_PAD },
  center: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
});

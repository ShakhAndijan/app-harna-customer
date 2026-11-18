import { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { trackEvent } from '../utils/analytics';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView, useKeyboardState } from 'react-native-keyboard-controller';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppLoader from '../components/AppLoader';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useAllCategoriesQuery } from '../queries/categories';
import { useListingDetail, useWorkerListings } from '../queries/listings';
import { listingRoute, listingsRoute, ustaRoute } from '../navigation/params';
import SectionError from './zakazchi-main/components/SectionError';
import SectionHeader from './zakazchi-main/components/SectionHeader';
import ListingCard from './listings/components/ListingCard';
import ListingGallery from './listings/components/ListingGallery';
import ListingVideo from './listings/components/ListingVideo';
import FavoriteButton from './listings/components/FavoriteButton';
import CommentsSection from './listings/components/CommentsSection';
import useOrderListing from './listings/hooks/useOrderListing';
import { priceText, timeAgo, encodeImageUri, workerToUsta, shareListing } from './listings/utils';

const H_PAD = 20;
const RAIL_CARD_W = 176;
const BADGE_COLORS = { bronze: '#cd7f32', silver: '#9aa7b8', gold: '#f5c451' };

// Bitta e'lon: galereya, narx, tavsif, usta kartasi, izohlar va "Shu xizmatni buyurtma qilish".
// `initial` — ro'yxatdagi kartadan kelgan ma'lumot: to'liq javob kelguncha o'sha ko'rsatiladi.
export default function ListingDetailScreen({ listingId, initial, onBack }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { signedIn } = useAuth();
  const { categories } = useAllCategoriesQuery();
  const keyboardVisible = useKeyboardState((st) => st.isVisible);

  const detail = useListingDetail(listingId);
  useEffect(() => {
    if (listingId) trackEvent('listing_viewed');
  }, [listingId]);
  const listing = detail.listing ?? initial;
  const worker = listing?.worker ?? null;
  const category = categories.find((c) => c.id === listing?.categoryId);

  const more = useWorkerListings(listing?.workerId);
  const otherListings = more.items.filter((l) => l.id !== listing?.id);

  const goLogin = () => router.push('/login');

  const share = () => listing && shareListing(listing, tr);
  const orderListing = useOrderListing();
  const order = () => orderListing(listing);

  const header = (
    <View style={s.header}>
      <TouchableOpacity
        style={[s.iconBtn, { backgroundColor: t.card, borderColor: t.border }]}
        onPress={onBack}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={tr('common.back')}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={t.text} />
      </TouchableOpacity>
      <Text style={[s.headerTitle, { color: t.text }]} numberOfLines={1}>
        {tr('listings.detail.headerTitle')}
      </Text>
      {!!listing && (
        <>
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: t.card, borderColor: t.border }]}
            onPress={share}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={tr('listings.detail.share')}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={20} color={t.text} />
          </TouchableOpacity>
          <FavoriteButton listing={listing} size={40} />
        </>
      )}
    </View>
  );

  if (!listing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
        <StatusBar style={t.isDark ? 'light' : 'dark'} />
        {header}
        {detail.loading ? (
          <View style={s.center}>
            <AppLoader size={120} />
          </View>
        ) : (
          <SectionError style={{ margin: H_PAD }} onRetry={detail.refetch} />
        )}
      </SafeAreaView>
    );
  }

  const badgeColor = BADGE_COLORS[worker?.badge];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {header}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: H_PAD,
          paddingTop: 6,
          paddingBottom: 110 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Izoh maydoni klaviatura ostida qolmasligi uchun (NewOrderScreen'dagi sozlama bilan bir xil).
        bottomOffset={96 + insets.bottom}
        mode="layout"
      >
        {!!listing.videoUrl && (
          <ListingVideo
            uri={listing.videoUrl}
            poster={listing.videoPoster ?? listing.photos[0]}
            width={width - H_PAD * 2}
            height={Math.round((width - H_PAD * 2) * 0.75)}
            controls
            duration={listing.videoDuration}
            contentFit="contain"
            style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 12 }}
          />
        )}
        {(listing.photos.length > 0 || !listing.videoUrl) && (
          <ListingGallery photos={listing.photos} width={width - H_PAD * 2} />
        )}

        <View style={s.metaRow}>
          {!!category && (
            <View style={[s.catPill, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={[s.catTxt, { color: t.muted }]} numberOfLines={1}>
                {category.icon ? `${category.icon} ${category.name}` : category.name}
              </Text>
            </View>
          )}
          {!!listing.code && <Text style={[s.code, { color: t.faint }]}>#{listing.code}</Text>}
        </View>

        <Text style={[s.title, { color: t.text }]}>{listing.title}</Text>
        <Text style={[s.price, { color: listing.price == null ? t.muted : t.orange }]}>
          {priceText(listing, tr)}
        </Text>
        <View style={s.statsRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={t.faint} />
          <Text style={[s.stat, { color: t.faint }]}>{timeAgo(listing.createdAt, tr)}</Text>
          <MaterialCommunityIcons
            name="comment-text-outline"
            size={14}
            color={t.faint}
            style={{ marginLeft: 10 }}
          />
          <Text style={[s.stat, { color: t.faint }]}>{listing.commentCount}</Text>
        </View>

        {!!listing.description && (
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.muted }]}>
              {tr('listings.detail.description')}
            </Text>
            <Text style={[s.desc, { color: t.subtext }]}>{listing.description}</Text>
          </View>
        )}

        {!!worker && (
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={s.workerRow}>
              <View style={[s.avatar, { backgroundColor: worker.color }]}>
                {worker.photo ? (
                  <Image
                    source={{ uri: encodeImageUri(worker.photo) }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={s.avatarTxt}>{worker.initial}</Text>
                )}
                {worker.online && (
                  <View style={[s.onlineDot, { backgroundColor: t.green, borderColor: t.card }]} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.workerName, { color: t.text }]} numberOfLines={1}>
                  {worker.name}
                </Text>
                <View style={s.workerMeta}>
                  {worker.rating != null && worker.rating > 0 && (
                    <View style={s.inline}>
                      <Ionicons name="star" size={12} color={t.gold} />
                      <Text style={[s.ratingTxt, { color: t.gold }]}>
                        {worker.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  {!!badgeColor && (
                    <View style={[s.badge, { backgroundColor: `${badgeColor}26` }]}>
                      <MaterialCommunityIcons name="medal-outline" size={12} color={badgeColor} />
                      <Text style={[s.badgeTxt, { color: badgeColor }]}>
                        {tr(`listings.badge.${worker.badge}`)}
                      </Text>
                    </View>
                  )}
                </View>
                {!!worker.location && (
                  <Text style={[s.location, { color: t.muted }]} numberOfLines={1}>
                    {worker.location}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push(ustaRoute(workerToUsta(worker)))}
              activeOpacity={0.85}
              style={[s.outlineBtn, { borderColor: t.line2 }]}
            >
              <Text style={[s.outlineTxt, { color: t.text }]}>
                {tr('listings.detail.openProfile')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ marginTop: 22 }}>
          <CommentsSection listingId={listing.id} signedIn={signedIn} onLogin={goLogin} />
        </View>

        {otherListings.length > 0 && (
          <View style={{ marginTop: 26, marginHorizontal: -H_PAD }}>
            <SectionHeader
              title={tr('listings.detail.otherByWorker')}
              actionLabel={tr('common.seeAll')}
              onActionPress={() =>
                router.push(listingsRoute({ workerId: listing.workerId, workerName: worker?.name }))
              }
              style={{ paddingHorizontal: H_PAD }}
            />
            <FlatList
              data={otherListings}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
              renderItem={({ item }) => (
                <ListingCard
                  listing={item}
                  width={RAIL_CARD_W}
                  // Shu ekranni almashtiradi, orqaga bosganda oldingi e'lonlar to'planib qolmaydi.
                  onPress={(l) => router.replace(listingRoute(l))}
                />
              )}
            />
          </View>
        )}
      </KeyboardAwareScrollView>

      {!keyboardVisible && (
        <View
          style={[
            s.cta,
            {
              backgroundColor: t.bg,
              borderTopColor: t.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableOpacity
            onPress={order}
            activeOpacity={0.88}
            accessibilityRole="button"
            style={[s.ctaBtn, { backgroundColor: t.orange }]}
          >
            <Text style={s.ctaTxt}>{tr('listings.detail.orderCta')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', marginLeft: 4 },
  center: { paddingVertical: 100, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  catPill: {
    flexShrink: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  catTxt: { fontSize: 12, fontWeight: '700' },
  code: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 30, marginTop: 10 },
  price: { fontSize: 22, fontWeight: '900', marginTop: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  stat: { fontSize: 12.5, fontWeight: '600' },
  card: { borderRadius: 22, borderWidth: 1, padding: 16, marginTop: 18 },
  cardTitle: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  desc: { fontSize: 14.5, lineHeight: 21, marginTop: 8 },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontSize: 22, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  workerName: { fontSize: 16.5, fontWeight: '800' },
  workerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontSize: 12.5, fontWeight: '800' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
  location: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  outlineBtn: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  outlineTxt: { fontSize: 14, fontWeight: '700' },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaTxt: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
});

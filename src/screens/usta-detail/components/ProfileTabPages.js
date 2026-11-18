import { memo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../../../context/LanguageContext';
import { useListingsFeed } from '../../../queries/listings';
import { reelsRoute } from '../../../navigation/params';
import ListingPhoto from '../../listings/components/ListingPhoto';
import { priceText, listingCover } from '../../listings/utils';
import { useUstaStyles } from '../styles';
import EmptyState from './EmptyState';
import SpecializationSection from './SpecializationSection';
import ServicePricesSection from './ServicePricesSection';
import BadgeRow from './BadgeRow';
import TrustSection from './TrustSection';
import LanguagesSection from './LanguagesSection';
import ScheduleSection from './ScheduleSection';
import CertificatesSection from './CertificatesSection';
import RatingSection from './RatingSection';
import ReviewsSection from './ReviewsSection';
import ComplaintsSection from './ComplaintsSection';

// Pastki qatordagi ko'rsatkich: ikon va soni, o'z bo'lagi markazida.
function MiniStat({ icon, n, color }) {
  const { C } = useUstaStyles();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
      }}
    >
      <Ionicons name={icon} size={15} color={color || C.dim} />
      <Text style={{ color: C.txt, fontSize: 13, fontWeight: '700' }}>{n ?? 0}</Text>
    </View>
  );
}

// Ixcham e'lon plitkasi: bir qatorda 2 tadan. Bosilsa e'lon to'liq ekranda ochiladi.
function ListingTile({ listing, onOpen }) {
  const { C } = useUstaStyles();
  const { t: tr } = useLanguage();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={listing.title}
      style={{
        width: '48.5%',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.line,
        backgroundColor: C.card,
        overflow: 'hidden',
      }}
    >
      <ListingPhoto
        uri={listingCover(listing)}
        video={!!listing.videoUrl}
        thumb
        style={{ width: '100%', aspectRatio: 1 }}
        iconSize={34}
      >
        {!!listing.videoUrl && (
          <View style={s.playBadge}>
            <MaterialCommunityIcons name="play" size={14} color="#fff" />
          </View>
        )}
        {listing.isTop ? (
          <View style={[s.topBadge, { backgroundColor: C.gold }]}>
            <Ionicons name="flame" size={11} color="#1b1200" />
            <Text style={s.topTxt}>TOP</Text>
          </View>
        ) : null}
      </ListingPhoto>
      <View style={{ padding: 10, gap: 6 }}>
        <Text style={{ color: C.txt, fontWeight: '700', fontSize: 13.5 }} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text
          style={{
            color: listing.price == null ? C.dim : C.orange,
            fontWeight: '900',
            fontSize: 15,
          }}
          numberOfLines={1}
        >
          {priceText(listing, tr)}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.line,
        }}
      >
        <MiniStat icon="heart" color="#e0473a" n={listing.likeCount} />
        <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: C.line }} />
        <MiniStat icon="chatbubble-outline" n={listing.commentCount} />
      </View>
    </TouchableOpacity>
  );
}

// Birinchi marta ko'rinadigan e'lonlar soni; ekran oxiriga yetilganda shuncha yana qo'shiladi.
const LISTINGS_PAGE = 20;

// "E'lonlar" tabi: ustaning e'lonlari, bir qatorda ikkitadan. Dastlab 20 ta, sahifa oxiriga yetilganda
// (`endReached` obunasi orqali xabar keladi) yana 20 tadan yuklanadi.
function ListingsTab({ workerId, endReached }) {
  const router = useRouter();
  const { t: tr } = useLanguage();
  const { C } = useUstaStyles();
  const { items, loading, hasMore, fetchingMore, loadMore } = useListingsFeed(
    { workerId },
    { enabled: !!workerId, pageSize: LISTINGS_PAGE }
  );
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });
  useEffect(() => endReached?.subscribe(() => loadMoreRef.current()), [endReached]);
  if (!items.length) {
    return (
      <EmptyState
        icon="storefront-outline"
        title={loading ? tr('common.loading') : tr('ustaDetail.ig.noListings')}
      />
    );
  }
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 12,
        }}
      >
        {items.map((l) => (
          <ListingTile
            key={l.id}
            listing={l}
            onOpen={() => router.push(reelsRoute(l, { filters: { workerId } }))}
          />
        ))}
      </View>
      {(fetchingMore || hasMore) && (
        <View style={{ paddingVertical: 18, alignItems: 'center', minHeight: 56 }}>
          {fetchingMore && <ActivityIndicator color={C.orange} />}
        </View>
      )}
    </View>
  );
}

// "Ishlar" tabi: ish namunalari va platformada bajarilgan ishlar — 3 ustunli suratlar to'ri.
function WorksTab({ portfolio, completedJobs, loading, onSelectWork }) {
  const { C } = useUstaStyles();
  const { t: tr } = useLanguage();
  // Suratsiz ishlar to'rda bo'sh kvadrat bo'lib qolmasligi uchun chiqarilmaydi (worker ilovasidagidek).
  const works = [...portfolio, ...completedJobs].filter((w) => !!w.photo);
  if (!works.length) {
    return (
      <EmptyState
        icon="hammer-wrench"
        title={loading ? tr('common.loading') : tr('ustaDetail.ig.noWorks')}
      />
    );
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {works.map((w, i) => (
        <TouchableOpacity
          key={`${w.id}-${i}`}
          activeOpacity={0.85}
          onPress={() => onSelectWork?.(w)}
          accessibilityRole="button"
          accessibilityLabel={w.title}
          style={{ width: '32.4%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' }}
        >
          <ListingPhoto
            uri={w.photo}
            thumb
            style={{ width: '100%', height: '100%' }}
            iconSize={26}
          />
          {w.rating != null && (
            <View style={s.rateBadge}>
              <Ionicons name="star" size={10} color={C.gold} />
              <Text style={s.rateTxt}>{Number(w.rating).toFixed(1)}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewsTab({ rating, rawRating, detail, reviews, filter, onFilterChange }) {
  const { t: tr } = useLanguage();
  return (
    <View>
      {reviews.items.length === 0 ? (
        <EmptyState
          icon="comment-text-outline"
          title={reviews.loading ? tr('common.loading') : tr('ustaDetail.ig.noReviews')}
        />
      ) : (
        <>
          <RatingSection
            rating={rating}
            rawRating={rawRating}
            reviewCount={detail?.reviewCount ?? 0}
            reviewItemsCount={reviews.total}
            ratingBreakdown={detail?.ratingBreakdown ?? null}
          />
          <ReviewsSection
            reviews={reviews.items}
            filter={filter}
            onFilterChange={onFilterChange}
            hasMore={reviews.hasMore}
            fetchingMore={reviews.fetchingMore}
            onLoadMore={reviews.loadMore}
          />
        </>
      )}
      <ComplaintsSection workerId={detail?.id} />
    </View>
  );
}

function InfoTab({
  badges,
  bio,
  detail,
  languages,
  categories,
  selectedCategoryId,
  onSelectCategory,
  loadingDetail,
  isLoggedIn,
  schedule,
  certificates,
  loadingCertificates,
}) {
  const { t: tr } = useLanguage();
  const { C, st } = useUstaStyles();
  return (
    <View>
      <View style={[st.card, { padding: 16, marginTop: 14, gap: 6 }]}>
        <Text style={{ color: C.txt, fontWeight: '800', fontSize: 15 }}>
          {tr('ustaDetail.ig.about')}
        </Text>
        {bio ? (
          <Text style={{ color: C.txt, fontSize: 13.5, lineHeight: 20 }}>{bio}</Text>
        ) : (
          <Text style={{ color: C.dim, fontSize: 13 }}>{tr('ustaDetail.ig.noBio')}</Text>
        )}
      </View>
      <BadgeRow badges={badges} />
      <TrustSection detail={detail} />
      <LanguagesSection languages={languages} />
      <SpecializationSection
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={onSelectCategory}
        loading={loadingDetail}
      />
      <ServicePricesSection
        categories={categories}
        selectedId={selectedCategoryId}
        loading={loadingDetail}
      />
      {isLoggedIn && (
        <ScheduleSection
          weekDays={schedule.weekDays}
          workHours={schedule.workHours}
          offDates={schedule.offDates}
        />
      )}
      <CertificatesSection certificates={certificates} loading={loadingCertificates} />
    </View>
  );
}

// Tab sahifasi: memo — surish paytida (holat o'zgarganda) qayta chizilmaydi, shuning uchun qotmaydi.
const ProfileTabPage = memo(function ProfileTabPage({ v, ...p }) {
  return (
    <View style={{ paddingTop: 14, paddingBottom: 8 }}>
      {v === 'listings' ? <ListingsTab workerId={p.workerId} endReached={p.endReached} /> : null}
      {v === 'works' ? (
        <WorksTab
          portfolio={p.portfolio}
          completedJobs={p.completedJobs}
          loading={p.loadingDetail}
          onSelectWork={p.onSelectWork}
        />
      ) : null}
      {v === 'reviews' ? (
        <ReviewsTab
          rating={p.rating}
          rawRating={p.rawRating}
          detail={p.detail}
          reviews={p.reviews}
          filter={p.reviewFilter}
          onFilterChange={p.onReviewFilterChange}
        />
      ) : null}
      {v === 'info' ? (
        <InfoTab
          badges={p.badges}
          bio={p.bio}
          detail={p.detail}
          languages={p.languages}
          categories={p.categories}
          selectedCategoryId={p.selectedCategoryId}
          onSelectCategory={p.onSelectCategory}
          loadingDetail={p.loadingDetail}
          isLoggedIn={p.isLoggedIn}
          schedule={p.schedule}
          certificates={p.certificates}
          loadingCertificates={p.loadingCertificates}
        />
      ) : null}
    </View>
  );
});

export default ProfileTabPage;

const s = StyleSheet.create({
  playBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  topTxt: { color: '#1b1200', fontSize: 10.5, fontWeight: '900' },
  rateBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(10,19,34,0.72)',
  },
  rateTxt: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
});

import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useWithPresence } from '../queries/presence';
import { UstaStyleProvider, useUstaStyles } from './usta-detail/styles';
import useUstaDetail from './usta-detail/hooks/useUstaDetail';
import { pickProfile, buildBadges, buildSchedule } from './usta-detail/derive';
import DetailHeader from './usta-detail/components/DetailHeader';
import ProfileTop from './usta-detail/components/ProfileTop';
import { ProfileTabs, SwipeTabs } from './usta-detail/components/ProfileTabs';
import ProfileTabPage from './usta-detail/components/ProfileTabPages';
import BottomCta from './usta-detail/components/BottomCta';

const TAB_ORDER = ['listings', 'works', 'reviews', 'info'];

// Usta profili ekrani (Instagram uslubida: bosh qism + 4 ta surib o'tiladigan tab).
// Ma'lumot `hooks/useUstaDetail`, hisob-kitoblar `derive.js`, bo'limlar `usta-detail/components/` da.
export default function UstaDetailScreen(props) {
  return (
    <UstaStyleProvider>
      <UstaDetailContent {...props} />
    </UstaStyleProvider>
  );
}

function UstaDetailContent({
  usta,
  onBack,
  onGoToLogin,
  onOrderWorker,
  onSelectWork,
  onReport,
  isLoggedIn = false,
}) {
  const insets = useSafeAreaInsets();
  const { t: tr } = useLanguage();
  const { theme } = useTheme();
  const { C, st } = useUstaStyles();

  const [tab, setTab] = useState('listings');
  const [reviewFilter, setReviewFilter] = useState('all');

  const {
    detail,
    loadingDetail,
    certificates,
    loadingCertificates,
    selectedCategoryId,
    setSelectedCategoryId,
    liked,
    toggleLike,
    reviews,
    completedJobs,
  } = useUstaDetail(usta);

  const profile = pickProfile({ detail, usta, C, tr });
  // Profil ochiq turganda holat (Onlayn/Band/Dam olishda) 2 daqiqada bir yangilanadi.
  const [livePresence] = useWithPresence(useMemo(() => (detail ? [detail] : []), [detail]));
  const { d, initial, name, trade, rating, rawRating, bgColor, location, bio } = profile;

  const badges = useMemo(() => buildBadges(d, tr, C), [d, tr, C]);
  const categories = detail?.categories || [];
  const portfolio = useMemo(() => detail?.portfolio || [], [detail]);
  const schedule = useMemo(() => buildSchedule(detail?.schedule || null), [detail]);

  const workerId = usta?.id ?? detail?.id;

  // Barqaror havola: tab sahifasi (memo) surish paytida qayta chizilmasligi uchun.
  const selectWork = useCallback(
    (work) => onSelectWork?.({ ...work, worker: name, workerId }),
    [onSelectWork, name, workerId]
  );

  const handleOrderThisWorker = () => {
    if (!workerId) return;
    onOrderWorker?.({
      id: workerId,
      name,
      trade,
      bgColor,
      initial,
      categoryId: selectedCategoryId ?? detail?.mainCategoryId ?? null,
    });
  };

  const tabs = [
    { value: 'listings', label: tr('ustaDetail.ig.tabListings'), icon: 'megaphone' },
    { value: 'works', label: tr('ustaDetail.ig.tabWorks'), icon: 'hammer' },
    { value: 'reviews', label: tr('ustaDetail.ig.tabReviews'), icon: 'chatbubble' },
    { value: 'info', label: tr('ustaDetail.ig.tabInfo'), icon: 'person-circle' },
  ];

  return (
    <SafeAreaView style={st.safe} edges={['top', 'left', 'right']}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <DetailHeader
        onBack={onBack}
        workerId={workerId}
        shareInfo={{ name, trade, rating }}
        isLoggedIn={isLoggedIn}
        liked={liked}
        onToggleLike={toggleLike}
        onReport={onReport ? () => onReport({ id: workerId, name }) : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 14) + 76 }}
      >
        <View style={st.pad}>
          <ProfileTop
            initial={initial}
            name={name}
            trade={trade}
            location={location}
            rating={rating}
            reviewCount={detail?.reviewCount ?? 0}
            completedJobs={detail?.completedJobsCount ?? 0}
            likes={detail?.likesCount ?? 0}
            bgColor={bgColor}
            photo={d.profile_photo}
            presence={livePresence ?? detail ?? profile.presence}
            isIdentityVerified={!!detail?.isIdentityVerified}
            isPro={!!detail?.isPro}
            isTop={!!detail?.isTop}
            avgResponseMin={detail?.avgResponseMin}
            showLoader={loadingDetail && !detail}
          />

          <View style={{ marginTop: 14 }}>
            <ProfileTabs tabs={tabs} value={tab} onChange={setTab} />
            <SwipeTabs
              order={TAB_ORDER}
              value={tab}
              onChange={setTab}
              render={(v) => (
                <ProfileTabPage
                  v={v}
                  workerId={workerId}
                  detail={detail}
                  badges={badges}
                  bio={bio}
                  rating={rating}
                  rawRating={rawRating}
                  portfolio={portfolio}
                  completedJobs={completedJobs.items}
                  loadingDetail={loadingDetail}
                  reviews={reviews}
                  reviewFilter={reviewFilter}
                  onReviewFilterChange={setReviewFilter}
                  languages={profile.languages}
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={setSelectedCategoryId}
                  isLoggedIn={isLoggedIn}
                  schedule={schedule}
                  certificates={certificates}
                  loadingCertificates={loadingCertificates}
                  onSelectWork={selectWork}
                />
              )}
            />
          </View>
        </View>
      </ScrollView>

      <BottomCta
        price={profile.startingPrice}
        unavailable={detail?.takesOrders === false}
        onPress={isLoggedIn ? handleOrderThisWorker : onGoToLogin}
      />
    </SafeAreaView>
  );
}

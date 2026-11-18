import { useCallback, useRef } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import AppLoader from '../components/AppLoader';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ustaRoute } from '../navigation/params';
import useHomeData from './zakazchi-main/hooks/useHomeData';
import HomeHeader from './zakazchi-main/components/HomeHeader';
import QuickOrderCard from './zakazchi-main/components/QuickOrderCard';
import ActiveOrdersSection from './requests/components/ActiveOrdersSection';
import SectionHeader from './zakazchi-main/components/SectionHeader';
import SectionLoader from './zakazchi-main/components/SectionLoader';
import SectionError from './zakazchi-main/components/SectionError';
import ServiceCategories from './zakazchi-main/components/ServiceCategories';
import SeasonalJobs from './zakazchi-main/components/SeasonalJobs';
import TopWorkers from './zakazchi-main/components/TopWorkers';
import BenefitsSection from './zakazchi-main/components/BenefitsSection';
import useTabBarSpace from '../navigation/useTabBarSpace';

// Mijoz bosh sahifasi (pastki menyudagi "home" tabi). Boshqa ekranlarga o'tish expo-router orqali.
export default function ZakazchiMainScreen() {
  const bottomSpace = useTabBarSpace(90);
  const router = useRouter();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const home = useHomeData();

  // Bosh sahifaga qaytilganda shaxsiy xulosa (faol buyurtmalar) yangilanadi.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      home.refreshSummary();
    }, [home.refreshSummary])
  );

  // Mavsum kartasi bosilganda kategoriya tanlanadi va "Eng zo'r ustalar" bo'limiga o'tiladi.
  const scrollRef = useRef(null);
  const topWorkersY = useRef(0);
  const pickSeasonCategory = (categoryId) => {
    home.selectCategory(categoryId);
    scrollRef.current?.scrollTo({ y: Math.max(0, topWorkersY.current - 12), animated: true });
  };

  const openUsta = (usta) => router.push(ustaRoute(usta));

  // "Usta tanlay olmayapsizmi?" kartasi faqat faol buyurtmasi yo'q mijozga ko'rinadi
  // (ma'lumot kelguncha ko'rsatilmaydi — miltillab o'chib qolmasligi uchun).
  const showQuickOrder =
    !home.summary.loading && (home.summary.data?.activeOrders.length ?? 0) === 0;

  const hasPersonal =
    !!home.summary.data &&
    (home.summary.data.activeOrders.length > 0 || !!home.summary.data.lastDone);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
        refreshControl={
          <RefreshControl
            refreshing={home.refreshing}
            onRefresh={home.refresh}
            tintColor={t.orange}
            colors={[t.orange]}
          />
        }
      >
        <HomeHeader />

        <View style={{ paddingHorizontal: 20 }}>
          {showQuickOrder && <QuickOrderCard onPress={() => router.navigate('/new-order')} />}
          <ActiveOrdersSection
            orders={home.summary.data?.activeOrders ?? []}
            categories={home.categories.data ?? []}
            style={{ marginBottom: 6 }}
          />
        </View>

        {home.initialLoading ? (
          <View style={{ paddingVertical: 140, alignItems: 'center', justifyContent: 'center' }}>
            <AppLoader size={180} />
          </View>
        ) : home.allFailed ? (
          <SectionError style={{ marginHorizontal: 20, marginTop: 24 }} onRetry={home.refresh} />
        ) : (
          <>
            {/* ── Xizmatlar ── */}
            <View style={{ marginTop: 24 }}>
              <SectionHeader
                title={tr('app.taklifXizmatlar.title')}
                actionLabel={tr('common.seeAll')}
                onActionPress={() => router.navigate('/services')}
                style={{ paddingHorizontal: 20 }}
              />
              {home.categories.loading ? (
                <SectionLoader height={140} />
              ) : home.categories.error ? (
                <SectionError
                  style={{ marginHorizontal: 20 }}
                  onRetry={() => home.retry('categories')}
                />
              ) : (
                <ServiceCategories
                  categories={home.categories.data ?? []}
                  selectedId={home.selectedCategoryId}
                  onSelect={home.selectCategory}
                />
              )}
            </View>

            {/* ── Mavsum ishlari ── */}
            <SeasonalJobs
              categories={home.categories.data ?? []}
              onPick={pickSeasonCategory}
              style={{ marginTop: 24 }}
            />

            {/* ── Top ustalar ── */}
            <View
              style={{ paddingHorizontal: 20, marginTop: 24 }}
              onLayout={(e) => {
                topWorkersY.current = e.nativeEvent.layout.y;
              }}
            >
              <SectionHeader
                title={tr('app.engZorUstalar.title')}
                actionLabel={tr('app.engZorUstalar.all')}
                onActionPress={() => router.push('/workers')}
              />
              <TopWorkers
                state={home.workers}
                onSelectUsta={openUsta}
                onRetry={() => home.retry('workers')}
              />
            </View>

            {/* ── Buyurtmasi yo'q mijozga "Nega HARNA?" ── */}
            {!home.summary.loading && !hasPersonal && (
              <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                <BenefitsSection
                  stats={home.stats.data}
                  onOpenGuarantee={() => router.push('/help')}
                  onOpenVerified={() =>
                    router.navigate({ pathname: '/services', params: { verified: '1' } })
                  }
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import {
  Stack,
  useRouter,
  usePathname,
  useRootNavigationState,
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient, persistOptions } from '../queries/client';
import { AppAlertHost } from '../components/AppAlert';
import BiometricLockScreen from '../screens/BiometricLockScreen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { UserProvider } from '../context/UserContext';
import { markStartup } from '../utils/startup';
import usePushNotifications from '../hooks/usePushNotifications';
import usePreferencesSync from '../hooks/usePreferencesSync';
import ConsentGate from '../components/ConsentGate';
import RealtimeSync from '../realtime/RealtimeSync';

// Native splash birinchi ekran tayyor bo'lguncha turadi: bo'sh ekran va alohida yuklagich bosqichi yo'q.
SplashScreen.preventAutoHideAsync();
let splashHidden = false;
const hideSplash = () => {
  if (splashHidden) return;
  splashHidden = true;
  SplashScreen.hide();
  markStartup('splash yopildi (birinchi ekran tayyor)');
};

// Ilova ildizi: providerlar va asosiy Stack. Marshrutlar `src/app/` papkasidagi fayllardan olinadi.
//  - mehmon:   index (landing), login
//  - mijoz:    (tabs) va undan ochiladigan ekranlar (hamyon, buyurtmalar, profil sahifalari ...)
//  - hammaga:  usta/[id], work, listings, listing/[id], reels, workers, document
export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <LanguageProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <KeyboardProvider>
              <AuthProvider>
                <RootNavigator />
                <AppAlertHost />
              </AuthProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </LanguageProvider>
    </PersistQueryClientProvider>
  );
}

function RootNavigator() {
  const { checked, locked, unlocking, retryUnlock, abandonSession, signedIn } = useAuth();
  const { theme: t } = useTheme();

  // Navigatsiya fon rangi ilova mavzusi bilan bir xil bo'lishi kerak, aks holda ekran almashganda
  // (ayniqsa "Orqaga" bosilganda) standart oq/kulrang fon bir lahza ko'rinib qoladi.
  const navTheme = useMemo(() => {
    const base = t.isDark ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: t.bg, card: t.bg } };
  }, [t]);

  useEffect(() => {
    if (checked) markStartup(`sessiya tekshirildi (signedIn=${signedIn})`);
  }, [checked, signedIn]);

  // Sessiya tekshirilguncha native splash ko'rinib turadi, shuning uchun bu yerda hech narsa chizilmaydi.
  if (!checked) return null;

  if (locked) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }} onLayout={hideSplash}>
        <StatusBar style="light" />
        <BiometricLockScreen
          unlocking={unlocking}
          onRetry={retryUnlock}
          onUseOtherAccount={abandonSession}
        />
      </View>
    );
  }

  return (
    <UserProvider enabled={signedIn}>
      <NavigationThemeProvider value={navTheme}>
        <View style={{ flex: 1, backgroundColor: t.bg }} onLayout={hideSplash}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="orders" />
              <Stack.Screen name="order/[id]" />
              <Stack.Screen name="order-worker" />
              <Stack.Screen name="addresses" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="help" />
              <Stack.Screen name="help-menu" />
              <Stack.Screen name="security" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="edit-profile" />
              <Stack.Screen name="change-password" />
              <Stack.Screen name="change-phone" />
              <Stack.Screen name="my-rating" />
              <Stack.Screen name="verify-identity" />
              <Stack.Screen name="verify-email" />
              <Stack.Screen name="favorites" />
              <Stack.Screen name="request/[id]" />
              <Stack.Screen name="chat" />
              <Stack.Screen name="support" />
              <Stack.Screen name="support-chat" />
              <Stack.Screen name="delete-account" />
              <Stack.Screen name="complaint" />
              <Stack.Screen name="my-complaints" />
              <Stack.Screen name="company" />
              <Stack.Screen name="company-form" />
              <Stack.Screen name="company-site" />
              <Stack.Screen name="company-plan" />
              <Stack.Screen name="company-member" />
              <Stack.Screen name="company-statement" />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
            </Stack.Protected>
            <Stack.Screen name="usta/[id]" />
            <Stack.Screen name="guest-order" />
            <Stack.Screen name="work" />
            <Stack.Screen name="listings" />
            <Stack.Screen name="listing/[id]" />
            <Stack.Screen name="reels" options={{ animation: 'fade' }} />
            <Stack.Screen name="workers" />
            <Stack.Screen name="document" />
            <Stack.Screen name="articles" />
            <Stack.Screen name="article/[slug]" />
          </Stack>
          <AuthRedirect />
          <PushNotifications />
          <RealtimeSync enabled={signedIn} />
          <PreferencesSync />
          <ConsentGate />
        </View>
      </NavigationThemeProvider>
    </UserProvider>
  );
}

// Push: token yuborish va bildirishnoma bosilganda ekran ochish. AuthRedirect'dan keyin turadi,
// shunda uning effekti avval ishlab, push ochgan ekran bosh sahifa ustida qoladi.
function PushNotifications() {
  usePushNotifications();
  return null;
}

// Til va mavzu hisob bilan sinxronlanadi (boshqa qurilmada ham shu tanlov chiqadi).
function PreferencesSync() {
  usePreferencesSync();
  return null;
}

// Kirish/chiqish holati o'zgarganda tegishli bosh ekranga o'tkazadi (masalan, mehmon sifatida
// usta sahifasidan login qilgach, usta sahifasi emas, bosh sahifa ochiladi).
function AuthRedirect() {
  const { signedIn } = useAuth();
  const router = useRouter();
  const navState = useRootNavigationState();
  const pathname = usePathname();
  const previous = useRef(null);

  useEffect(() => {
    if (!navState?.key || previous.current === signedIn) return;
    const isFirst = previous.current === null;
    previous.current = signedIn;
    // Mehmon buyurtmasi: kirgach ham forma ochiq qoladi, buyurtma yaratilgach ekranning o'zi bosh sahifaga o'tadi.
    if (signedIn && pathname === '/guest-order') return;
    // Havola (App Link) orqali sovuq ishga tushganda ochilgan sahifa bosh sahifa bilan almashtirilmaydi.
    if (
      isFirst &&
      signedIn &&
      /^\/(usta|mutaxassis|listing|listings|maqolalar|article)\//.test(pathname)
    ) {
      return;
    }
    if (signedIn) router.replace('/home');
    else if (!isFirst) router.replace('/');
  }, [signedIn, navState?.key, router, pathname]);

  return null;
}

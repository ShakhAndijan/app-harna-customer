import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardState } from 'react-native-keyboard-controller';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../context/ThemeContext';
import { useReelsChromeHidden } from './reelsChrome';

// Marshrut nomi ↔ BottomNav kaliti. `services` menyuda yo'q — u bosh sahifadan ochiladi, shuning uchun
// uning ustida "Asosiy" belgilanib turadi.
const ROUTE_TO_KEY = {
  home: 'home',
  'new-order': 'newOrder',
  ads: 'ads',
  services: 'home',
  profile: 'profile',
};
const KEY_TO_ROUTE = { home: 'home', newOrder: 'new-order', ads: 'ads', profile: 'profile' };

// Expo Router 58: tabBar props'da `navigation` yo'q, o'rniga `emitter` va `navigateToTab` keladi.
// Mavjud suzuvchi BottomNav dizayni Tabs navigatoriga `tabBar` sifatida ulanadi.
// O'ram oynasi ixtiyoriy balandlikda: Android o'ram chegarasidan tashqaridagi bosishlarni o'tkazmaydi.
export default function AppTabBar({ state, emitter, navigateToTab }) {
  const { theme: t } = useTheme();
  const activeRoute = state.routes[state.index];
  const bottomInset = useSafeAreaInsets().bottom;
  const keyboardVisible = useKeyboardState((st) => st.isVisible);

  // "E'lonlar" tabida rasmga bosilganda menyu sekin pastga tushib yashirinadi (yana bosilsa qaytadi).
  const chromeHidden = useReelsChromeHidden() && activeRoute.name === 'ads';
  const [hide] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(hide, {
      toValue: chromeHidden ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [chromeHidden, hide]);

  // Klaviatura ochiq paytda menyu yashiriladi: aks holda u klaviatura ustiga ko'tarilib, kontentni yopadi
  // va skrollni to'sadi.
  if (keyboardVisible) return null;

  const onTabChange = (key) => {
    const route = state.routes.find((r) => r.name === KEY_TO_ROUTE[key]);
    if (!route) return;
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented && route.key !== activeRoute.key) {
      navigateToTab(route.key);
    }
  };

  return (
    <Animated.View
      pointerEvents={chromeHidden ? 'none' : 'box-none'}
      style={[
        s.wrap,
        {
          height: 130 + bottomInset,
          opacity: hide.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [
            { translateY: hide.interpolate({ inputRange: [0, 1], outputRange: [0, 130] }) },
          ],
        },
      ]}
    >
      <BottomNav
        activeTab={ROUTE_TO_KEY[activeRoute.name]}
        onTabChange={onTabChange}
        accent={t.orange}
        background={t.navBg}
        border={t.border}
        muted={t.faint}
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 },
});

import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

const W = 68;
const H = 36;

// Zamonaviy kun/tun almashtirgich: tabletka shaklidagi yo'lak, ustida siljiydigan doira.
export default function ThemeToggleButton() {
  const { theme: t, toggleTheme } = useTheme();
  const { t: tr } = useLanguage();
  const dark = !!t.isDark;
  const [x] = useState(() => new Animated.Value(dark ? 1 : 0));

  useEffect(() => {
    Animated.spring(x, { toValue: dark ? 1 : 0, useNativeDriver: true, bounciness: 8 }).start();
  }, [dark, x]);

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.85}
      accessibilityRole="switch"
      accessibilityState={{ checked: dark }}
      accessibilityLabel={tr('profile.theme')}
      style={{
        width: W,
        height: H,
        borderRadius: H / 2,
        padding: 3,
        justifyContent: 'center',
        backgroundColor: dark ? '#1d2a44' : '#dbe7fb',
        borderWidth: 1,
        borderColor: dark ? '#2f4268' : '#b9cdf0',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 9,
          right: 9,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Ionicons name="sunny" size={15} color={dark ? '#5d6f93' : '#f5a623'} />
        <Ionicons name="moon" size={14} color={dark ? '#cfd9f2' : '#8fa4cc'} />
      </View>
      <Animated.View
        style={{
          width: H - 8,
          height: H - 8,
          borderRadius: (H - 8) / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark ? t.orange : '#fff',
          transform: [
            { translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, W - H] }) },
          ],
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        }}
      >
        <Ionicons name={dark ? 'moon' : 'sunny'} size={15} color={dark ? '#fff' : '#f5a623'} />
      </Animated.View>
    </TouchableOpacity>
  );
}

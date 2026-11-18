import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

// Faollik ko'rsatkichlari: buyurtmalar, sevimli ustalar, mijoz reytingi. Olinmagan qiymat — "—".
// Uchta alohida kartochka; profil tepa blokining pastki chetiga suzib turadi.
// `onOrdersPress` berilsa "Buyurtma" kartasi buyurtmalar tarixini ochadi.
export default function ActivityStats({ stats, onOrdersPress }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  const items = [
    {
      key: 'orders',
      value: stats.orders ?? '—',
      label: tr('profile.stats.orders'),
      icon: 'clipboard-text-outline',
      color: t.orange,
      onPress: onOrdersPress,
    },
    {
      key: 'favorites',
      value: stats.favorites ?? '—',
      label: tr('profile.stats.favoriteMasters'),
      icon: 'heart-outline',
      color: t.red,
    },
    {
      key: 'rating',
      value: stats.rating != null ? stats.rating.toFixed(1) : '—',
      label: tr('profile.stats.yourRating'),
      icon: 'star-outline',
      color: t.gold,
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.key}
          activeOpacity={item.onPress ? 0.75 : 1}
          disabled={!item.onPress}
          onPress={item.onPress}
          accessibilityRole={item.onPress ? 'button' : undefined}
          style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
        >
          <View style={[styles.iconBubble, { backgroundColor: item.color + '22' }]}>
            <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
          </View>
          <Text style={[styles.value, { color: t.text }]} numberOfLines={1}>
            {item.value}
          </Text>
          <Text
            style={[styles.label, { color: t.muted }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: -34 },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontWeight: '800', fontSize: 21, letterSpacing: -0.3, marginTop: 8 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});

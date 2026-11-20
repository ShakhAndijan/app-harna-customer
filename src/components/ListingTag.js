import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

// Buyurtma e'lon orqali berilgan bo'lsa: "E'lon: Rozetka o'rnatish · #AB12CD34". Server e'lon nomi va kodini
// buyurtma shu e'lon orqali kelgan paytdagina beradi (`listing_title`, `listing_code`), aks holda hech narsa chiqmaydi.
export const listingLabel = (order) =>
  [order?.listingTitle, order?.listingCode && `#${order.listingCode}`].filter(Boolean).join(' · ');

export default function ListingTag({ order, style }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const label = listingLabel(order);
  if (!label) return null;
  return (
    <View style={[s.tag, { backgroundColor: t.card2 ?? t.card, borderColor: t.border }, style]}>
      <MaterialCommunityIcons name="bullhorn-outline" size={13} color={t.muted} />
      <Text style={[s.text, { color: t.muted }]} numberOfLines={1}>
        {`${tr('orderHistory.listing')}: ${label}`}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 5,
    paddingVertical: 3,
    paddingLeft: 7,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: { fontSize: 11.5, fontWeight: '700', flexShrink: 1 },
});

import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

// «Shoshilinch» faqat hali yopilmagan buyurtmaga tegishli: bajarilgan yoki bekor qilingandan keyin
// shoshilinchlikning ma'nosi qolmaydi.
export const isUrgentOpen = (order) =>
  !!order?.isUrgent && order.rawStatus !== 'completed' && order.rawStatus !== 'cancelled';

// Shoshilinch buyurtma belgisi: boshqa belgilardan ajralib turishi uchun qizil rangda.
// Buyurtma shoshilinch bo'lmasa hech narsa chiqmaydi.
export default function UrgentTag({ order, style }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  if (!isUrgentOpen(order)) return null;
  return (
    <View style={[s.tag, { backgroundColor: t.red + '1f', borderColor: t.red + '55' }, style]}>
      <MaterialCommunityIcons name="lightning-bolt" size={13} color={t.red} />
      <Text style={[s.text, { color: t.red }]} numberOfLines={1}>
        {tr('orderFlow.timing.urgent')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    paddingVertical: 3,
    paddingLeft: 6,
    paddingRight: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: { fontSize: 11.5, fontWeight: '800' },
});

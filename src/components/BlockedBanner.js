import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime } from '../utils/format';

// «Hisobingiz … gacha cheklangan» — bloklangan foydalanuvchiga sababi bilan aytiladi (sayt BlockedBanner'i).
// Blok serverda deyarli har bir so'rovga rad javobini beradi; bu bannersiz ilova "hech narsa ishlamaydigan"
// bo'lib qoladi. Muddat soat bilan ham tekshiriladi: ekran ochiq turganda blok tugasa, keyingi chizishda yo'qoladi.
export default function BlockedBanner({ until, reason, style }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  if (!until || !(new Date(until) > new Date())) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[s.box, { backgroundColor: t.card, borderColor: t.red }, style]}
    >
      <Text style={[s.title, { color: t.red }]}>
        {`⛔ ${tr('block.title', { until: formatDateTime(until) })}`}
      </Text>
      {!!reason && <Text style={[s.text, { color: t.text }]}>{reason}</Text>}
      <Text style={[s.text, { color: t.muted }]}>{tr('block.body')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  title: { fontSize: 15, fontWeight: '800', lineHeight: 21 },
  text: { fontSize: 13.5, lineHeight: 19 },
});

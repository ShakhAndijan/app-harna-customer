import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { formatDateTime } from '../../../utils/format';

// Buyurtma tarixi (saytdagi "История"): yaratildi → qabul qilindi → kelishildi → bajarildi →
// yakunlandi / bekor qilindi. Vaqti noma'lum bosqichlar ko'rsatilmaydi.
export function historyRows(order) {
  const at = (value) => (value ? formatDateTime(value) : null);
  return [
    { key: 'created', label: 'created', value: at(order.createdAt), tone: 'faint' },
    {
      key: 'listing',
      label: 'listing',
      value: order.listingTitle
        ? [order.listingTitle, order.listingCode && `#${order.listingCode}`]
            .filter(Boolean)
            .join(' · ')
        : null,
      tone: 'faint',
    },
    { key: 'accepted', label: 'accepted', value: at(order.acceptedAt), tone: 'green' },
    { key: 'agreed', label: 'agreed', value: at(order.agreedAt), tone: 'orange' },
    { key: 'workDone', label: 'workDone', value: at(order.workerDoneAt), tone: 'blue' },
    { key: 'completed', label: 'completed', value: at(order.completedAt), tone: 'green' },
    { key: 'cancelled', label: 'cancelled', value: at(order.cancelledAt), tone: 'red' },
  ].filter((row) => !!row.value);
}

export default function OrderHistory({ order }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const rows = historyRows(order);
  if (rows.length === 0) return null;

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {rows.map((row, i) => {
        const color = t[row.tone] ?? t.faint;
        const last = i === rows.length - 1;
        return (
          <View key={row.key} style={s.row}>
            <View style={s.rail}>
              <View style={[s.dot, { backgroundColor: color }]} />
              {!last && <View style={[s.line, { backgroundColor: t.border }]} />}
            </View>
            <View style={[s.body, !last && { paddingBottom: 14 }]}>
              <Text style={[s.label, { color: t.muted }]}>{tr(`orderHistory.${row.label}`)}</Text>
              <Text style={[s.value, { color: t.text }]}>{row.value}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14 },
  row: { flexDirection: 'row', gap: 12 },
  rail: { width: 12, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { width: 2, flex: 1, marginTop: 4, borderRadius: 1 },
  body: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700' },
  value: { fontSize: 14, fontWeight: '700', marginTop: 2, lineHeight: 19 },
});

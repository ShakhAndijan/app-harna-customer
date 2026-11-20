import { View, Text, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatOrderDate, formatHours } from '../utils';
import { orderExtraRows } from '../extraFields';

const EXTRA_ICONS = { preferred: 'sunrise', tools: 'tool', age: 'user' };

function Row({ icon, label, value, t, last }) {
  return (
    <View style={[s.row, !last && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
      <View style={[s.tile, { backgroundColor: t.orange + '1c' }]}>
        <Feather name={icon} size={15} color={t.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.label, { color: t.muted }]}>{label}</Text>
        <Text style={[s.value, { color: t.text }]}>{value}</Text>
      </View>
    </View>
  );
}

// Buyurtma kartasi: xizmat turi, nom, raqam va manzil / sana / davomiylik qatorlari.
export default function OrderSummary({ order, title }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  const rows = [
    !!order.address && {
      icon: 'map-pin',
      label: tr('requests.summaryAddress'),
      value: order.address,
    },
    !!order.createdAt && {
      icon: 'calendar',
      label: tr('requests.summaryCreated'),
      value: formatOrderDate(order.createdAt, tr),
    },
    order.estimatedHours != null && {
      icon: 'clock',
      label: tr('orderDetail.estimatedHours'),
      value: tr('orderDetail.hours', { n: formatHours(order.estimatedHours) }),
    },
    ...orderExtraRows(order, tr).map((row) => ({ ...row, icon: EXTRA_ICONS[row.key] })),
  ].filter(Boolean);

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={s.top}>
        {!!order.service && (
          <View style={[s.chip, { backgroundColor: t.orange + '18' }]}>
            <Text style={[s.chipText, { color: t.orange }]} numberOfLines={1}>
              {order.service}
            </Text>
          </View>
        )}
        <Text style={[s.number, { color: t.faint }]}>
          {tr('orderDetail.orderNumber', { id: order.id })}
        </Text>
      </View>
      <Text style={[s.title, { color: t.text }]}>{title}</Text>

      {rows.length > 0 && (
        <View style={s.rows}>
          {rows.map((row, i) => (
            <Row key={row.icon} {...row} t={t} last={i === rows.length - 1} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 14 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, flexShrink: 1 },
  chipText: { fontSize: 11.5, fontWeight: '700' },
  number: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 19, fontWeight: '800', lineHeight: 25, letterSpacing: -0.2, marginTop: 10 },
  rows: { marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  tile: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11.5, fontWeight: '600' },
  value: { fontSize: 13.5, fontWeight: '700', marginTop: 1 },
});

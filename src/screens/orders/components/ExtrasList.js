import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../../../context/LanguageContext';
import { formatPrice, formatDeadline } from '../../requests/utils';

const ICON = { approved: 'check-circle', pending: 'clock-outline' };

// Buyurtmadagi barcha qo'shimcha ishlar va ularning holati (tasdiqlangan / kutilmoqda / rad etilgan).
export const extraTone = (t, status) =>
  status === 'approved' ? t.green : status === 'pending' ? t.gold : t.faint;

export function extraStatusText(tr, x) {
  switch (x.status) {
    case 'pending':
      return tr('extraWork.status.pending', { when: formatDeadline(tr, x.deadline) });
    case 'approved':
      return tr('extraWork.status.approved');
    case 'declined':
      return tr('extraWork.status.declined');
    case 'lapsed':
      return tr('extraWork.status.lapsed');
    default:
      return tr('extraWork.status.closed');
  }
}

export default function ExtrasList({ extras, t }) {
  const { t: tr } = useLanguage();

  const tone = (status) => extraTone(t, status);
  const statusText = (x) => extraStatusText(tr, x);

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {extras.map((x, i) => (
        <View key={x.id} style={[s.row, i > 0 && { borderTopWidth: 1, borderTopColor: t.border }]}>
          <MaterialCommunityIcons
            name={ICON[x.status] ?? 'close-circle-outline'}
            size={20}
            color={tone(x.status)}
          />
          <View style={{ flex: 1 }}>
            <View style={s.top}>
              <Text style={[s.title, { color: t.text }]}>{x.title || '—'}</Text>
              {x.price != null && (
                <Text style={[s.price, { color: t.text }]}>{formatPrice(tr, x.price)}</Text>
              )}
            </View>
            <Text style={[s.status, { color: tone(x.status) }]}>{statusText(x)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  price: { fontSize: 13, fontWeight: '800' },
  status: { fontSize: 12, fontWeight: '700', marginTop: 3 },
});

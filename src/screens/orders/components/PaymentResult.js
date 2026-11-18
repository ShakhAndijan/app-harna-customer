import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatNumber } from '../../../utils/format';

// To'lov natijasi: "To'langan" (summa bilan) yoki "To'lov bekor qilindi" (operator izohi bilan).
// Hisobdan olinadigan tizim haqi (`fee_tiyin`) ustaning ulushidan: mijozga ko'rsatilmaydi.
export default function PaymentResult({ order }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const refunded = order.paymentStatus === 'refunded';
  const color = refunded ? t.blue : t.green;

  return (
    <View style={[s.card, { backgroundColor: color + '14', borderColor: color + '55' }]}>
      <MaterialCommunityIcons
        name={refunded ? 'cash-refund' : 'check-circle-outline'}
        size={24}
        color={color}
      />
      <View style={s.body}>
        <Text style={[s.title, { color: t.text }]}>
          {refunded ? tr('orderDetail.payRefunded') : tr('orderDetail.paymentStatus.paid')}
        </Text>
        {order.paidAmount > 0 && (
          <Text style={[s.text, { color: t.muted }]}>
            {formatNumber(Math.round(order.paidAmount))} {tr('common.currencySom')}
          </Text>
        )}
        {refunded && !!order.refundReason && (
          <Text style={[s.text, { color: t.muted }]}>{order.refundReason}</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
  },
  body: { flex: 1 },
  title: { fontSize: 14.5, fontWeight: '800' },
  text: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});

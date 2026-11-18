import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../../../context/LanguageContext';
import { formatNumber } from '../../../utils/format';

// Bajarilgan buyurtma uchun onlayn to'lov: summa (buyurtma narxidan to'ldiriladi, o'zgartirsa bo'ladi)
// va "Onlayn to'lash" tugmasi. Chegaradan tashqari summa yuborilmaydi — chegara raqami bilan aytiladi.
// `blockedNote` berilsa (masalan, to'lov tizimi ulanmagan) tugma ishlamaydi.
export default function PayCard({ amount, min, max, busy, blockedNote, processing, onPay, t }) {
  const { t: tr } = useLanguage();
  const [text, setText] = useState(() => formatNumber(Math.round(amount)));
  const value = Number(text.replace(/\D/g, '')) || 0;

  const limitNote =
    value > 0 && value < min
      ? tr('orderDetail.payBelowMin', { min: formatNumber(min) })
      : value > max
        ? tr('orderDetail.payAboveMax', { max: formatNumber(max) })
        : null;
  const note = blockedNote ?? limitNote;
  const disabled = busy || !!blockedNote || value <= 0 || !!limitNote;

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[s.label, { color: t.muted }]}>{tr('orderDetail.payTitle')}</Text>
      <View
        style={[
          s.inputRow,
          { backgroundColor: t.inputBg, borderColor: limitNote ? t.red : t.border },
        ]}
      >
        <TextInput
          style={[s.input, { color: t.text }]}
          value={text}
          onChangeText={(v) => {
            const n = v.replace(/\D/g, '').slice(0, 10);
            setText(n ? formatNumber(Number(n)) : '');
          }}
          keyboardType="number-pad"
          editable={!busy && !blockedNote}
          placeholderTextColor={t.faint}
          accessibilityLabel={tr('orderDetail.payTitle')}
        />
        <Text style={[s.suffix, { color: t.muted }]}>{tr('common.currencySom')}</Text>
      </View>
      {processing && (
        <View style={s.processing}>
          <MaterialCommunityIcons name="clock-outline" size={15} color={t.gold} />
          <Text style={[s.note, { color: t.muted, flex: 1 }]}>
            {tr('orderDetail.payProcessing')}
          </Text>
        </View>
      )}
      {!!note && <Text style={[s.note, { color: limitNote ? t.red : t.muted }]}>{note}</Text>}
      <TouchableOpacity
        style={[s.btn, { backgroundColor: t.orange, opacity: disabled && !busy ? 0.45 : 1 }]}
        activeOpacity={0.85}
        disabled={disabled}
        onPress={() => onPay(value)}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons name="credit-card-outline" size={17} color="#fff" />
            <Text style={s.btnText}>{tr('orderDetail.payOnline')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 10 },
  label: { fontSize: 12, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, fontSize: 18, fontWeight: '800', padding: 0 },
  suffix: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  note: { fontSize: 12.5, lineHeight: 18 },
  processing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: {
    height: 46,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
  },
  btnText: { color: '#fff', fontSize: 13.5, fontWeight: '800' },
});

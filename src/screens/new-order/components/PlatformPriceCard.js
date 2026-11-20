import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { common } from '../styles';
import { amountText } from '../platformPrice';

// Narxni platforma belgilagan buyurtmaning narx qutisi (saytdagi `PlatformPriceCard`): faqat o'qiladi.
// Viloyat ma'lum bo'lsa aniq summa; yo'q bo'lsa — bitta son (viloyatlar farq qilmasa) yoki oraliq va
// "manzil tanlangach ko'rinadi". Bir nechta ish bo'lsa har biri alohida qatorda. Pastda ikki izoh: narxni
// platforma belgilagan (faqat kun kelishiladi) va u butun ish uchun (odamlar soniga bog'liq emas).
export default function PlatformPriceCard({ quote }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const varies = quote.exact == null && quote.low !== quote.high;

  return (
    <>
      <Text style={[common.label, { color: t.text }]}>{tr('platformPrice.label')}</Text>
      <View style={[s.card, { backgroundColor: t.card, borderColor: t.orange }]}>
        <View style={s.head}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={t.orange} />
          <Text style={[s.amount, { color: t.text }]}>{amountText(tr, quote)}</Text>
        </View>
        {varies && (
          <Text style={[s.hint, { color: t.muted }]}>{tr('platformPrice.pickRegion')}</Text>
        )}
        {quote.perTask.length > 1 &&
          quote.perTask.map((task) => (
            <View key={task.id} style={s.task}>
              <Text style={[s.taskName, { color: t.text }]} numberOfLines={2}>
                {task.name}
              </Text>
              <Text style={[s.taskPrice, { color: t.text }]}>
                {amountText(tr, { exact: task.price, low: task.low, high: task.high })}
              </Text>
            </View>
          ))}
      </View>
      <Text style={[s.note, { color: t.muted }]}>{tr('platformPrice.note')}</Text>
      <Text style={[s.note, { color: t.muted }]}>{tr('platformPrice.wholeJob')}</Text>
    </>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 18, padding: 14, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: { flex: 1, fontSize: 18, fontWeight: '800' },
  hint: { fontSize: 12.5, lineHeight: 17 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskName: { flex: 1, fontSize: 13.5 },
  taskPrice: { fontSize: 13.5, fontWeight: '700' },
  note: { fontSize: 12.5, lineHeight: 18, marginTop: 6 },
});

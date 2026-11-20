import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { depositNoticeLines } from './utils';

// Buyurtma formasida «Tasdiqlash» yonidagi eslatma: hozir berilgan buyurtma omonat kutadigan bo'lsa
// summa va to'lash vaqti, nima bo'lishi va nega so'ralayotgani aytiladi. Talab qilinmasa hech narsa ko'rinmaydi.
export default function DepositNeedNotice({ need, onLayout }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const lines = depositNoticeLines(tr, need);
  if (!lines) return null;
  return (
    <View
      accessibilityRole="text"
      onLayout={onLayout}
      style={[s.box, { backgroundColor: t.gold + '1f', borderColor: t.gold + '66' }]}
    >
      <View style={s.head}>
        <Text style={[s.title, { color: t.text }]}>{lines[0]}</Text>
      </View>
      {lines.slice(1).map((line) => (
        <Text key={line} style={[s.line, { color: t.muted }]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  line: { fontSize: 13, lineHeight: 19 },
});

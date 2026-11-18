import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { windowLabel } from '../arrival';

// Usta kelish vaqti oralig'i: "Farqi yo'q" yoki soatlik oraliqlardan biri (masalan 13:00–14:00).
// `slots` — tanlash mumkin boshlanish vaqtlari; bo'sh bo'lsa (bugun hammasi o'tib ketgan) izoh chiqadi.
export default function WindowField({ slots, value, minutes, onChange }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  const chip = (key, label, selected, onPress) => (
    <TouchableOpacity
      key={key}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        s.chip,
        selected
          ? { backgroundColor: t.orange, borderColor: t.orange }
          : { backgroundColor: t.inputBg, borderColor: t.border },
      ]}
    >
      <Text style={[s.chipTxt, { color: selected ? '#fff' : t.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ gap: 8 }}>
      <View style={s.wrap}>
        {chip('any', tr('orderFlow.order.windowAny'), value == null, () => onChange(null))}
        {slots.map((time) =>
          chip(time, windowLabel(time, null, minutes), value === time, () => onChange(time))
        )}
      </View>
      {slots.length === 0 && (
        <Text style={[s.note, { color: t.muted }]}>{tr('orderFlow.order.windowNone')}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  chipTxt: { fontSize: 12.5, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 17 },
});

import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

// «Taklif: Santexnika» — punktir chiziqli chip: tanlangan emas, taklif qilingan narsa. Bosilsa yo'nalish
// tanlanadi; `blocked` (narxli va kelishiladigan ish aralashadi) va `full` (10 ta to'lgan) bo'lsa xira.
export default function CategorySuggestChip({ name, blocked, full, onPress }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const off = blocked || full;

  return (
    <TouchableOpacity
      onPress={off ? undefined : onPress}
      activeOpacity={off ? 1 : 0.85}
      accessibilityRole="button"
      accessibilityLabel={`${tr('categorySuggest.label')} ${name}`}
      accessibilityState={{ disabled: off }}
      style={[
        s.chip,
        { borderColor: t.orange, backgroundColor: t.orange + '14' },
        off && { opacity: 0.5 },
      ]}
    >
      <MaterialCommunityIcons name="lightbulb-outline" size={16} color={t.orange} />
      <Text style={[s.label, { color: t.muted }]}>{tr('categorySuggest.label')}</Text>
      <Text style={[s.name, { color: t.text }]}>{name}</Text>
      {blocked && <Text style={[s.note, { color: t.muted }]}>{tr('platformPrice.separate')}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  label: { fontSize: 14, fontWeight: '600' },
  name: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  note: { fontSize: 11.5, fontWeight: '600' },
});

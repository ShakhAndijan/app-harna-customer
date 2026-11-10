import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

// E'lonlar ro'yxati tepasidagi qidiruv: oxiridagi filtr belgisi yo'nalish, narx, mutaxassis kabi
// hamma filtrlarni bitta oynada ochadi. Holat ekranda turadi, bu yerda faqat chiziladi.
export default function ListingsFilters({
  saved,
  query,
  onQueryChange,
  onOpenFilters,
  filtersActive,
}) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  if (saved) return null;

  return (
    <View style={s.wrap}>
      <View style={[s.search, { backgroundColor: t.card, borderColor: t.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={t.muted} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={tr('listings.searchPlaceholder')}
          placeholderTextColor={t.faint}
          returnKeyType="search"
          style={[s.searchInput, { color: t.text }]}
        />
        {!!query && (
          <TouchableOpacity
            onPress={() => onQueryChange('')}
            hitSlop={10}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={t.faint} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onOpenFilters}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={tr('listings.reels.filterTitle')}
          style={[
            s.filterBtn,
            { backgroundColor: filtersActive ? t.orange : t.card2, borderColor: t.border },
          ]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={18}
            color={filtersActive ? '#fff' : t.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 5,
    marginHorizontal: 20,
  },
  searchInput: { flex: 1, fontSize: 14.5, padding: 0 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

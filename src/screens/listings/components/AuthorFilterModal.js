import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import Avatar from '../../../components/Avatar';
import { searchListingAuthors } from '../../../api/listings';

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

// "Mutaxassis" filtri oynasi: ism yoki to'liq telefon raqami bo'yicha qidirib, bitta muallifni tanlash.
// Qidiruv matni yozilganicha yuboriladi (server ikkala alifboni o'zi moslaydi).
export default function AuthorFilterModal({ visible, selected, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {visible && <Sheet selected={selected} onPick={onPick} onClose={onClose} />}
    </Modal>
  );
}

function Sheet({ selected, onPick, onClose }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setQ(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [input]);

  const enabled = q.length >= MIN_LENGTH;
  const { data, isFetching } = useQuery({
    queryKey: ['listings', 'authors', q],
    queryFn: () => searchListingAuthors(q),
    enabled,
    staleTime: 60 * 1000,
  });
  const authors = enabled ? (data ?? []) : [];
  // Faqat raqam yozilgan, to'liq telefon (9 raqam) emas va natija yo'q: to'liq yozish so'raladi.
  const partialPhone = /^[ds+()-]+$/.test(q) && q.replace(/D/g, '').length < 9;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.backdrop}
    >
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={[s.card, { backgroundColor: t.bg, borderColor: t.border }]}>
        <View style={s.head}>
          <Text style={[s.title, { color: t.text }]}>{tr('listings.filters.authorTitle')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={22} color={t.muted} />
          </TouchableOpacity>
        </View>

        <View style={[s.search, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={t.muted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={tr('listings.filters.authorSearch')}
            placeholderTextColor={t.faint}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
            style={[s.input, { color: t.text }]}
          />
          {isFetching && <ActivityIndicator size="small" color={t.orange} />}
        </View>

        {!enabled ? (
          <Text style={[s.hint, { color: t.muted }]}>{tr('listings.filters.authorHint')}</Text>
        ) : !isFetching && authors.length === 0 ? (
          <Text style={[s.hint, { color: t.muted }]}>
            {tr(partialPhone ? 'listings.filters.authorPhoneFull' : 'listings.filters.authorEmpty')}
          </Text>
        ) : (
          <FlatList
            data={authors}
            keyExtractor={(a) => String(a.id)}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 320, marginTop: 10 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  s.row,
                  {
                    backgroundColor: t.card,
                    borderColor: selected?.id === item.id ? t.orange : t.border,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => onPick({ id: item.id, name: item.name })}
              >
                <Avatar
                  letter={item.name?.[0]?.toUpperCase() ?? '?'}
                  size={40}
                  bgColor={t.orange}
                  uri={item.photo}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: t.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[s.meta, { color: t.muted }]} numberOfLines={1}>
                    {tr('listings.filters.authorCount', { n: item.listingCount })}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {!!selected && (
          <TouchableOpacity
            onPress={() => onPick(null)}
            activeOpacity={0.85}
            style={[s.clear, { borderColor: t.border, backgroundColor: t.card }]}
          >
            <Text style={[s.clearTxt, { color: t.text }]}>
              {tr('listings.filters.authorClear')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: { width: '100%', maxWidth: 400, borderRadius: 26, borderWidth: 1, padding: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '800' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  hint: { fontSize: 13, marginTop: 14, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
  },
  name: { fontSize: 14.5, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  clear: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  clearTxt: { fontSize: 14, fontWeight: '800' },
});

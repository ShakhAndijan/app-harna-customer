import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import AuthorFilterModal from './AuthorFilterModal';
import { digitsOnly, formatPrice } from '../utils';

const SORTS = [
  { key: 'new', label: 'listings.sort.new', icon: 'clock-outline' },
  { key: 'price_asc', label: 'listings.sort.cheap', icon: 'sort-numeric-ascending' },
  { key: 'price_desc', label: 'listings.sort.expensive', icon: 'sort-numeric-descending' },
  { key: 'rating', label: 'listings.sort.rating', icon: 'star-outline' },
];

function Chip({ label, icon, active, onPress }) {
  const { theme: t } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        s.chip,
        { backgroundColor: active ? t.orange : t.card, borderColor: active ? t.orange : t.border },
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons name={icon} size={15} color={active ? '#fff' : t.muted} />
      ) : null}
      <Text style={[s.chipTxt, { color: active ? '#fff' : t.text }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  const { theme: t } = useTheme();
  return (
    <View style={s.section}>
      <Text style={[s.label, { color: t.muted }]}>{title}</Text>
      {children}
    </View>
  );
}

// Bir qatorli gorizontal chiplar: yo'nalishlar sheet'ni cho'zib yubormaydi.
function Rail({ children }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.rail}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

// Yo'nalish tanlash oynasi: qidiruv + ochiladigan ro'yxat (asosiy yo'nalish bosilsa quyilari ochiladi).
function DirectionPicker({ visible, tree, parentId, subId, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {visible && (
        <PickerBody
          tree={tree}
          parentId={parentId}
          subId={subId}
          onPick={onPick}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function PickerBody({ tree, parentId, subId, onPick, onClose }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(parentId);
  const needle = q.trim().toLowerCase();

  const row = (key, label, active, onPress, extra = {}) => (
    <TouchableOpacity
      key={key}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      style={[s.pRow, extra.indent ? { paddingLeft: 30 } : null]}
    >
      <Text
        numberOfLines={1}
        style={[s.pTxt, { color: active ? t.orange : t.text, fontWeight: active ? '800' : '600' }]}
      >
        {label}
      </Text>
      {extra.chevron ? (
        <MaterialCommunityIcons name={extra.chevron} size={20} color={t.muted} />
      ) : active ? (
        <MaterialCommunityIcons name="check" size={20} color={t.orange} />
      ) : null}
    </TouchableOpacity>
  );

  const items = [];
  if (needle) {
    tree.forEach((c) => {
      if (c.name.toLowerCase().includes(needle)) {
        items.push(
          row('p' + c.id, c.name, parentId === c.id && subId == null, () => onPick(c.id, null))
        );
      }
      (c.children ?? [])
        .filter((k) => k.name.toLowerCase().includes(needle))
        .forEach((k) =>
          items.push(
            row('s' + k.id, c.name + ' › ' + k.name, subId === k.id, () => onPick(c.id, k.id))
          )
        );
    });
  } else {
    items.push(row('all', tr('listings.all'), parentId == null, () => onPick(null, null)));
    tree.forEach((c) => {
      const kids = c.children ?? [];
      const expanded = open === c.id;
      items.push(
        row(
          'p' + c.id,
          c.icon ? c.icon + ' ' + c.name : c.name,
          parentId === c.id,
          () => (kids.length ? setOpen(expanded ? null : c.id) : onPick(c.id, null)),
          { chevron: kids.length ? (expanded ? 'chevron-up' : 'chevron-down') : null }
        )
      );
      if (expanded) {
        items.push(
          row(
            'a' + c.id,
            tr('listings.allInDirection'),
            parentId === c.id && subId == null,
            () => onPick(c.id, null),
            {
              indent: true,
            }
          )
        );
        kids.forEach((k) =>
          items.push(
            row('s' + k.id, k.name, subId === k.id, () => onPick(c.id, k.id), { indent: true })
          )
        );
      }
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.pBackdrop}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[s.pCard, { backgroundColor: t.bg, borderColor: t.border }]}>
        <View style={[s.pSearch, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={t.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={tr('common.search')}
            placeholderTextColor={t.faint}
            style={[s.pInput, { color: t.text }]}
          />
          <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={20} color={t.muted} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {items}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// Reels filtri: saralash, narx, foto, mutaxassis va yo'nalish — hammasi bitta ixcham oynada.
// `value` — joriy filtr; "Qo'llash" bosilganda `onApply(yangi)` chaqiriladi.
export default function ReelFilterSheet({ tree, value, onApply, onClose, maxHeight, bottomInset }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [draft, setDraft] = useState(value);
  const [authorOpen, setAuthorOpen] = useState(false);
  const [dirOpen, setDirOpen] = useState(false);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setPrice = (patch) => setDraft((d) => ({ ...d, price: { ...d.price, ...patch } }));

  const price = draft.price;
  const parent = tree.find((c) => c.id === draft.parentId);
  const sub = parent?.children?.find((c) => c.id === draft.subId);
  const dirLabel = parent ? (sub ? `${parent.name} › ${sub.name}` : parent.name) : '';
  // "Kelishiladi" e'lonlarida narx yo'q, shuning uchun u tanlansa oraliq ma'nosiz.
  const rangeDisabled = price.priced === false;

  const apply = () => {
    const lo = price.priceMin ?? null;
    const hi = price.priceMax ?? null;
    const [priceMin, priceMax] = lo != null && hi != null && lo > hi ? [hi, lo] : [lo, hi];
    onApply({
      ...draft,
      price: {
        priceMin: rangeDisabled ? null : priceMin,
        priceMax: rangeDisabled ? null : priceMax,
        priced: price.priced ?? null,
      },
    });
  };

  const reset = () =>
    onApply({
      parentId: null,
      subId: null,
      sort: 'new',
      price: { priceMin: null, priceMax: null, priced: null },
      hasPhoto: false,
      author: null,
    });

  const field = (label, key) => (
    <View
      style={[
        s.inputBox,
        { backgroundColor: t.inputBg, borderColor: t.border, opacity: rangeDisabled ? 0.45 : 1 },
      ]}
    >
      <Text style={[s.inputLabel, { color: t.faint }]}>{label}</Text>
      <TextInput
        value={price[key] != null ? formatPrice(price[key]) : ''}
        onChangeText={(x) => {
          const d = digitsOnly(x).slice(0, 10);
          setPrice({ [key]: d ? Number(d) : null });
        }}
        editable={!rangeDisabled}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={t.faint}
        style={[s.input, { color: t.text }]}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={StyleSheet.absoluteFill}
    >
      <Pressable
        style={s.backdrop}
        onPress={onClose}
        accessibilityLabel={tr('listings.reels.close')}
      />
      <View
        style={[
          s.sheet,
          {
            backgroundColor: t.bg,
            borderColor: t.border,
            maxHeight,
            paddingBottom: bottomInset + 14,
          },
        ]}
      >
        <View style={s.head}>
          <Text style={[s.title, { color: t.text }]}>{tr('listings.reels.filterTitle')}</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={tr('listings.reels.close')}
          >
            <MaterialCommunityIcons name="close" size={22} color={t.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Section title={tr('listings.reels.secSort')}>
            <Rail>
              {SORTS.map((o) => (
                <Chip
                  key={o.key}
                  icon={o.icon}
                  label={tr(o.label)}
                  active={draft.sort === o.key}
                  onPress={() => set({ sort: o.key })}
                />
              ))}
            </Rail>
          </Section>

          <Section title={tr('listings.reels.secDirection')}>
            <TouchableOpacity
              onPress={() => setDirOpen(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={[s.select, { backgroundColor: t.inputBg, borderColor: t.border }]}
            >
              <MaterialCommunityIcons name="shape-outline" size={18} color={t.orange} />
              <Text numberOfLines={1} style={[s.selectTxt, { color: dirLabel ? t.text : t.faint }]}>
                {dirLabel || tr('listings.all')}
              </Text>
              {dirLabel ? (
                <TouchableOpacity
                  onPress={() => set({ parentId: null, subId: null })}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={tr('listings.filters.authorClear')}
                >
                  <MaterialCommunityIcons name="close-circle" size={18} color={t.muted} />
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="chevron-down" size={20} color={t.muted} />
              )}
            </TouchableOpacity>
          </Section>

          <Section title={tr('listings.reels.secPrice')}>
            <Rail>
              <Chip
                label={tr('listings.filters.any')}
                active={price.priced == null}
                onPress={() => setPrice({ priced: null })}
              />
              <Chip
                label={tr('listings.filters.withPrice')}
                active={price.priced === true}
                onPress={() => setPrice({ priced: true })}
              />
              <Chip
                label={tr('listings.negotiable')}
                active={price.priced === false}
                onPress={() => setPrice({ priced: false })}
              />
            </Rail>
            <View style={s.range}>
              {field(tr('listings.filters.from'), 'priceMin')}
              {field(tr('listings.filters.to'), 'priceMax')}
            </View>
          </Section>

          <Section title={tr('listings.reels.secMore')}>
            <Rail>
              <Chip
                icon="image-outline"
                label={tr('listings.filters.withPhoto')}
                active={!!draft.hasPhoto}
                onPress={() => set({ hasPhoto: !draft.hasPhoto })}
              />
              <Chip
                icon="account-search-outline"
                label={draft.author?.name || tr('listings.filters.author')}
                active={!!draft.author}
                onPress={() => setAuthorOpen(true)}
              />
            </Rail>
          </Section>
        </ScrollView>

        <View style={s.actions}>
          <TouchableOpacity
            onPress={reset}
            activeOpacity={0.85}
            style={[s.btn, { backgroundColor: t.card, borderColor: t.border, borderWidth: 1 }]}
          >
            <Text style={[s.btnTxt, { color: t.text }]}>{tr('listings.filters.reset')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={apply}
            activeOpacity={0.85}
            style={[s.btn, { backgroundColor: t.orange, flex: 1.4 }]}
          >
            <Text style={[s.btnTxt, { color: '#fff' }]}>{tr('listings.filters.apply')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DirectionPicker
        visible={dirOpen}
        tree={tree}
        parentId={draft.parentId}
        subId={draft.subId}
        onClose={() => setDirOpen(false)}
        onPick={(parentId, subId) => {
          set({ parentId, subId });
          setDirOpen(false);
        }}
      />

      <AuthorFilterModal
        visible={authorOpen}
        selected={draft.author}
        onClose={() => setAuthorOpen(false)}
        onPick={(next) => {
          set({ author: next });
          setAuthorOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  select: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectTxt: { flex: 1, fontSize: 14.5, fontWeight: '700' },
  pBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  pCard: { maxHeight: '75%', borderRadius: 22, borderWidth: 1, padding: 12, gap: 8 },
  pSearch: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pInput: { flex: 1, fontSize: 15, padding: 0 },
  pRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  pTxt: { flex: 1, fontSize: 14.5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 16,
    paddingHorizontal: 18,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: '800' },
  section: { gap: 8, marginTop: 12 },
  label: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rail: { gap: 8, paddingRight: 18 },
  chip: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipTxt: { fontSize: 13, fontWeight: '700' },
  range: { flexDirection: 'row', gap: 10 },
  inputBox: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: { fontSize: 12, fontWeight: '700' },
  input: { flex: 1, fontSize: 15, fontWeight: '700', padding: 0, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 14.5, fontWeight: '800' },
});

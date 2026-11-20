import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { common } from '../styles';

const INK = '#1c1917';
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const bySort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
const tint = (c) => (HEX.test(c ?? '') ? c : '#fde4d3');

// Telefonning pastki tizim paneli "Tanlash" tugmasini yopib qo'ymasligi uchun. Modal alohida oyna
// bo'lgani uchun u o'z SafeAreaProvider'i ichida o'lchanadi.
function BottomPad() {
  return <View style={{ height: useSafeAreaInsets().bottom }} />;
}

function Glyph({ icon, size }) {
  return icon ? (
    <Text style={{ fontSize: size }}>{icon}</Text>
  ) : (
    <MaterialCommunityIcons name="shape-outline" size={size} color={INK} />
  );
}

// Ikki bosqichli tanlov: avval asosiy yo'nalish (rangli kartalar), bosilganda uning quyi
// yo'nalishlari ochiladi (ko'p tanlovli). Quyi yo'nalishi yo'q asosiy yo'nalish to'g'ridan-to'g'ri
// tanlanadi. Qidiruv bo'lsa — mos tanlanadigan yo'nalishlar tekis ro'yxatda.
export default function CategoryPickerModal({
  visible,
  onClose,
  categories,
  selectedIds,
  onToggle,
  fits = () => true,
  // «Taklif» chipi quyi yo'nalishi bor yo'nalishni taklif qilsa, oyna shu yo'nalish ichida ochiladi
  // (oyna `key` bilan qayta yaratiladi, shuning uchun faqat boshlang'ich qiymat).
  initialParentId = null,
  t,
  tr,
}) {
  const [search, setSearch] = useState('');
  const [parentId, setParentId] = useState(initialParentId);

  const tree = useMemo(
    () =>
      [...categories]
        .sort(bySort)
        .map((c) => ({ ...c, children: [...(c.children ?? [])].sort(bySort) })),
    [categories]
  );
  const parent = parentId != null ? tree.find((c) => c.id === parentId) : null;
  const query = search.trim().toLowerCase();
  const gridMode = !parent && !query;

  const rows = useMemo(() => {
    const match = (c) => c.name?.toLowerCase().includes(query);
    if (parent) return query ? parent.children.filter(match) : parent.children;
    if (!query) return tree;
    return tree.flatMap((c) => {
      if (c.children.length === 0) return match(c) ? [c] : [];
      return c.children.filter((ch) => match(ch) || match(c));
    });
  }, [tree, parent, query]);

  const close = () => {
    setParentId(null);
    setSearch('');
    onClose();
  };
  const goBack = () => {
    setParentId(null);
    setSearch('');
  };
  const openParent = (id) => {
    setParentId(id);
    setSearch('');
  };

  const renderCard = ({ item: c }) => {
    const hasChildren = c.children.length > 0;
    const picked = hasChildren
      ? c.children.filter((ch) => selectedIds.includes(ch.id)).length
      : Number(selectedIds.includes(c.id));
    // Narxli va kelishiladigan ish bir buyurtmaga sig'maydi: boshqa turi tanlangan bo'lsa xira turadi, bosilmaydi.
    const apart = !hasChildren && !fits(c.id);
    return (
      <TouchableOpacity
        onPress={() => (hasChildren ? openParent(c.id) : apart ? undefined : onToggle(c.id))}
        activeOpacity={apart ? 1 : 0.88}
        style={[
          s.card,
          { backgroundColor: tint(c.color) },
          picked > 0 && s.cardPicked,
          apart && s.apart,
        ]}
      >
        <View style={s.cardEmoji} pointerEvents="none">
          <Glyph icon={c.icon} size={52} />
        </View>
        {picked > 0 && (
          <View style={[s.cardBadge, { backgroundColor: t.orange }]}>
            {hasChildren ? (
              <Text style={s.cardBadgeTxt}>{picked}</Text>
            ) : (
              <MaterialCommunityIcons name="check" size={14} color="#fff" />
            )}
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Text style={s.cardName} numberOfLines={3}>
          {c.name}
        </Text>
        {apart && <Text style={s.apartTxt}>{tr('platformPrice.separate')}</Text>}
      </TouchableOpacity>
    );
  };

  const renderRow = ({ item: c }) => {
    const selected = selectedIds.includes(c.id);
    const apart = !fits(c.id);
    return (
      <TouchableOpacity
        onPress={apart ? undefined : () => onToggle(c.id)}
        activeOpacity={apart ? 1 : 0.8}
        style={[
          s.row,
          { backgroundColor: t.card, borderColor: selected ? t.orange : t.border },
          selected && { backgroundColor: 'rgba(232,122,69,0.08)' },
          apart && s.apart,
        ]}
      >
        <View style={[s.rowGlyph, { backgroundColor: tint(c.color) }]}>
          <Glyph icon={c.icon} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowName, { color: t.text }]} numberOfLines={2}>
            {c.name}
          </Text>
          {apart && (
            <Text style={[s.apartRow, { color: t.muted }]}>{tr('platformPrice.separate')}</Text>
          )}
        </View>
        <View
          style={[
            s.check,
            selected
              ? { backgroundColor: t.orange, borderColor: t.orange }
              : { borderColor: t.faint },
          ]}
        >
          {selected && <MaterialCommunityIcons name="check" size={15} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={parent ? goBack : close}
    >
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={s.backdrop}>
          <View style={[s.sheet, { backgroundColor: t.bg }]}>
            <View style={[common.sheetHandle, s.handle, { backgroundColor: t.border }]} />

            <View style={s.header}>
              {parent && (
                <TouchableOpacity
                  onPress={goBack}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[s.round, { backgroundColor: t.card, borderColor: t.border }]}
                >
                  <MaterialCommunityIcons name="chevron-left" size={22} color={t.text} />
                </TouchableOpacity>
              )}
              {parent?.icon ? (
                <View style={[s.headGlyph, { backgroundColor: tint(parent.color) }]}>
                  <Text style={{ fontSize: 20 }}>{parent.icon}</Text>
                </View>
              ) : null}
              <Text style={[s.title, { color: t.text }]} numberOfLines={2}>
                {parent ? parent.name : tr('newOrder.categoryPickerTitle')}
              </Text>
              <TouchableOpacity
                onPress={close}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[s.round, { backgroundColor: t.card, borderColor: t.border }]}
              >
                <MaterialCommunityIcons name="close" size={18} color={t.muted} />
              </TouchableOpacity>
            </View>

            <View style={[s.search, { backgroundColor: t.card, borderColor: t.border }]}>
              <MaterialCommunityIcons name="magnify" size={19} color={t.faint} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={tr('newOrder.categorySearchPlaceholder')}
                placeholderTextColor={t.faint}
                style={[s.searchInput, { color: t.text }]}
              />
            </View>

            <FlatList
              key={gridMode ? 'grid' : 'list'}
              data={rows}
              numColumns={gridMode ? 2 : 1}
              keyExtractor={(c) => String(c.id)}
              columnWrapperStyle={gridMode ? s.gridRow : undefined}
              contentContainerStyle={{ paddingBottom: 12, gap: gridMode ? 12 : 10 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={{ color: t.muted, textAlign: 'center', marginTop: 24, fontSize: 13 }}>
                  {tr('newOrder.categoryEmpty')}
                </Text>
              }
              renderItem={gridMode ? renderCard : renderRow}
            />

            <TouchableOpacity
              onPress={close}
              activeOpacity={0.85}
              style={[s.done, { backgroundColor: t.orange }]}
            >
              <Text style={common.modalDoneTxt}>
                {tr('newOrder.categoryDone', { n: selectedIds.length })}
              </Text>
            </TouchableOpacity>
            <BottomPad />
          </View>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    height: '84%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
  },
  handle: { alignSelf: 'center', marginBottom: 14 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { flex: 1, fontSize: 20, fontWeight: '800' },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headGlyph: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  gridRow: { gap: 12 },
  card: {
    flex: 1,
    height: 116,
    borderRadius: 22,
    padding: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardPicked: { borderColor: '#e87a45' },
  cardEmoji: { position: 'absolute', right: -6, top: 14, transform: [{ rotate: '12deg' }] },
  cardBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  cardBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cardName: { color: INK, fontSize: 14.5, fontWeight: '800', lineHeight: 18 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 10,
    paddingRight: 14,
  },
  rowGlyph: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { fontSize: 14.5, fontWeight: '700' },
  apart: { opacity: 0.45 },
  apartTxt: { color: INK, fontSize: 11.5, fontWeight: '700', marginTop: 2 },
  apartRow: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  done: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#e87a45',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
});

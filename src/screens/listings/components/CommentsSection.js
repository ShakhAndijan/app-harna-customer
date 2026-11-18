import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  Image,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appAlert } from '../../../components/AppAlert';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  useListingComments,
  useAddListingComment,
  useUpdateListingComment,
  useDeleteListingComment,
} from '../../../queries/listings';
import { AVATAR_COLORS } from '../../../api/workers';
import { getErrorMessage } from '../../../utils/errors';
import { encodeImageUri, timeAgo } from '../utils';

const MAX_LENGTH = 1000;
// Hisoblagich faqat chegaraga yaqinlashganda ko'rinadi.
const COUNTER_FROM = 800;

// Izohni tahrirlash (menyudagi "Tahrirlash" va yozish maydonidagi tahrir rejimi).
// Backend (dev-back) hozircha PATCH /listings/{id}/comments/{commentId} ni qo'llamaydi (405 qaytaradi),
// shuning uchun o'chirib qo'yilgan. Backend tayyor bo'lgach `true` qiling — boshqa o'zgartirish kerak emas.
const COMMENT_EDIT_ENABLED = false;

const OWN_BG = 'rgba(232,122,69,0.10)';
const OWN_BORDER = 'rgba(232,122,69,0.30)';

// Backend ismni "Kasimov K" (familiya + bosh harf) ko'rinishida beradi; "K. Kasimov" shaklida ko'rsatiladi.
const displayName = (name) => {
  const m = name.trim().match(/^(\S{2,})\s+(\p{L})\.?$/u);
  return m ? `${m[2].toUpperCase()}. ${m[1]}` : name;
};

// Rasmsiz muallif uchun ism bo'yicha doimiy rang.
const avatarColor = (name) =>
  AVATAR_COLORS[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];

// Izoh amallari: pastdan chiqadigan qisqa menyu (tahrirlash / o'chirish).
function ActionSheet({ comment, onClose, onEdit, onDelete }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const bottom = useSafeAreaInsets().bottom;

  const rows = [
    COMMENT_EDIT_ENABLED && {
      key: 'edit',
      icon: 'pencil-outline',
      label: tr('listings.comments.edit'),
      color: t.text,
      tint: t.card2,
      onPress: onEdit,
    },
    {
      key: 'delete',
      icon: 'trash-can-outline',
      label: tr('listings.comments.delete'),
      color: t.red,
      tint: 'rgba(224,71,58,0.12)',
      onPress: onDelete,
    },
  ].filter(Boolean);

  return (
    <Modal
      visible={!!comment}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={m.backdrop} onPress={onClose} accessibilityLabel={tr('common.cancel')}>
        <Pressable
          style={[
            m.sheet,
            { backgroundColor: t.card, borderColor: t.border, paddingBottom: bottom + 14 },
          ]}
          onPress={() => {}}
        >
          <View style={[m.grab, { backgroundColor: t.border }]} />
          <Text style={[m.preview, { color: t.muted }]} numberOfLines={1}>
            {comment?.body}
          </Text>
          {rows.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={r.onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              style={m.row}
            >
              <View style={[m.rowIcon, { backgroundColor: r.tint }]}>
                <MaterialCommunityIcons name={r.icon} size={20} color={r.color} />
              </View>
              <Text style={[m.rowTxt, { color: r.color }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// E'lon izohlari: ro'yxat, yangi izoh yozish (faqat kirgan foydalanuvchi) va o'zining izohini
// tahrirlash/o'chirish (uch nuqta menyusi).
// `sheet` — quyi oynada: ro'yxat aylanadi, yozish maydoni esa pastda qotib turadi.
export default function CommentsSection({ listingId, signedIn, onLogin, sheet = false }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { comments, loading, error, refetch } = useListingComments(listingId);
  const add = useAddListingComment(listingId);
  const update = useUpdateListingComment(listingId);
  const remove = useDeleteListingComment(listingId);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [editing, setEditing] = useState(null);

  const busy = add.isPending || update.isPending;
  const canSend = text.trim().length > 0 && !busy;

  const send = () => {
    if (!canSend) return;
    if (editing) {
      update.mutate(
        { commentId: editing.id, body: text },
        {
          onSuccess: () => {
            setText('');
            setEditing(null);
          },
          onError: (err) =>
            appAlert(
              tr('common.errorTitle'),
              getErrorMessage(err, tr, 'listings.comments.editError')
            ),
        }
      );
      return;
    }
    add.mutate(text, {
      onSuccess: () => setText(''),
      onError: (err) =>
        appAlert(tr('common.errorTitle'), getErrorMessage(err, tr, 'listings.comments.sendError')),
    });
  };

  const startEdit = (comment) => {
    setMenuFor(null);
    setEditing(comment);
    setText(comment.body);
  };

  const cancelEdit = () => {
    setEditing(null);
    setText('');
  };

  const confirmDelete = (comment) => {
    setMenuFor(null);
    appAlert(tr('listings.comments.deleteConfirm'), undefined, [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('listings.comments.delete'),
        style: 'destructive',
        onPress: () => {
          if (editing?.id === comment.id) cancelEdit();
          remove.mutate(comment.id, {
            onError: (err) =>
              appAlert(
                tr('common.errorTitle'),
                getErrorMessage(err, tr, 'listings.comments.deleteError')
              ),
          });
        },
      },
    ]);
  };

  const head = (
    <View style={s.head}>
      <Text style={[s.title, { color: t.text }]}>{tr('listings.comments.title')}</Text>
      {comments.length > 0 && (
        <View style={[s.count, { backgroundColor: t.card2 }]}>
          <Text style={[s.countTxt, { color: t.muted }]}>{comments.length}</Text>
        </View>
      )}
    </View>
  );

  const list = loading ? (
    <ActivityIndicator color={t.orange} style={{ marginVertical: 24 }} />
  ) : error ? (
    <TouchableOpacity onPress={refetch} activeOpacity={0.8} style={s.empty}>
      <MaterialCommunityIcons name="refresh" size={22} color={t.muted} />
      <Text style={[s.emptyTxt, { color: t.muted }]}>
        {tr('listings.comments.loadError')} · {tr('common.retry')}
      </Text>
    </TouchableOpacity>
  ) : comments.length === 0 ? (
    <View style={s.empty}>
      <View style={[s.emptyIcon, { backgroundColor: t.card2 }]}>
        <MaterialCommunityIcons name="comment-text-outline" size={26} color={t.orange} />
      </View>
      <Text style={[s.emptyTxt, { color: t.muted }]}>{tr('listings.comments.empty')}</Text>
    </View>
  ) : (
    <View>
      {comments.map((c) => (
        <View key={c.id} style={[s.item, editing?.id === c.id && { backgroundColor: OWN_BG }]}>
          <View style={[s.avatar, { backgroundColor: avatarColor(c.authorName) }]}>
            {c.authorPhoto ? (
              <Image
                source={{ uri: encodeImageUri(c.authorPhoto) }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <Text style={s.avatarTxt}>{(c.authorName[0] ?? '?').toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.meta}>
              <Text style={[s.name, { color: t.text }]} numberOfLines={1}>
                {displayName(c.authorName)}
              </Text>
              {c.isOwner && (
                <View style={[s.tag, { backgroundColor: t.orange }]}>
                  <Text style={[s.tagTxt, { color: '#fff' }]}>{tr('listings.comments.owner')}</Text>
                </View>
              )}
              {c.isMine && (
                <View style={[s.tag, { backgroundColor: t.orange }]}>
                  <Text style={[s.tagTxt, { color: '#fff' }]}>{tr('listings.comments.you')}</Text>
                </View>
              )}
              <Text style={[s.time, { color: t.faint }]} numberOfLines={1}>
                {timeAgo(c.createdAt, tr)}
              </Text>
            </View>
            <Text style={[s.body, { color: t.text }]} selectable>
              {c.body}
            </Text>
          </View>
          {c.isMine && (
            <TouchableOpacity
              onPress={() => setMenuFor(c)}
              hitSlop={8}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={tr('listings.comments.actions')}
              style={s.dots}
            >
              <MaterialCommunityIcons name="dots-vertical" size={22} color={t.muted} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const composer = (
    <>
      {signedIn ? (
        <View style={{ marginTop: 10 }}>
          {!!editing && (
            <View style={[s.editBar, { backgroundColor: OWN_BG }]}>
              <MaterialCommunityIcons name="pencil" size={15} color={t.orange} />
              <Text style={[s.editTxt, { color: t.orange }]} numberOfLines={1}>
                {tr('listings.comments.editing')}
              </Text>
              <TouchableOpacity
                onPress={cancelEdit}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={tr('common.cancel')}
              >
                <MaterialCommunityIcons name="close" size={18} color={t.muted} />
              </TouchableOpacity>
            </View>
          )}
          <View
            style={[
              s.composer,
              { backgroundColor: t.card, borderColor: focused ? t.orange : t.border },
            ]}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={tr('listings.comments.placeholder')}
              placeholderTextColor={t.faint}
              multiline
              maxLength={MAX_LENGTH}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[s.input, { color: t.text }]}
            />
            {text.length >= COUNTER_FROM && (
              <Text style={[s.counter, { color: text.length >= MAX_LENGTH ? t.red : t.faint }]}>
                {MAX_LENGTH - text.length}
              </Text>
            )}
            <TouchableOpacity
              onPress={send}
              disabled={!canSend}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={tr('listings.comments.send')}
              style={[s.send, { backgroundColor: canSend ? t.orange : t.card3 }]}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons
                  name={editing ? 'check' : 'arrow-up'}
                  size={21}
                  color={canSend ? '#fff' : t.faint}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onLogin}
          activeOpacity={0.85}
          style={[s.loginCard, { backgroundColor: OWN_BG, borderColor: OWN_BORDER }]}
        >
          <MaterialCommunityIcons name="login" size={18} color={t.orange} />
          <Text style={[s.loginTxt, { color: t.orange }]}>
            {tr('listings.comments.loginToComment')}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  const menu = (
    <ActionSheet
      comment={menuFor}
      onClose={() => setMenuFor(null)}
      onEdit={() => startEdit(menuFor)}
      onDelete={() => confirmDelete(menuFor)}
    />
  );

  if (sheet) {
    return (
      <View style={{ flex: 1 }}>
        {head}
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {list}
        </ScrollView>
        {composer}
        {menu}
      </View>
    );
  }

  return (
    <View>
      {head}
      {list}
      {composer}
      {menu}
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '800' },
  count: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countTxt: { fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTxt: { fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
  item: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 11,
    borderRadius: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: 13, fontWeight: '700' },
  tag: { borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt: { fontSize: 9.5, fontWeight: '800' },
  body: { fontSize: 14.5, lineHeight: 21, marginTop: 2 },
  time: { flexShrink: 0, fontSize: 12, fontWeight: '500' },
  dots: { width: 28, height: 28, marginRight: -6, alignItems: 'center', justifyContent: 'center' },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  editTxt: { flex: 1, fontSize: 12.5, fontWeight: '800' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: { flex: 1, maxHeight: 110, fontSize: 15, paddingTop: 8, paddingBottom: 8 },
  counter: { fontSize: 11, fontWeight: '700', paddingBottom: 14 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    marginTop: 12,
  },
  loginTxt: { fontSize: 14, fontWeight: '800' },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  grab: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 14 },
  preview: { fontSize: 13, fontWeight: '600', marginBottom: 10, paddingHorizontal: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 56 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTxt: { fontSize: 16, fontWeight: '700' },
});

import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatPrice, formatDeadline, isExpired } from '../../requests/utils';

// Android'da kodlanmagan "+" URL'da rasmni buzadi (PhotoGallery'dagidek).
const encodeImageUri = (uri) => (uri ? uri.replace(/\+/g, '%2B') : uri);

// Ustaning qo'shimcha ish taklifi (mijoz javobini kutayotgan): tavsif, narx, muddat va
// "Roziman" / "Rad etaman". Muddat tugagan bo'lsa tugmalar o'rniga ogohlantirish chiqadi.
export default function ExtraWorkCard({ order, extra, busy, onDecide }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  const lapsed = isExpired(extra.deadline);
  const agreed = order.agreedPrice;
  const total =
    agreed != null && extra.price != null ? agreed + (order.extrasTotal ?? 0) + extra.price : null;

  return (
    <View style={[s.card, { backgroundColor: t.gold + '14', borderColor: t.gold + '66' }]}>
      <View style={s.head}>
        <View style={[s.icon, { backgroundColor: t.gold + '33' }]}>
          <MaterialCommunityIcons name="plus-box-multiple-outline" size={20} color={t.gold} />
        </View>
        <Text style={[s.title, { color: t.text }]}>{tr('extraWork.askTitle')}</Text>
      </View>

      <View style={s.body}>
        {!!extra.photoUrl && (
          <Image
            source={{ uri: encodeImageUri(extra.photoUrl) }}
            style={[s.photo, { backgroundColor: t.card2 }]}
            resizeMode="cover"
          />
        )}
        <View style={{ flex: 1 }}>
          {!!extra.title && <Text style={[s.desc, { color: t.text }]}>{extra.title}</Text>}
          {extra.price != null && (
            <Text style={[s.price, { color: t.text }]}>{formatPrice(tr, extra.price)}</Text>
          )}
        </View>
      </View>

      {lapsed ? (
        <Text style={[s.hint, { color: t.red }]}>{tr('extraWork.late')}</Text>
      ) : (
        <>
          {!!extra.deadline && (
            <Text style={[s.hint, { color: t.muted }]}>
              {tr('extraWork.deadline', { when: formatDeadline(tr, extra.deadline) })}
            </Text>
          )}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: t.green, opacity: busy ? 0.6 : 1 }]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={() => onDecide(extra, true, total)}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.btnTxt}>{tr('extraWork.approve')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnGhost, { borderColor: t.line2, opacity: busy ? 0.6 : 1 }]}
              activeOpacity={0.8}
              disabled={busy}
              onPress={() => onDecide(extra, false, total)}
              accessibilityRole="button"
            >
              <Text style={[s.btnTxt, { color: t.text }]}>{tr('extraWork.decline')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 15, fontWeight: '800' },
  body: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  photo: { width: 72, height: 72, borderRadius: 12 },
  desc: { fontSize: 14, lineHeight: 20 },
  price: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  hint: { fontSize: 12.5, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { borderWidth: 1.5 },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

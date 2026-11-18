import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import Avatar from '../../../components/Avatar';
import { getOrderBrief } from '../../../api/orders';
import { timeAgo } from '../../listings/utils';
import { describeOrder, formatPrice } from '../utils';

const STEPS = 3;
const STEP_OF = { pending: 0, returned: 0, negotiating: 1, offer: 1, active: 2, workDone: 2 };

// Bosqichlar (qidiruv → kelishuv → ish): kichik bo'lakli chiziq.
function Progress({ current, color, t }) {
  return (
    <View style={s.steps}>
      {Array.from({ length: STEPS }, (_, i) => (
        <View key={i} style={[s.seg, { backgroundColor: i <= current ? color : t.border }]} />
      ))}
    </View>
  );
}

// Bosh sahifadagi faol buyurtma kartasi (ixcham):
//  1) holat belgisi (rangli) va yuborilgan vaqt,
//  2) xizmat nomi va narx,
//  3) mijoz yozgan ish tavsifi (alohida yumshoq blokda),
//  4) tanlangan usta (surat va ism) va bosqich chizig'i.
// Usta narx aytib, javobingiz kutilayotgan bo'lsa karta to'q sariq ramkada.
export default function RequestCard({ order, title, onPress }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const info = describeOrder(order, tr);
  const color = t[info.tone] ?? t.orange;
  // Javobingiz/tanlovingiz/tasdiqingiz kutilayotgan buyurtmalar to'q sariq ramkada ("shoshilinch").
  const needsReply =
    info.state === 'offer' ||
    info.state === 'workDone' ||
    (info.state === 'pending' && !order.master && order.offersCount > 0);
  let price = null;
  if (info.state === 'offer') price = order.offerPrice;
  else if (info.state === 'active' || info.state === 'workDone') price = order.agreedPrice;

  // Ro'yxat javobida tavsif kelmasa, u buyurtma tafsilotidan olinadi (keshlanadi, har bir buyurtma uchun bir marta).
  const needsDetail = !order.description && order.id != null;
  const detail = useQuery({
    queryKey: ['orders', 'brief', order.id],
    queryFn: () => getOrderBrief(order.id),
    enabled: needsDetail,
    staleTime: 5 * 60 * 1000,
  });
  const desc =
    order.description ||
    detail.data?.description ||
    (order.task && order.task !== title ? order.task : '');
  const master = order.master || detail.data?.master || '';
  const masterPhoto = order.masterPhoto ?? detail.data?.masterPhoto ?? null;
  const ago = timeAgo(order.createdAt, tr);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      style={[
        s.card,
        {
          backgroundColor: t.card,
          borderColor: needsReply ? t.orange : t.border,
        },
      ]}
    >
      <View style={s.head}>
        <View style={[s.pill, { backgroundColor: color + '1f' }]}>
          <MaterialCommunityIcons name={info.icon} size={14} color={color} />
          <Text style={[s.pillTxt, { color }]} numberOfLines={1}>
            {info.short}
          </Text>
        </View>
        {!!ago && (
          <Text style={[s.ago, { color: t.faint }]} numberOfLines={1}>
            {ago}
          </Text>
        )}
      </View>

      <View style={s.titleRow}>
        <Text style={[s.title, { color: t.text }]} numberOfLines={1}>
          {title}
        </Text>
        {price != null ? (
          <Text style={[s.price, { color: t.text }]}>{formatPrice(tr, price)}</Text>
        ) : needsReply ? (
          <View style={[s.badge, { backgroundColor: t.orange }]} />
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={20} color={t.faint} />
        )}
      </View>

      {!!desc && (
        <View style={[s.descBox, { backgroundColor: t.card2 }]}>
          <MaterialCommunityIcons name="text-box-outline" size={15} color={t.faint} />
          <Text style={[s.desc, { color: t.subtext ?? t.muted }]} numberOfLines={2}>
            {desc}
          </Text>
        </View>
      )}

      <View style={s.foot}>
        <View style={s.who}>
          {master ? (
            <>
              <Avatar letter={order.letter} bgColor={order.color} uri={masterPhoto} size={24} />
              <Text style={[s.whoTxt, { color: t.text }]} numberOfLines={1}>
                {master}
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="account-search-outline" size={20} color={t.faint} />
              <Text style={[s.whoTxt, { color: t.muted }]} numberOfLines={1}>
                {tr('requests.noWorkerYet')}
              </Text>
            </>
          )}
        </View>
        <Progress current={STEP_OF[info.state] ?? 0} color={color} t={t} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1.5, padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  pillTxt: { fontSize: 11.5, fontWeight: '800', flexShrink: 1 },
  ago: { fontSize: 11.5, fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  title: { flex: 1, fontWeight: '800', fontSize: 16, letterSpacing: -0.2 },
  price: { fontSize: 14, fontWeight: '800' },
  badge: { width: 10, height: 10, borderRadius: 5 },
  descBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  desc: { flex: 1, fontSize: 13, lineHeight: 18 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  whoTxt: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  steps: { width: 56, flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
});

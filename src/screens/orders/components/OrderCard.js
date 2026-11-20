import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import { useLanguage } from '../../../context/LanguageContext';
import { formatNumber } from '../../../utils/format';
import Avatar from '../../../components/Avatar';
import UrgentTag, { isUrgentOpen } from '../../../components/UrgentTag';
import ListingTag from '../../../components/ListingTag';
import StatusPill from './StatusPill';
import { STATUS_META } from '../constants';
import { formatOrderDate } from '../utils';
import DepositPayStep from '../../deposit/DepositPayStep';

export default function OrderCard({ order, onPress, t }) {
  const { t: tr } = useLanguage();
  const queryClient = useQueryClient();
  const cfg = STATUS_META[order.status] || STATUS_META.active;
  // Shoshilinch buyurtma boshqalardan ajralib turishi uchun qizil chiziq va ramka bilan.
  const urgent = isUrgentOpen(order);
  const title = order.task || order.service || tr('orderDetail.orderNumber', { id: order.id });
  const subtitle = [order.master || tr('orders.noMasterYet'), order.service]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.card, { backgroundColor: t.card, borderColor: urgent ? t.red + '66' : t.border }]}
    >
      <View style={[s.accentBar, { backgroundColor: urgent ? t.red : cfg.color }]} />

      {/* Row 1 */}
      <View style={s.topRow}>
        <Avatar letter={order.letter} bgColor={order.color} uri={order.masterPhoto} size={44} />
        <View style={s.nameBox}>
          <Text style={[s.taskName, { color: t.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[s.masterSub, { color: t.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <StatusPill order={order} />
      </View>

      <UrgentTag order={order} style={s.urgent} />
      <ListingTag order={order} style={s.urgent} />

      {/* Row 2: date + address */}
      <View style={s.metaRow}>
        <View style={s.metaItem}>
          <Feather name="calendar" size={12.5} color={t.muted} />
          <Text style={[s.metaText, { color: t.muted }]}>
            {formatOrderDate(order.createdAt, tr)}
          </Text>
        </View>
        {!!order.address && (
          <View style={[s.metaItem, { flex: 1, minWidth: 0 }]}>
            <Feather name="map-pin" size={12.5} color={t.muted} style={{ flexShrink: 0 }} />
            <Text style={[s.metaText, { color: t.muted }]} numberOfLines={1}>
              {order.address}
            </Text>
          </View>
        )}
      </View>

      {/* Row 3: price + open detail */}
      <View style={[s.priceRow, { borderTopColor: t.border }]}>
        {order.price != null ? (
          <Text style={[s.price, { color: t.text }]}>
            {formatNumber(Math.round(order.price))}{' '}
            <Text style={[s.priceSub, { color: t.muted }]}>{tr('common.currencySom')}</Text>
          </Text>
        ) : (
          <Text style={[s.priceSub, { color: t.muted }]}>{tr('orders.priceTbd')}</Text>
        )}
        <View style={[s.ghostBtn, { backgroundColor: t.orange + '18' }]}>
          <Text style={[s.ghostBtnText, { color: t.orange }]}>{tr('orders.details')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={15} color={t.orange} />
        </View>
      </View>

      {/* Omonat kutilmoqda: shu yerning o'zida to'lanadi. */}
      <DepositPayStep
        order={order}
        compact
        onChanged={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
      />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 18,
    padding: 14,
    paddingLeft: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameBox: { flex: 1, minWidth: 0 },
  taskName: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  masterSub: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },

  urgent: { marginTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12.5, fontWeight: '600' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  price: { fontSize: 16.5, fontWeight: '800' },
  priceSub: { fontSize: 12.5, fontWeight: '700' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ghostBtnText: { fontSize: 12.5, fontWeight: '700' },
});

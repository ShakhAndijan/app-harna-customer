import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatNumber } from '../../../utils/format';
import { dayWithWindow, offerWindowLabel, orderWindowLabel } from '../arrival';

// Kelishuv kartasi ("Narx" bo'limi): yirik narx (kelishuvda — to'q sariq, kelishilgach — yashil)
// va ish sanasi belgisi. Amallar (Kelishildi / Boshqa narx) ekran pastidagi doimiy panelda,
// "Rad etish" va "Bekor qilish" esa sarlavhadagi menyuda — karta faqat ma'lumot ko'rsatadi.
export default function DealCard({ order, info, agreeDay, agreeBlocked }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  const negotiating = order.rawStatus === 'accepted';
  // Qo'shimcha ish tasdiqlangan bo'lsa jami narx ko'rsatiladi (kelishilgan + qo'shimcha).
  const hasExtras = !negotiating && order.extrasTotal > 0 && order.totalPrice != null;
  const value = negotiating ? order.offerPrice : hasExtras ? order.totalPrice : order.agreedPrice;
  const hasValue = value != null;
  const canAgree = negotiating && info.state === 'offer';
  const tone = negotiating ? t.orange : t.green;
  const dayText = dayWithWindow(
    tr,
    negotiating ? agreeDay : order.scheduledDate,
    negotiating ? offerWindowLabel(order) : orderWindowLabel(order)
  );

  let label = tr('requests.agreedLabel');
  if (negotiating) {
    if (!hasValue) label = tr('requests.noOfferYet');
    else
      label =
        order.offerBy === 'worker' ? tr('requests.offerFromWorker') : tr('requests.offerFromMe');
  }

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[s.head, { backgroundColor: tone + '14' }]}>
        <View style={s.labelRow}>
          <View style={[s.labelIcon, { backgroundColor: tone + '26' }]}>
            <MaterialCommunityIcons
              name={negotiating ? 'handshake-outline' : 'check-decagram'}
              size={16}
              color={tone}
            />
          </View>
          <Text style={[s.label, { color: hasValue ? t.text : t.muted }]} numberOfLines={1}>
            {label}
          </Text>
        </View>

        {hasValue && (
          <Text style={[s.value, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatNumber(Math.round(value))}
            <Text style={s.currency}> {tr('common.currencySom')}</Text>
          </Text>
        )}

        {!!dayText && (
          <View style={[s.dayPill, { backgroundColor: t.card, borderColor: t.border }]}>
            <MaterialCommunityIcons name="calendar-clock" size={15} color={t.muted} />
            <Text style={[s.dayTxt, { color: t.text }]}>{dayText}</Text>
          </View>
        )}
      </View>

      {hasExtras && (
        <Text style={[s.extras, { color: t.muted }]}>
          {tr('extraWork.total', {
            agreed: formatNumber(Math.round(order.agreedPrice ?? 0)),
            extras: formatNumber(Math.round(order.extrasTotal)),
          })}
        </Text>
      )}

      {canAgree && !!agreeBlocked && (
        <Text style={[s.blocked, { color: t.red }]}>{agreeBlocked}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  head: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 13, fontWeight: '700' },
  value: { fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  currency: { fontSize: 16, fontWeight: '700', letterSpacing: 0 },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayTxt: { fontSize: 12.5, fontWeight: '700' },
  extras: { fontSize: 12.5, lineHeight: 18, paddingHorizontal: 16, paddingVertical: 10 },
  blocked: { fontSize: 12.5, lineHeight: 18, paddingHorizontal: 16, paddingVertical: 12 },
});

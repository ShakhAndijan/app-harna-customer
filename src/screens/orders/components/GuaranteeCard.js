import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatNumber } from '../../../utils/format';
import { formatDeadline, isExpired } from '../../requests/utils';
import GuaranteeModal from './GuaranteeModal';

// Murojaat holatiga mos mijoz matni (saytdagi `mr`): muddat bo'lsa "{deadline} gacha" variant.
function claimText(tr, claim) {
  const deadline = claim.deadline ? formatDeadline(tr, claim.deadline) : '';
  const v = deadline ? { deadline } : null;
  const amount = claim.refundAmount > 0 ? formatNumber(Math.round(claim.refundAmount)) : null;
  switch (claim.status) {
    case 'awaiting_worker':
      return v ? tr('guarantee.awaitingWorker', v) : tr('guarantee.awaitingWorkerPlain');
    case 'fixing':
      return v ? tr('guarantee.fixing', v) : tr('guarantee.fixingPlain');
    case 'customer_check':
      return v ? tr('guarantee.check', v) : tr('guarantee.checkPlain');
    case 'disputed':
      return tr('guarantee.disputed');
    case 'fixed':
      return claim.resolution === 'no_answer'
        ? tr('guarantee.fixedNoAnswer')
        : tr('guarantee.fixedConfirmed');
    case 'refunded':
      if (claim.refundMethod === 'full_payment_refund') {
        return amount
          ? tr('guarantee.refundedFull', { amount })
          : tr('guarantee.refundedFullPlain');
      }
      if (claim.refundMethod === 'manual_partial') {
        return amount
          ? tr('guarantee.refundedPartial', { amount })
          : tr('guarantee.refundedPartialPlain');
      }
      return tr('guarantee.refunded');
    case 'rejected':
      return tr('guarantee.rejected');
    default:
      return null;
  }
}

const photoUri = (p) => {
  const url = typeof p === 'string' ? p : (p?.url ?? p?.photo_url ?? '');
  return url.replace(/\+/g, '%2B');
};

// Yakunlangan buyurtmada kafolat: murojaat berish (muddat ichida), mavjud murojaat holati va
// usta "tuzatdim" degach "Tuzatildi / Tuzatilmadi" javobi.
export default function GuaranteeCard({ order, busy, onFile, onCheck }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [open, setOpen] = useState(false);
  const g = order.guarantee;

  if (order.rawStatus !== 'completed' || !g) return null;

  if (g.claim) {
    const claim = g.claim;
    const text = claimText(tr, claim);
    if (!text) return null;
    const check = claim.status === 'customer_check';
    const late = check && !!claim.deadline && isExpired(claim.deadline);
    const tone =
      claim.status === 'refunded' || claim.status === 'fixed'
        ? t.green
        : check || claim.status === 'awaiting_worker'
          ? t.gold
          : t.blue;
    return (
      <View style={[s.card, { backgroundColor: tone + '1a', borderColor: tone + '55' }]}>
        <View style={s.head}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={tone} />
          <Text style={[s.title, { color: t.text }]}>{text}</Text>
        </View>
        {!!claim.description && (
          <Text style={[s.desc, { color: t.muted }]}>{claim.description}</Text>
        )}
        {claim.photos.length > 0 && (
          <View style={s.photos}>
            {claim.photos.map((p, i) => (
              <Image key={i} source={{ uri: photoUri(p) }} style={s.photo} />
            ))}
          </View>
        )}
        {late && <Text style={[s.note, { color: t.muted }]}>{tr('guarantee.answerLate')}</Text>}
        {check && (
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: t.green, opacity: busy ? 0.6 : 1 }]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={() => onCheck(true)}
              accessibilityRole="button"
            >
              <Text style={[s.btnTxt, { color: '#fff' }]}>{tr('guarantee.fixedYes')}</Text>
            </TouchableOpacity>
            {!late && (
              <TouchableOpacity
                style={[s.btn, { borderColor: t.red, borderWidth: 1.5, opacity: busy ? 0.6 : 1 }]}
                activeOpacity={0.8}
                disabled={busy}
                onPress={() => onCheck(false)}
                accessibilityRole="button"
              >
                <Text style={[s.btnTxt, { color: t.red }]}>{tr('guarantee.fixedNo')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  if (g.eligible) {
    return (
      <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <TouchableOpacity
          style={[s.btn, s.wide, { backgroundColor: t.orange }]}
          activeOpacity={0.85}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="shield-check-outline" size={19} color="#fff" />
          <Text style={[s.btnTxt, { color: '#fff' }]}>{tr('guarantee.title')}</Text>
        </TouchableOpacity>
        {!!g.until && (
          <Text style={[s.note, { color: t.muted }]}>
            {tr('guarantee.until', { until: formatDeadline(tr, g.until) })}
          </Text>
        )}
        <GuaranteeModal
          visible={open}
          busy={busy}
          onClose={() => setOpen(false)}
          onSubmit={async (description, photos) => {
            if (await onFile(description, photos)) setOpen(false);
          }}
        />
      </View>
    );
  }

  if (g.reason === 'not_paid_in_app') {
    return (
      <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={s.head}>
          <MaterialCommunityIcons name="shield-outline" size={20} color={t.faint} />
          <Text style={[s.note, s.grow, { color: t.muted }]}>{tr('guarantee.nudge')}</Text>
        </View>
      </View>
    );
  }

  return null;
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  desc: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  note: { fontSize: 12.5, lineHeight: 18 },
  grow: { flex: 1 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 60, height: 60, borderRadius: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  wide: { flex: 0, alignSelf: 'stretch' },
  btnTxt: { fontWeight: '700', fontSize: 14 },
});

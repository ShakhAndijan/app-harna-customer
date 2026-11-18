import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { appAlert, appConfirm } from '../../../components/AppAlert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ustaRoute } from '../../../navigation/params';
import { getErrorMessage } from '../../../utils/errors';
import {
  getOrderOffers,
  chooseOrderOffer,
  rejectOrderOffer,
  repriceOrderOffer,
} from '../../../api/orders';
import MoneyInput from '../../new-order/components/MoneyInput';
import FlowModal from './FlowModal';
import EstimateCard from '../../orders/components/EstimateCard';
import { parsePrice } from '../hooks/useOrderActions';
import Avatar from '../../../components/Avatar';
import SectionError from '../../zakazchi-main/components/SectionError';
import { formatDeadline, formatPrice } from '../utils';
import { dayWithWindow, windowLabel } from '../arrival';
import { useOrderTiming } from '../../../queries/orderTiming';
import { pollEvery } from '../../../utils/realtime';

// Taklifdagi ish sanasi va (bo'lsa) usta kelish vaqti oralig'i: "19-Noy, 13:00–14:00".
const offerWhen = (tr, offer) =>
  dayWithWindow(tr, offer.offerDate, windowLabel(offer.windowStart, null, null));

const AVATAR_COLORS = ['#2fa37a', '#e87a45', '#3f7fd4', '#ec4899', '#8b5cf6', '#f5c451', '#06b6d4'];

// Ommaviy buyurtmaga kelgan takliflar (saytdagi "Takliflar"): ustani ko'rish, tanlash yoki rad etish.
// Tanlansa usta kelishuvni tasdiqlashi kutiladi (buyurtma "kelishilmoqda" bosqichiga o'tadi).
export default function OffersSection({ orderId, chooseUntil, onChanged }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();
  useOrderTiming();
  const [busyId, setBusyId] = useState(null);
  const [priceFor, setPriceFor] = useState(null);

  const query = useQuery({
    queryKey: ['orders', orderId, 'offers'],
    queryFn: () => getOrderOffers(orderId),
    refetchInterval: pollEvery(10 * 1000, 30 * 1000),
  });
  const offers = (query.data ?? []).filter((o) => o.status === 'pending');

  const run = async (offer, action) => {
    setBusyId(offer.id);
    try {
      await action();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      await onChanged?.();
    } catch (e) {
      appAlert(tr('common.errorTitle'), getErrorMessage(e, tr, 'requests.actionFailed'));
      query.refetch();
    } finally {
      setBusyId(null);
    }
  };

  const choose = (offer) =>
    appConfirm({
      title: tr('orderFlow.match.chooseTitle', { name: offer.worker.name }),
      message: [
        tr('orderFlow.match.chooseBody'),
        tr('orderFlow.match.choosePrice', { price: formatPrice(tr, offer.price) }),
        offer.offerDate ? tr('orderFlow.match.chooseDay', { date: offerWhen(tr, offer) }) : null,
      ]
        .filter(Boolean)
        .join('\n\n'),
      confirmLabel: tr('orderFlow.match.choose'),
      onConfirm: () => run(offer, () => chooseOrderOffer(orderId, offer.id)),
    });

  const reject = (offer) =>
    appConfirm({
      title: tr('orderFlow.match.rejectOfferTitle'),
      message: tr('orderFlow.match.rejectOfferBody'),
      confirmLabel: tr('requests.decline'),
      destructive: true,
      onConfirm: () => run(offer, () => rejectOrderOffer(orderId, offer.id)),
    });

  // Qarshi narx: taklif ro'yxatda qoladi, narxi yangilanadi ("Siz taklif qilgan narx" belgisi bilan).
  const submitPrice = async (price) => {
    const offer = priceFor;
    setBusyId(offer.id);
    try {
      await repriceOrderOffer(orderId, offer.id, price);
      setPriceFor(null);
      await query.refetch();
      appAlert(tr('orderFlow.talk.priceSent'));
    } catch (e) {
      appAlert(tr('common.errorTitle'), getErrorMessage(e, tr, 'requests.actionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const openProfile = (offer) =>
    router.push(
      ustaRoute({
        id: offer.worker.id,
        name: offer.worker.name,
        initial: offer.worker.name?.[0]?.toUpperCase() ?? '?',
        bgColor: AVATAR_COLORS[(offer.worker.id ?? 0) % AVATAR_COLORS.length],
      })
    );

  // Tanlashdan oldin shu taklif egasi bilan gaplashish (saytdagi "Yozish").
  const openChat = (offer) =>
    router.push({
      pathname: '/chat',
      params: {
        orderId: String(orderId),
        workerId: String(offer.worker.id),
        workerName: offer.worker.name ?? '',
        ...(offer.worker.photo ? { workerPhoto: offer.worker.photo } : {}),
      },
    });

  const until = formatDeadline(tr, chooseUntil);

  return (
    <View style={{ gap: 12 }}>
      <View style={s.head}>
        <Text style={[s.title, { color: t.text }]}>{tr('orderFlow.match.offersTitle')}</Text>
        {offers.length > 0 && (
          <View style={[s.count, { backgroundColor: t.orange }]}>
            <Text style={s.countTxt}>{offers.length}</Text>
          </View>
        )}
      </View>
      {!!until && offers.length > 0 && (
        <Text style={[s.until, { color: t.orange }]}>
          {tr('orderFlow.match.chooseUntil', { when: until })}
        </Text>
      )}

      {query.isLoading ? (
        <ActivityIndicator color={t.orange} style={{ marginVertical: 16 }} />
      ) : query.isError && !query.data ? (
        <SectionError onRetry={() => query.refetch()} />
      ) : offers.length === 0 ? (
        <Text style={[s.empty, { color: t.muted }]}>{tr('orderFlow.match.noOffers')}</Text>
      ) : (
        offers.map((offer) => {
          const w = offer.worker;
          const busy = busyId === offer.id;
          return (
            <View
              key={offer.id}
              style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}
            >
              <TouchableOpacity
                style={s.who}
                activeOpacity={0.85}
                onPress={() => w.id && openProfile(offer)}
              >
                <Avatar
                  letter={w.name?.[0]?.toUpperCase() ?? '?'}
                  bgColor={AVATAR_COLORS[(w.id ?? 0) % AVATAR_COLORS.length]}
                  uri={w.photo}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={[s.name, { color: t.text }]} numberOfLines={1}>
                      {w.name}
                    </Text>
                    {w.verified && (
                      <MaterialCommunityIcons name="check-decagram" size={16} color={t.blue} />
                    )}
                  </View>
                  <Text style={[s.facts, { color: t.muted }]} numberOfLines={2}>
                    {[
                      w.rating != null ? `★ ${w.rating.toFixed(1)} (${w.reviews})` : null,
                      tr('orderFlow.match.jobsDone', { count: w.jobs }),
                      w.experience > 0
                        ? tr('orderFlow.match.experience', { count: w.experience })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.price, { color: t.orange }]}>{formatPrice(tr, offer.price)}</Text>
                  {offer.priceBy === 'customer' && (
                    <Text style={[s.byYou, { color: t.muted }]}>{tr('orderFlow.talk.byYou')}</Text>
                  )}
                </View>
              </TouchableOpacity>

              {!!offer.offerDate && (
                <View style={s.line}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={16} color={t.muted} />
                  <Text style={[s.lineTxt, { color: t.text }]}>
                    {tr('orderFlow.match.offerDay', { date: offerWhen(tr, offer) })}
                  </Text>
                </View>
              )}
              {!!offer.arrival && (
                <View style={s.line}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={t.muted} />
                  <Text style={[s.lineTxt, { color: t.text }]}>{offer.arrival}</Text>
                </View>
              )}
              {!!offer.comment && (
                <Text style={[s.comment, { color: t.subtext ?? t.muted }]}>{offer.comment}</Text>
              )}
              {!!offer.brigade && (
                <View style={s.line}>
                  <MaterialCommunityIcons name="account-group-outline" size={16} color={t.muted} />
                  <Text style={[s.lineTxt, { color: t.text }]}>
                    {tr('orderFlow.match.brigade', {
                      name: offer.brigade.name,
                      count: offer.brigade.size ?? '—',
                    })}
                  </Text>
                </View>
              )}
              {offer.estimate.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text style={[s.label, { color: t.text }]}>
                    {tr('orderFlow.match.estimateTitle')}
                  </Text>
                  <EstimateCard rows={offer.estimate} t={t} />
                </View>
              )}
              {offer.unmet.length > 0 && (
                <View style={s.line}>
                  <MaterialCommunityIcons name="alert-outline" size={16} color={t.gold} />
                  <Text style={[s.lineTxt, { color: t.gold, flex: 1 }]}>
                    {tr('orderFlow.match.unmet', { list: offer.unmet.join(', ') })}
                  </Text>
                </View>
              )}

              <View style={s.actions}>
                <TouchableOpacity
                  style={[
                    s.btn,
                    s.talkBtn,
                    { backgroundColor: t.blue + '1a', borderColor: t.blue + '55' },
                  ]}
                  activeOpacity={0.8}
                  disabled={busyId != null}
                  onPress={() => openChat(offer)}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="chat-outline" size={17} color={t.blue} />
                  <Text style={[s.btnTxt, { color: t.blue }]}>{tr('orderFlow.talk.write')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btn, { borderColor: t.line2, borderWidth: 1.5 }]}
                  activeOpacity={0.8}
                  disabled={busyId != null}
                  onPress={() => setPriceFor(offer)}
                >
                  <Text style={[s.btnTxt, { color: t.text }]} numberOfLines={1}>
                    {tr('orderFlow.talk.price')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.btn, { borderColor: t.red + '66', borderWidth: 1.5 }]}
                  activeOpacity={0.8}
                  disabled={busyId != null}
                  onPress={() => reject(offer)}
                >
                  <Text style={[s.btnTxt, { color: t.red }]}>{tr('requests.decline')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.btn,
                    { backgroundColor: t.orange, opacity: busyId != null && !busy ? 0.5 : 1 },
                  ]}
                  activeOpacity={0.85}
                  disabled={busyId != null}
                  onPress={() => choose(offer)}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[s.btnTxt, { color: '#fff' }]}>
                      {tr('orderFlow.match.choose')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
      {offers.length > 0 && (
        <Text style={[s.hint, { color: t.muted }]}>{tr('orderFlow.match.chooseHint')}</Text>
      )}
      {!!priceFor && (
        <OfferPriceForm
          offer={priceFor}
          busy={busyId === priceFor.id}
          onClose={() => setPriceFor(null)}
          onSubmit={submitPrice}
        />
      )}
    </View>
  );
}

// "{name}ga narx taklif qilish": faqat narx (sana ustaning taklifidagicha qoladi).
function OfferPriceForm({ offer, busy, onClose, onSubmit }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [price, setPrice] = useState('');
  const amount = parsePrice(price);

  return (
    <FlowModal
      visible
      title={tr('orderFlow.talk.priceTitleCustomer', { name: offer.worker.name })}
      hint={tr('orderFlow.talk.priceHintCustomer')}
      confirmLabel={tr('orderFlow.talk.priceSend')}
      disabled={!amount}
      busy={busy}
      onClose={onClose}
      onSubmit={() => onSubmit(amount)}
    >
      <Text style={[s.label, { color: t.text }]}>{tr('orderFlow.talk.priceLabel')}</Text>
      <MoneyInput
        value={price}
        onChangeText={setPrice}
        placeholder={tr('requests.pricePlaceholder', { currency: tr('common.currencySom') })}
        suffix={tr('common.currencySom')}
        t={t}
      />
    </FlowModal>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontWeight: '800', fontSize: 17 },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  until: { fontSize: 12.5, fontWeight: '700', marginTop: -6 },
  empty: { fontSize: 13.5, lineHeight: 20 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontWeight: '800', fontSize: 15, flexShrink: 1 },
  facts: { fontSize: 12, marginTop: 3 },
  price: { fontWeight: '800', fontSize: 16 },
  byYou: { fontSize: 11, marginTop: 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lineTxt: { fontSize: 13, fontWeight: '600' },
  comment: { fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  fullBtn: { flex: 0, alignSelf: 'stretch' },
  talkBtn: { flexDirection: 'row', gap: 6, borderWidth: 1.5 },
  label: { fontSize: 13, fontWeight: '700' },
  btnTxt: { fontWeight: '700', fontSize: 14 },
  message: { fontSize: 12, lineHeight: 17 },
});

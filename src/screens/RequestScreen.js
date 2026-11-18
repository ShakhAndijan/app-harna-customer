import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ustaRoute } from '../navigation/params';
import Avatar from '../components/Avatar';
import AppLoader from '../components/AppLoader';
import SectionError from './zakazchi-main/components/SectionError';
import StatusBanner from './requests/components/StatusBanner';
import ContactsCard from './orders/components/ContactsCard';
import DescriptionCard from './orders/components/DescriptionCard';
import PromptModal from './requests/components/PromptModal';
import SendToModal from './requests/components/SendToModal';
import OfferModal from './requests/components/OfferModal';
import RepostModal from './requests/components/RepostModal';
import DealCard from './requests/components/DealCard';
import OffersSection from './requests/components/OffersSection';
import MatchComplaintNotice from './requests/components/MatchComplaintNotice';
import useLiveOrder from './requests/hooks/useLiveOrder';
import useOrderActions from './requests/hooks/useOrderActions';
import {
  deadlineNote,
  describeOrder,
  formatDay,
  isDayValid,
  isOpenOrder,
  offerDay,
  timeLabel,
} from './requests/utils';
import useBottomInset from '../hooks/useBottomInset';

// Buyurtma kuzatuv ekrani (backenddan jonli): holat banneri, xulosa, usta va narx kelishuvi.
// Usta buyurtmani qabul qilgach (ACCEPTED) chat ochiladi, narx taklif/qabul qilinadi (ACTIVE).
export default function RequestScreen({ orderId, onBack }) {
  const bottomInset = useBottomInset();
  const router = useRouter();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { order, loading, failed, refresh } = useLiveOrder(orderId);
  const actions = useOrderActions(orderId, refresh);
  const [priceOpen, setPriceOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  // Sarlavhadagi "⋯" menyusi: kamdan-kam kerak bo'ladigan amallar ("Rad etish", "Bekor qilish").
  const negotiating = order?.rawStatus === 'accepted';
  const menuItems = [];
  if (order && negotiating && !!order.master) {
    menuItems.push({
      key: 'decline',
      icon: 'close',
      label: tr('orderFlow.stage.decline'),
      onPress: () => actions.confirmDecline(),
    });
  }
  if (order && isOpenOrder(order)) {
    menuItems.push({
      key: 'cancel',
      icon: 'trash-can-outline',
      label: tr('requests.cancelOrder'),
      onPress: () => setCancelOpen(true),
    });
  }

  const header = (
    <View style={s.header}>
      <TouchableOpacity
        style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={t.text} />
      </TouchableOpacity>
      <Text style={[s.title, { color: t.text }]}>
        {tr('requests.headerTitle', { id: orderId })}
      </Text>
      <View style={{ flex: 1 }} />
      {menuItems.length > 0 && (
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={() => setMenuOpen((v) => !v)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={tr('requests.moreActions')}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={22} color={t.text} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
        <StatusBar style={t.isDark ? 'light' : 'dark'} />
        {header}
        {loading ? (
          <View style={s.center}>
            <AppLoader size={160} />
          </View>
        ) : failed ? (
          <SectionError style={{ marginHorizontal: 20, marginTop: 24 }} onRetry={refresh} />
        ) : null}
      </SafeAreaView>
    );
  }

  const info = describeOrder(order, tr);
  const note = deadlineNote(order, tr);
  const hasWorker = !!order.master && order.rawStatus !== 'pending';
  const canChat = order.rawStatus === 'accepted' || order.rawStatus === 'active';
  const isActive = order.rawStatus === 'active';
  // Ustaga yuborilgan, hali javob bermagan buyurtmani qaytarib olish mumkin.
  const canRecall = order.rawStatus === 'pending' && order.workerId != null && !order.returnedAt;
  // Ommaviy buyurtma: takliflar ro'yxatidan usta tanlanadi.
  const showOffers = order.rawStatus === 'pending' && order.workerId == null && !order.returnedAt;
  const canRepost = order.rawStatus === 'cancelled' && !order.reposted;
  // Kelishuv paneli (pastda doim ko'rinadi): usta tanlangan va narx kelishilmoqda.
  const showDealBar = hasWorker && negotiating;
  const canAgree = negotiating && info.state === 'offer';
  const hasOffer = order.offerPrice != null;
  // Kelishish uchun taklifdagi sana yaroqli (bugun yoki keyin) bo'lishi kerak.
  const agreeDay = offerDay(order);
  const agreeDayOk = isDayValid(agreeDay);
  let agreeBlocked = null;
  if (!agreeDayOk) {
    agreeBlocked = agreeDay
      ? tr('orderFlow.order.takeDayGone')
      : tr('orderFlow.order.takeNeedsDay');
  }
  let whenText = '';
  if (order.scheduledDate) whenText = formatDay(tr, order.scheduledDate);
  else if (order.timingKind) whenText = tr(`orderFlow.timing.${order.timingKind}`);
  const openChat = () => router.push({ pathname: '/chat', params: { orderId: String(order.id) } });
  const openProfile = () =>
    router.push(
      ustaRoute({
        id: order.workerId,
        name: order.master,
        initial: order.letter,
        bgColor: order.color,
        trade: order.service,
      })
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: showDealBar ? 24 : 32 + bottomInset,
          gap: 16,
        }}
      >
        <StatusBanner info={info} pulsing={info.state === 'pending' || negotiating} />

        {!!note && (
          <View style={[s.note, { backgroundColor: t.gold + '1f', borderColor: t.gold + '55' }]}>
            <MaterialCommunityIcons name="timer-sand" size={18} color={t.gold} />
            <Text style={[s.noteTxt, { color: t.text }]}>{note}</Text>
          </View>
        )}

        <MatchComplaintNotice
          complaint={order.matchComplaint}
          busy={actions.busy}
          onAnswer={actions.confirmComplaintAnswer}
        />

        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <SummaryRow
            icon="wrench-outline"
            label={tr('requests.summaryTitle')}
            value={order.service ?? order.task}
            t={t}
          />
          <SummaryRow
            icon="map-marker-outline"
            label={tr('requests.summaryAddress')}
            value={order.address}
            t={t}
            expandable
          />
          {!!whenText && (
            <SummaryRow
              icon="calendar-clock"
              label={tr('orderFlow.stage.repostWhen')}
              value={whenText}
              t={t}
            />
          )}
          <SummaryRow
            icon="clock-outline"
            label={tr('requests.summaryCreated')}
            value={order.createdAt ? timeLabel(tr, order.createdAt) : ''}
            t={t}
            last
          />
        </View>

        <DescriptionCard text={order.description} />

        {hasWorker && (
          <>
            <Text style={[s.sectionTitle, { color: t.text }]}>{tr('requests.workerSection')}</Text>
            <TouchableOpacity
              style={[s.worker, { backgroundColor: t.card, borderColor: t.border }]}
              activeOpacity={0.85}
              onPress={order.workerId ? openProfile : undefined}
            >
              <Avatar
                letter={order.letter}
                bgColor={order.color}
                uri={order.masterPhoto}
                size={48}
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.workerName, { color: t.text }]} numberOfLines={1}>
                  {order.master}
                </Text>
                {!!order.workerId && (
                  <Text style={[s.workerLink, { color: t.orange }]}>
                    {tr('requests.viewProfile')}
                  </Text>
                )}
              </View>
              {canChat && (
                <TouchableOpacity
                  style={[s.chatRound, { backgroundColor: t.blue + '22' }]}
                  activeOpacity={0.8}
                  onPress={openChat}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={tr('requests.chat')}
                >
                  <MaterialCommunityIcons name="chat-processing-outline" size={22} color={t.blue} />
                </TouchableOpacity>
              )}
              <MaterialCommunityIcons name="chevron-right" size={22} color={t.faint} />
            </TouchableOpacity>

            <ContactsCard order={order} />

            <Text style={[s.sectionTitle, { color: t.text }]}>{tr('requests.priceSection')}</Text>
            <DealCard order={order} info={info} agreeDay={agreeDay} agreeBlocked={agreeBlocked} />
          </>
        )}

        {info.state === 'returned' && (
          <View style={{ gap: 10 }}>
            {(order.returnedLapsed || !!order.returnedReason) && (
              <View
                style={{
                  backgroundColor: t.card,
                  borderColor: t.border,
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 14,
                  gap: 4,
                }}
              >
                {order.returnedLapsed && (
                  <Text style={{ color: t.text, fontSize: 13, lineHeight: 19, fontWeight: '600' }}>
                    {tr('orderDetail.returnedLapsed')}
                  </Text>
                )}
                {!!order.returnedReason && (
                  <Text style={{ color: t.muted, fontSize: 13, lineHeight: 19 }}>
                    {tr('orderDetail.returnedReason')}: {order.returnedReason}
                  </Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={[s.wideBtn, { backgroundColor: t.orange, opacity: actions.busy ? 0.6 : 1 }]}
              activeOpacity={0.85}
              disabled={actions.busy}
              onPress={() => setSendOpen(true)}
            >
              <MaterialCommunityIcons name="account-arrow-right-outline" size={19} color="#fff" />
              <Text style={[s.btnText, { color: '#fff' }]}>{tr('requests.sendToOther')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.wideBtn, { borderColor: t.line2, borderWidth: 1.5 }]}
              activeOpacity={0.8}
              disabled={actions.busy}
              onPress={actions.confirmPublish}
            >
              <MaterialCommunityIcons name="bullhorn-outline" size={19} color={t.text} />
              <Text style={[s.btnText, { color: t.text }]}>{tr('requests.publish')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showOffers && (
          <OffersSection orderId={orderId} chooseUntil={order.chooseUntil} onChanged={refresh} />
        )}

        {canRecall && (
          <TouchableOpacity
            style={[s.wideBtn, { borderColor: t.line2, borderWidth: 1.5 }]}
            activeOpacity={0.8}
            disabled={actions.busy}
            onPress={actions.confirmRecall}
          >
            <MaterialCommunityIcons name="undo-variant" size={19} color={t.text} />
            <Text style={[s.btnText, { color: t.text }]}>{tr('orderFlow.order.recall')}</Text>
          </TouchableOpacity>
        )}

        {canRepost && (
          <TouchableOpacity
            style={[s.wideBtn, { backgroundColor: t.orange, opacity: actions.busy ? 0.6 : 1 }]}
            activeOpacity={0.85}
            disabled={actions.busy}
            onPress={() => setRepostOpen(true)}
          >
            <MaterialCommunityIcons name="bullhorn-outline" size={19} color="#fff" />
            <Text style={[s.btnText, { color: '#fff' }]}>{tr('orderFlow.stage.repost')}</Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[s.wideBtn, { backgroundColor: t.green, opacity: actions.busy ? 0.6 : 1 }]}
              activeOpacity={0.85}
              disabled={actions.busy}
              onPress={() => setCompleteOpen(true)}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={19} color="#fff" />
              <Text style={[s.btnText, { color: '#fff' }]}>{tr('orderFlow.stage.completeOk')}</Text>
            </TouchableOpacity>
            {info.state === 'workDone' &&
              (order.workNotDoneLeft == null || order.workNotDoneLeft > 0) && (
                <TouchableOpacity
                  style={[s.wideBtn, { borderColor: t.line2, borderWidth: 1.5 }]}
                  activeOpacity={0.8}
                  disabled={actions.busy}
                  onPress={() => actions.confirmNotDone(order.workNotDoneLeft)}
                >
                  <MaterialCommunityIcons name="progress-wrench" size={19} color={t.text} />
                  <Text style={[s.btnText, { color: t.text }]}>
                    {tr('orderFlow.stage.notDone')}
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        )}

        {/* Usta ko'rinmaydigan holatda ham chatga kirish imkoni qoladi */}
        {canChat && !hasWorker && (
          <TouchableOpacity
            style={[s.chatBtn, { backgroundColor: t.blue }]}
            activeOpacity={0.85}
            onPress={openChat}
          >
            <MaterialCommunityIcons name="chat-processing-outline" size={20} color="#fff" />
            <Text style={s.chatBtnText}>{tr('requests.chat')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showDealBar && (
        <View
          style={[
            s.dealBar,
            {
              backgroundColor: t.bg,
              borderTopColor: t.border,
              paddingBottom: 12 + bottomInset,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              s.dealBtn,
              canAgree
                ? { flex: 1, borderWidth: 1.5, borderColor: t.border, backgroundColor: t.card }
                : { flex: 1, backgroundColor: t.orange },
              { opacity: actions.busy ? 0.6 : 1 },
            ]}
            activeOpacity={0.85}
            disabled={actions.busy}
            onPress={() => setPriceOpen(true)}
          >
            <MaterialCommunityIcons name="cash-edit" size={19} color={canAgree ? t.text : '#fff'} />
            <Text style={[s.dealBtnTxt, { color: canAgree ? t.text : '#fff' }]} numberOfLines={1}>
              {hasOffer ? tr('requests.counterShort') : tr('orderFlow.stage.offer')}
            </Text>
          </TouchableOpacity>
          {canAgree && (
            <TouchableOpacity
              style={[
                s.dealBtn,
                {
                  flex: 1.3,
                  backgroundColor: t.orange,
                  opacity: actions.busy || !agreeDayOk ? 0.5 : 1,
                },
              ]}
              activeOpacity={0.85}
              disabled={actions.busy || !agreeDayOk}
              onPress={() => actions.confirmAgree(order)}
            >
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={[s.dealBtnTxt, { color: '#fff' }]} numberOfLines={1}>
                {tr('orderFlow.stage.agree')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {menuOpen && menuItems.length > 0 && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel={tr('common.close')}
          />
          <View style={[s.menu, { backgroundColor: t.card2 ?? t.card, borderColor: t.border }]}>
            {menuItems.map((item, i) => {
              const danger = item.key === 'cancel' || item.key === 'decline';
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    s.menuItem,
                    i > 0 && { borderTopWidth: 1, borderTopColor: t.border },
                    { opacity: actions.busy ? 0.5 : 1 },
                  ]}
                  activeOpacity={0.7}
                  disabled={actions.busy}
                  onPress={() => {
                    setMenuOpen(false);
                    item.onPress();
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={19}
                    color={danger ? t.red : t.text}
                  />
                  <Text style={[s.menuTxt, { color: danger ? t.red : t.text }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <OfferModal
        visible={priceOpen}
        order={order}
        busy={actions.busy}
        onClose={() => setPriceOpen(false)}
        onSubmit={async (price, day) => {
          if (await actions.offerPrice(price, day)) setPriceOpen(false);
        }}
      />
      <RepostModal
        visible={repostOpen}
        order={order}
        busy={actions.busy}
        onClose={() => setRepostOpen(false)}
        onSubmit={async (payload) => {
          if (await actions.repost(payload)) {
            setRepostOpen(false);
            appAlert(tr('orderFlow.stage.reposted'));
          }
        }}
      />
      <PromptModal
        visible={completeOpen}
        title={tr('orderFlow.stage.completeTitle')}
        hint={`${tr('orderFlow.stage.completeHint')} ${tr('orderFlow.final.once')}`}
        placeholder={tr('orderFlow.final.placeholder')}
        confirmLabel={tr('orderFlow.stage.completeOk')}
        multiline
        optional
        maxLength={1000}
        busy={actions.busy}
        onClose={() => setCompleteOpen(false)}
        onSubmit={async (comment) => {
          if (await actions.complete(comment)) setCompleteOpen(false);
        }}
      />
      <SendToModal
        visible={sendOpen}
        categoryIds={order.categoryIds}
        excludeId={order.returnedWorkerId}
        busy={actions.busy}
        onClose={() => setSendOpen(false)}
        onPick={async (worker) => {
          if (await actions.sendTo(worker.id)) {
            setSendOpen(false);
            appAlert(tr('requests.sentTo', { name: worker.name }));
          }
        }}
      />
      <PromptModal
        visible={cancelOpen}
        title={tr('requests.cancelTitle')}
        hint={
          isActive ? tr('orderFlow.stage.cancelNotice') : tr('orderFlow.stage.cancelNoticeEarly')
        }
        placeholder={tr('requests.cancelReasonPlaceholder')}
        confirmLabel={tr('requests.cancelConfirm')}
        multiline
        minLength={5}
        destructive
        busy={actions.busy}
        onClose={() => setCancelOpen(false)}
        onSubmit={async (reason) => {
          if (await actions.cancel(reason)) setCancelOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

// Uzun qiymat (manzil) qisqartirib ko'rsatiladi; qatorga bosilsa to'liq ochiladi/yopiladi.
function SummaryRow({ icon, label, value, t, last, expandable }) {
  const [open, setOpen] = useState(false);
  const long = !!expandable && !!value && String(value).length > 26;
  const rowStyle = [
    s.row,
    long && open && { alignItems: 'flex-start' },
    !last && { borderBottomWidth: 1, borderBottomColor: t.border },
  ];
  const content = (
    <>
      <MaterialCommunityIcons name={icon} size={20} color={t.muted} />
      <Text style={[s.rowLabel, { color: t.muted }]}>{label}</Text>
      <Text
        style={[s.rowValue, { color: t.text }]}
        numberOfLines={open ? undefined : 2}
        selectable={open}
      >
        {value || '—'}
      </Text>
      {long && (
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={t.faint}
        />
      )}
    </>
  );
  if (!long) return <View style={rowStyle}>{content}</View>;
  return (
    <TouchableOpacity
      style={rowStyle}
      activeOpacity={0.7}
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      {content}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '700', fontSize: 20 },
  card: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  noteTxt: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  rowLabel: { fontSize: 12.5, width: 74 },
  rowValue: { flex: 1, fontSize: 13.5, fontWeight: '600', textAlign: 'right' },
  sectionTitle: { fontWeight: '800', fontSize: 17, marginTop: 4 },
  worker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  workerName: { fontWeight: '800', fontSize: 15.5 },
  workerLink: { fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  btn: {
    minHeight: 50,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { fontWeight: '700', fontSize: 14.5 },
  wideBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatBtn: {
    height: 52,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chatRound: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  dealBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  dealBtnTxt: { fontWeight: '800', fontSize: 15, flexShrink: 1 },
  menu: {
    position: 'absolute',
    top: 56,
    right: 20,
    minWidth: 190,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuTxt: { fontWeight: '700', fontSize: 14 },
});

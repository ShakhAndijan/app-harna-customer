import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, useKeyboardState } from 'react-native-keyboard-controller';
import useBottomInset from '../hooks/useBottomInset';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getOrderChat, sendOrderChat, markOrderChatRead } from '../api/orders';
import Avatar from '../components/Avatar';
import OfferModal from './requests/components/OfferModal';
import usePolling from './requests/hooks/usePolling';
import { pollEvery } from '../utils/realtime';
import useLiveOrder from './requests/hooks/useLiveOrder';
import useOrderActions from './requests/hooks/useOrderActions';
import { clockLabel, formatDay, formatPrice, isDayValid, offerDay } from './requests/utils';
import { getErrorMessage } from '../utils/errors';

// Real vaqt ulangan bo'lsa chat zaxira sifatida siyrak so'raladi.
const CHAT_POLL_MS = pollEvery(5000, 30000);

// Buyurtma chati (backenddan): usta bilan suhbat, narx takliflari chatda alohida qator bo'lib
// ko'rinadi. Tepada joriy taklif va "Qabul qilish" / "Narx taklif qilish" tugmalari turadi.
// `workerId` berilsa (usta tanlanmagan buyurtmada taklif kartasidan "Yozish"), aynan shu usta bilan
// suhbat ochiladi va xabarlar unga yuboriladi.
export default function RequestChatScreen({
  orderId,
  workerId = null,
  workerName = null,
  workerPhoto = null,
  onBack,
}) {
  const { theme: t } = useTheme();
  const bottomInset = useBottomInset();
  const keyboardVisible = useKeyboardState((st) => st.isVisible);
  const { t: tr } = useLanguage();
  const { order, refresh: refreshOrder } = useLiveOrder(orderId);
  const actions = useOrderActions(orderId, refreshOrder);
  const [chat, setChat] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const scrollRef = useRef(null);

  const loadChat = useCallback(async () => {
    try {
      setChat(await getOrderChat(orderId));
    } catch {
      // Yangilash muvaffaqiyatsiz bo'lsa, avvalgi chat saqlanadi.
    }
  }, [orderId]);

  usePolling(loadChat, CHAT_POLL_MS);

  // Hozirgi usta bilan suhbat (bo'lmasa — eng oxirgisi).
  const thread =
    workerId != null
      ? chat?.threads.find((th) => th.workerId === workerId)
      : (chat?.threads.find((th) => th.isActive) ?? chat?.threads[chat.threads.length - 1]);
  const messages = thread?.messages ?? [];

  useEffect(() => {
    if (chat?.unread) markOrderChatRead(orderId).catch(() => {});
  }, [chat?.unread, orderId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      setChat(await sendOrderChat(orderId, body, workerId));
      setText('');
    } catch (e) {
      appAlert(tr('common.errorTitle'), getErrorMessage(e, tr, 'requests.actionFailed'));
    } finally {
      setSending(false);
    }
  };

  const negotiating = order?.rawStatus === 'accepted';
  const workerOffer = negotiating && order.offerBy !== 'customer' && order.offerPrice != null;
  // Aniq ustaga yozilganda: suhbat bor bo'lsa faqat u faol bo'lganda, hali boshlanmagan bo'lsa — taklif turgani uchun mumkin.
  const canSend = workerId != null ? (thread ? thread.isActive : true) : chat ? chat.canSend : true;
  // Kelishish uchun taklifdagi sana yaroqli bo'lishi kerak (saytdagidek).
  const offerDayValue = negotiating ? offerDay(order) : null;
  const agreeDayOk = isDayValid(offerDayValue);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      <View style={[s.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={t.text} />
        </TouchableOpacity>
        <Avatar
          letter={
            (thread?.workerName ?? workerName ?? order?.master ?? '?').trim()[0]?.toUpperCase() ??
            '?'
          }
          bgColor={order?.color}
          uri={thread?.workerPhoto ?? workerPhoto ?? order?.masterPhoto}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text style={[s.name, { color: t.text }]} numberOfLines={1}>
            {thread?.workerName ?? workerName ?? order?.master ?? tr('requests.workerSection')}
          </Text>
          <Text style={[s.meta, { color: t.muted }]} numberOfLines={1}>
            {tr('requests.headerTitle', { id: orderId })}
          </Text>
        </View>
      </View>

      {negotiating && (
        <View
          style={[s.offerCard, { backgroundColor: t.orange + '14', borderColor: t.orange + '40' }]}
        >
          <View style={[s.offerIcon, { backgroundColor: t.orange + '26' }]}>
            <MaterialCommunityIcons name="handshake-outline" size={20} color={t.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.priceLabel, { color: t.muted }]} numberOfLines={1}>
              {order.offerPrice == null
                ? tr('requests.noOfferYet')
                : order.offerBy === 'worker'
                  ? tr('requests.offerFromWorker')
                  : tr('requests.offerFromMe')}
            </Text>
            {order.offerPrice != null && (
              <Text
                style={[s.priceValue, { color: t.orange }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatPrice(tr, order.offerPrice)}
              </Text>
            )}
          </View>
          {!!offerDayValue && order.offerPrice != null && (
            <View style={[s.dayPill, { backgroundColor: t.card, borderColor: t.border }]}>
              <MaterialCommunityIcons name="calendar-clock" size={14} color={t.muted} />
              <Text style={[s.dayTxt, { color: t.text }]}>{formatDay(tr, offerDayValue)}</Text>
            </View>
          )}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.messages}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <Text style={[s.empty, { color: t.faint }]}>{tr('requests.chatEmpty')}</Text>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} t={t} tr={tr} />
          ))}
        </ScrollView>

        {negotiating && !keyboardVisible && (
          <View style={[s.actions, { borderTopColor: t.border, backgroundColor: t.bg }]}>
            <TouchableOpacity
              style={[
                s.declineBtn,
                { borderColor: t.red + '55', backgroundColor: t.red + '10' },
                { opacity: actions.busy ? 0.5 : 1 },
              ]}
              activeOpacity={0.8}
              disabled={actions.busy}
              onPress={() => actions.confirmDecline(loadChat)}
              accessibilityRole="button"
              accessibilityLabel={tr('orderFlow.stage.decline')}
            >
              <MaterialCommunityIcons name="close" size={22} color={t.red} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.actionBtn,
                workerOffer
                  ? { flex: 1, borderWidth: 1.5, borderColor: t.border, backgroundColor: t.card }
                  : { flex: 1, backgroundColor: t.orange },
                { opacity: actions.busy ? 0.6 : 1 },
              ]}
              activeOpacity={0.85}
              disabled={actions.busy}
              onPress={() => setPriceOpen(true)}
            >
              <MaterialCommunityIcons
                name="cash-edit"
                size={19}
                color={workerOffer ? t.text : '#fff'}
              />
              <Text
                style={[s.actionTxt, { color: workerOffer ? t.text : '#fff' }]}
                numberOfLines={1}
              >
                {order.offerPrice != null
                  ? tr('requests.counterShort')
                  : tr('orderFlow.stage.offer')}
              </Text>
            </TouchableOpacity>
            {workerOffer && (
              <TouchableOpacity
                style={[
                  s.actionBtn,
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
                <Text style={[s.actionTxt, { color: '#fff' }]} numberOfLines={1}>
                  {tr('orderFlow.stage.agree')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {canSend ? (
          <View
            style={[
              s.inputRow,
              { borderTopColor: t.border, backgroundColor: t.bg, paddingBottom: 10 + bottomInset },
            ]}
          >
            <TextInput
              style={[
                s.input,
                { backgroundColor: t.inputBg, color: t.text, borderColor: t.border },
              ]}
              value={text}
              onChangeText={setText}
              placeholder={tr('requests.chatPlaceholder')}
              placeholderTextColor={t.faint}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: text.trim() ? t.orange : t.card3 }]}
              activeOpacity={0.85}
              onPress={send}
              disabled={!text.trim() || sending}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text
            style={[
              s.closed,
              { color: t.faint, borderTopColor: t.border, paddingBottom: 14 + bottomInset },
            ]}
          >
            {tr('requests.chatClosed')}
          </Text>
        )}
      </KeyboardAvoidingView>

      <OfferModal
        visible={priceOpen}
        order={order}
        busy={actions.busy}
        onClose={() => setPriceOpen(false)}
        onSubmit={async (price, day) => {
          if (await actions.offerPrice(price, day)) {
            setPriceOpen(false);
            loadChat();
          }
        }}
      />
    </SafeAreaView>
  );
}

function MessageBubble({ message: m, t, tr }) {
  if (m.kind === 'system') {
    // Backend ba'zan matn o'rniga kalit (order_accepted) yuboradi: tarjima qilinadi, noma'lum kalit yashiriladi.
    let body = m.body;
    if (/^[a-z][a-z0-9_]*$/.test(body)) {
      const key = `requests.sys.${body}`;
      const label = tr(key);
      if (label === key) return null;
      body = label;
    }
    if (!body) return null;
    return (
      <View style={[s.systemPill, { backgroundColor: t.card, borderColor: t.border }]}>
        <MaterialCommunityIcons name="information-outline" size={14} color={t.muted} />
        <Text style={[s.system, { color: t.muted }]}>{body}</Text>
      </View>
    );
  }

  const mine = m.from === 'me';

  if (m.kind === 'offer') {
    return (
      <View
        style={[
          s.offer,
          {
            alignSelf: mine ? 'flex-end' : 'flex-start',
            backgroundColor: t.card,
            borderColor: t.orange,
          },
        ]}
      >
        <View style={s.offerHead}>
          <MaterialCommunityIcons name="cash-multiple" size={15} color={t.orange} />
          <Text style={[s.offerLabel, { color: t.muted }]}>{tr('requests.offerBubble')}</Text>
        </View>
        <Text style={[s.offerPrice, { color: t.orange }]}>
          {m.offerPrice != null ? formatPrice(tr, m.offerPrice) : m.body}
        </Text>
        <Text style={[s.bubbleTime, { color: t.faint }]}>{clockLabel(m.at)}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        s.bubble,
        mine
          ? { alignSelf: 'flex-end', backgroundColor: t.orange, borderBottomRightRadius: 4 }
          : { alignSelf: 'flex-start', backgroundColor: t.card, borderBottomLeftRadius: 4 },
      ]}
    >
      <Text style={[s.bubbleText, { color: mine ? '#fff' : t.text }]}>{m.body}</Text>
      <Text style={[s.bubbleTime, { color: mine ? 'rgba(255,255,255,0.75)' : t.faint }]}>
        {clockLabel(m.at)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: '800', fontSize: 15.5 },
  meta: { fontSize: 12, marginTop: 2 },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: { fontSize: 12, fontWeight: '600' },
  priceValue: { fontWeight: '900', fontSize: 22, letterSpacing: -0.4, marginTop: 1 },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayTxt: { fontSize: 12.5, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: 1,
  },
  declineBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  actionTxt: { fontWeight: '800', fontSize: 14.5, flexShrink: 1 },
  messages: { padding: 16, gap: 8, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 13 },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    marginVertical: 4,
  },
  system: { fontSize: 12, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9, gap: 3 },
  bubbleText: { fontSize: 14.5, lineHeight: 20 },
  bubbleTime: { fontSize: 10, alignSelf: 'flex-end' },
  offer: {
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
    minWidth: 170,
  },
  offerHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  offerLabel: { fontSize: 11.5, fontWeight: '600' },
  offerPrice: { fontWeight: '900', fontSize: 20, letterSpacing: -0.3 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closed: { textAlign: 'center', fontSize: 12.5, paddingVertical: 14, borderTopWidth: 1 },
});

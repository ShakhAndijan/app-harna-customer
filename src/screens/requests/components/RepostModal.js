import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import MoneyInput from '../../new-order/components/MoneyInput';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FlowModal from './FlowModal';
import DayField from './DayField';
import WindowField from './WindowField';
import { useOrderTiming } from '../../../queries/orderTiming';
import { keptWindow, normalizeTime, tashkentToday, urgentSoon, openSlots } from '../arrival';
import { formatDay, formatPrice, isDayValid } from '../utils';
import { parsePrice } from '../hooks/useOrderActions';

const TIMINGS = ['today', 'urgent', 'on_date', 'flexible'];

// Bekor qilingan buyurtmani qayta e'lon qilish (saytdagi "Qayta e'lon qilish"): tavsif, manzil va rasmlar
// o'zgarmaydi; "qachon kerak" va narxni shu yerda o'zgartirish mumkin (ikkalasi ham ixtiyoriy).
export default function RepostModal({ visible, ...rest }) {
  // Forma har ochilganda yangidan boshlanadi (holat ochilganda qayta yaratiladi).
  return visible ? <RepostForm {...rest} /> : null;
}

function RepostForm({ order, busy, onClose, onSubmit }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  const dayGone =
    order?.timingKind === 'on_date' && !!order.scheduledDate && !isDayValid(order.scheduledDate);

  const [timing, setTiming] = useState(dayGone ? null : (order.timingKind ?? null));
  const [day, setDay] = useState(
    !dayGone && order.scheduledDate ? order.scheduledDate.slice(0, 10) : null
  );
  const [budget, setBudget] = useState('');
  const priced = order?.platformPrice != null;
  // Kelish oralig'i: buyurtmadagi oldingisi kun o'zgarmasa saqlanadi; kun yoki turi o'zgarsa yaroqsiz bo'lishi mumkin.
  const [windowPick, setWindowPick] = useState(() =>
    dayGone ? null : normalizeTime(order?.windowStart)
  );
  const orderTiming = useOrderTiming();

  const needsDay = timing === 'on_date' && !day;
  // Oyna faqat aniq kun bilan: "Bugun" yoki tanlangan sana.
  const windowDay = timing === 'today' ? tashkentToday() : timing === 'on_date' ? day : null;
  const windowValue = keptWindow(orderTiming, windowDay, windowPick, { notBegun: true });

  const submit = () => {
    const payload = {};
    if (timing) {
      payload.timing_kind = timing;
      payload.scheduled_date = timing === 'on_date' ? day : null;
      if (windowDay) payload.window_start = windowValue;
    }
    // Narxi platforma belgilagan buyurtmani server xizmatning hozirgi narxida qayta baholaydi: boshqa summa
    // yuborilsa 409 `platform_price_changed`, shuning uchun summa maydoni yo'q va yuborilmaydi.
    const amount = priced ? null : parsePrice(budget);
    if (amount) payload.budget = amount;
    onSubmit(payload);
  };

  return (
    <FlowModal
      visible
      title={tr('orderFlow.stage.repostTitle')}
      hint={tr('orderFlow.stage.repostHint')}
      confirmLabel={tr('orderFlow.stage.repost')}
      disabled={needsDay}
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
    >
      {dayGone && (
        <View style={[s.warn, { backgroundColor: t.gold + '22', borderColor: t.gold + '55' }]}>
          <Text style={[s.warnTxt, { color: t.text }]}>
            {tr('orderFlow.stage.repostDayGone', { date: formatDay(tr, order.scheduledDate) })}
          </Text>
        </View>
      )}

      <Text style={[s.label, { color: t.text }]}>{tr('orderFlow.stage.repostWhen')}</Text>
      <View style={s.chips}>
        {TIMINGS.map((key) => {
          const active = timing === key;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.85}
              onPress={() => setTiming(key)}
              style={[
                s.chip,
                active
                  ? { backgroundColor: t.orange, borderColor: t.orange }
                  : { backgroundColor: t.inputBg, borderColor: t.border },
              ]}
            >
              <Text style={[s.chipTxt, { color: active ? '#fff' : t.text }]}>
                {tr(`orderFlow.timing.${key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {timing === 'on_date' && (
        <>
          <Text style={[s.label, { color: t.text }]}>{tr('orderFlow.order.offerDay')}</Text>
          <DayField value={day} onChange={setDay} />
        </>
      )}

      {!!windowDay && (
        <>
          <Text style={[s.label, { color: t.text }]}>{tr('arrivalWindow.askLabel')}</Text>
          <WindowField
            slots={openSlots(orderTiming, windowDay, { notBegun: true })}
            value={windowValue}
            minutes={orderTiming.minutes}
            onChange={setWindowPick}
          />
          {urgentSoon(orderTiming, windowDay, windowValue) && (
            <View
              style={[s.soon, { backgroundColor: t.red + '1a', borderColor: t.red + '55' }]}
              accessibilityRole="text"
            >
              <MaterialCommunityIcons name="lightning-bolt" size={17} color={t.red} />
              <Text style={[s.soonTxt, { color: t.red }]}>{tr('arrivalWindow.urgentSoon')}</Text>
            </View>
          )}
        </>
      )}

      {priced ? (
        <Text style={[s.note, { color: t.muted }]}>{tr('platformPrice.repostHint')}</Text>
      ) : (
        <>
          <Text style={[s.label, { color: t.text }]}>{tr('orderFlow.stage.repostBudget')}</Text>
          <MoneyInput
            value={budget}
            onChangeText={setBudget}
            placeholder={tr('requests.pricePlaceholder', { currency: tr('common.currencySom') })}
            suffix={tr('common.currencySom')}
            t={t}
          />
          <Text style={[s.note, { color: t.muted }]}>
            {order?.budget
              ? tr('orderFlow.stage.repostBudgetKeep', { price: formatPrice(tr, order.budget) })
              : tr('orderFlow.stage.repostBudgetNone')}
          </Text>
        </>
      )}
    </FlowModal>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 17 },
  soon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  soonTxt: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  warn: { borderRadius: 12, borderWidth: 1, padding: 10 },
  warnTxt: { fontSize: 12.5, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9 },
  chipTxt: { fontSize: 13, fontWeight: '700' },
});

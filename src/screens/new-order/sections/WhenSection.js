import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { appAlert } from '../../../components/AppAlert';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatWhenDate } from '../utils';
import { common } from '../styles';
import OptionSheet from '../components/OptionSheet';
import ToggleSwitch from '../components/ToggleSwitch';
import WorkerDays, { useWorkerDays } from '../components/WorkerDays';
import WindowField from '../../requests/components/WindowField';
import { openSlots, urgentSoon } from '../../requests/arrival';

// Tanlangan variantga mos ikonka: bugun — bugungi kun belgisi, sana — oylik taqvim.
const WHEN_ICONS = {
  today: 'calendar-today',
  date: 'calendar-month-outline',
};

// "Qachon kerak?": bitta maydon, odatda "Bugun". Bosilganda boshqa variant tanlanadi
// (sana / erkin), "Shoshilinch" esa shu kartaning ichidagi alohida tugma.
// `windowDay` — oyna so'raladigan kun ("Bugun" yoki tanlangan sana; shoshilinchda yo'q), `whenWindow` — tanlangan
// oraliq boshi ("10:00" yoki null), `timing` — serverdagi vaqt qoidalari.
export default function WhenSection({
  when,
  setWhen,
  whenDate,
  setWhenDate,
  workerId,
  windowDay,
  whenWindow,
  setWhenWindow,
  timing,
}) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Sana faqat tanlab bo'lingach o'rnatiladi: oyna yopilsa, oldingi tanlov saqlanib qoladi.
  const { days, kindOf } = useWorkerDays(workerId);
  const applyDate = (date) => {
    // Aniq ustaga buyurtmada usta dam olayotgan yoki to'la kunni tanlab bo'lmaydi.
    if (kindOf(date) !== 'open') {
      appAlert(tr('newOrder.when.pickedUnavailable'));
      return;
    }
    setWhenDate(date);
    setWhen('date');
  };

  const openWhenDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: whenDate || new Date(),
        mode: 'date',
        minimumDate: new Date(),
        onValueChange: (_e, selectedDate) => {
          DateTimePickerAndroid.open({
            value: whenDate || selectedDate,
            mode: 'time',
            onValueChange: (_e2, selectedTime) => {
              const combined = new Date(selectedDate);
              combined.setHours(selectedTime.getHours(), selectedTime.getMinutes());
              applyDate(combined);
            },
          });
        },
      });
    } else {
      setShowIosDatePicker(true);
    }
  };

  const options = [
    { id: 'today', name: tr('newOrder.when.today'), icon: WHEN_ICONS.today },
    { id: 'date', name: tr('newOrder.when.date'), icon: WHEN_ICONS.date },
  ];

  const onSelect = (id) => {
    if (id === 'date') openWhenDatePicker();
    else setWhen(id);
  };

  const urgent = when === 'urgent';
  const valueText =
    when === 'date' && whenDate ? formatWhenDate(whenDate) : tr('newOrder.when.today');

  return (
    <>
      {/* ── Qachon ── */}
      <Text style={[common.label, { color: t.text }]}>
        {tr('newOrder.whenLabel')}
        <Text style={{ color: t.red }}> *</Text>
      </Text>

      <View
        style={[s.card, { backgroundColor: t.card, borderColor: urgent ? t.orange : t.border }]}
      >
        <TouchableOpacity
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          style={s.field}
        >
          <View style={[s.icon, { backgroundColor: t.orange + '1f' }]}>
            <MaterialCommunityIcons
              name={WHEN_ICONS[when] ?? WHEN_ICONS.today}
              size={20}
              color={t.orange}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.value, { color: t.text }]} numberOfLines={1}>
              {valueText}
            </Text>
          </View>
          <Text style={[s.change, { color: t.orange }]}>{tr('newOrder.when.change')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={t.faint} />
        </TouchableOpacity>

        <View style={[s.divider, { backgroundColor: t.border }]} />

        <View style={s.urgentRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color={t.orange} />
          <View style={{ flex: 1 }}>
            <Text style={[s.urgentTitle, { color: t.text }]}>{tr('newOrder.when.urgent')}</Text>
            <Text style={[s.sub, { color: t.muted }]} numberOfLines={2}>
              {tr('newOrder.when.urgentSubtitle')}
            </Text>
          </View>
          <ToggleSwitch value={urgent} onChange={(on) => setWhen(on ? 'urgent' : 'today')} t={t} />
        </View>
      </View>

      {/* «Qaysi vaqtda kelsin?»: faqat kun aniq bo'lganda (bugun yoki tanlangan sana); boshlanib bo'lgan
          oraliqlar chiqarilmaydi. Vaqt yaqin bo'lsa server buyurtmani o'zi shoshilinch qiladi — oldindan aytiladi. */}
      {!!windowDay && !urgent && (
        <View style={s.windowBox}>
          <Text style={[common.label, { color: t.text }]}>{tr('arrivalWindow.askLabel')}</Text>
          <WindowField
            slots={openSlots(timing, windowDay, { notBegun: true })}
            value={whenWindow}
            minutes={timing.minutes}
            onChange={setWhenWindow}
          />
          {urgentSoon(timing, windowDay, whenWindow) && (
            <View
              style={[s.soon, { backgroundColor: t.red + '1a', borderColor: t.red + '55' }]}
              accessibilityRole="text"
            >
              <MaterialCommunityIcons name="lightning-bolt" size={17} color={t.red} />
              <Text style={[s.soonText, { color: t.red }]}>{tr('arrivalWindow.urgentSoon')}</Text>
            </View>
          )}
        </View>
      )}

      <WorkerDays days={days} whenDate={when === 'date' ? whenDate : null} onPick={applyDate} />

      <OptionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={tr('newOrder.whenLabel')}
        options={options}
        selectedId={urgent ? null : when}
        onSelect={onSelect}
        t={t}
        tr={tr}
      />

      {Platform.OS === 'ios' && showIosDatePicker && (
        <DateTimePicker
          value={whenDate || new Date()}
          mode="datetime"
          minimumDate={new Date()}
          onValueChange={(_e, selectedDate) => {
            applyDate(selectedDate);
            setShowIosDatePicker(false);
          }}
          onDismiss={() => setShowIosDatePicker(false)}
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 16, overflow: 'hidden' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  change: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1 },
  windowBox: { gap: 10, marginTop: 14 },
  soon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  soonText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  urgentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  urgentTitle: { fontSize: 14, fontWeight: '700' },
});

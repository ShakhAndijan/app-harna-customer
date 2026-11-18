import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { clockLabel, formatDeadline, isExpired } from '../../requests/utils';
import { dayWithWindow, orderWindowLabel } from '../../requests/arrival';

// Javob berilgandan keyingi holat matni (saytdagi `mt`): da'vo bo'lsa — uning holati, bo'lmasa — javob.
function statusText(tr, check) {
  if (check.complaintId != null) {
    if (check.status === 'awaiting_worker') {
      return tr('arrivalCheck.awaitingWorker', { deadline: formatDeadline(tr, check.deadline) });
    }
    if (check.status === 'disputed') return tr('arrivalCheck.disputed');
    if (check.status === 'rejected' && check.resolution !== 'job_completed') {
      return tr('arrivalCheck.rejected');
    }
    return null;
  }
  if (check.answer === 'on_time') return tr('arrivalCheck.answeredOnTime');
  if (check.answer === 'late') return tr('arrivalCheck.answeredLate');
  return null;
}

// Faol buyurtmada: usta yetib kelgani va "Usta keldimi?" savoli (vaqtida / kechikib / kelmadi).
export default function ArrivalCard({ order, busy, onAnswer }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  if (order.rawStatus !== 'active') return null;
  const check = order.arrivalCheck;

  const arrived = order.workerArrivedAt ? (
    <View style={[s.card, { backgroundColor: t.green + '1a', borderColor: t.green + '55' }]}>
      <View style={s.head}>
        <MaterialCommunityIcons name="map-marker-check-outline" size={20} color={t.green} />
        <Text style={[s.title, { color: t.text }]}>
          {tr('arrivalCheck.arrived', { time: clockLabel(order.workerArrivedAt) })}
        </Text>
      </View>
    </View>
  ) : null;

  if (!check) return arrived;

  if (check.canAnswer && !(check.until && isExpired(check.until))) {
    const when = dayWithWindow(tr, order.scheduledDate, orderWindowLabel(order));
    const until = formatDeadline(tr, check.until);
    return (
      <>
        {arrived}
        <View style={[s.card, { backgroundColor: t.gold + '1f', borderColor: t.gold + '55' }]}>
          <View style={s.head}>
            <MaterialCommunityIcons name="account-question-outline" size={20} color={t.gold} />
            <Text style={[s.title, { color: t.text }]}>{tr('arrivalCheck.title')}</Text>
          </View>
          <Text style={[s.text, { color: t.text }]}>
            {tr('arrivalCheck.body', { when: when || '—' })}
          </Text>
          {!!until && (
            <Text style={[s.note, { color: t.muted }]}>{tr('arrivalCheck.until', { until })}</Text>
          )}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: t.green, opacity: busy ? 0.6 : 1 }]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={() => onAnswer('on_time')}
              accessibilityRole="button"
            >
              <Text style={[s.btnTxt, { color: '#fff' }]}>{tr('arrivalCheck.onTime')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { borderColor: t.line2, borderWidth: 1.5, opacity: busy ? 0.6 : 1 }]}
              activeOpacity={0.8}
              disabled={busy}
              onPress={() => onAnswer('late')}
              accessibilityRole="button"
            >
              <Text style={[s.btnTxt, { color: t.text }]}>{tr('arrivalCheck.late')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              s.btn,
              s.wide,
              { borderColor: t.red, borderWidth: 1.5, opacity: busy ? 0.6 : 1 },
            ]}
            activeOpacity={0.8}
            disabled={busy}
            onPress={() => onAnswer('no_show')}
            accessibilityRole="button"
          >
            <Text style={[s.btnTxt, { color: t.red }]}>{tr('arrivalCheck.noShow')}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const text = statusText(tr, check);
  if (!text) return arrived;
  const warn = check.status === 'awaiting_worker';
  return (
    <>
      {arrived}
      <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={s.head}>
          <MaterialCommunityIcons
            name={warn ? 'timer-sand' : 'information-outline'}
            size={20}
            color={warn ? t.gold : t.blue}
          />
          <Text style={[s.body, { color: t.text }]}>{text}</Text>
        </View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 14.5, fontWeight: '800', lineHeight: 20 },
  body: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  text: { fontSize: 13.5, lineHeight: 19 },
  note: { fontSize: 12.5, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  wide: { flex: 0, alignSelf: 'stretch' },
  btnTxt: { fontWeight: '700', fontSize: 14 },
});

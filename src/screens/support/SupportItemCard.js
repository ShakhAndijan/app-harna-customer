import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { notificationDate } from '../notifications/utils';
import { messageTime } from './utils';

// Bitta murojaat / taklif: holat belgisi, sana va yozishma (mijoz xabari o'ngda, jamoa javobi chapda).
export default function SupportItemCard({ item }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const tone = item.status === 'answered' ? t.green : item.status === 'closed' ? t.faint : t.gold;

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={s.head}>
        <View style={[s.status, { backgroundColor: tone + '22' }]}>
          <Text style={[s.statusText, { color: tone }]}>{tr(`support.status.${item.status}`)}</Text>
        </View>
        <Text style={[s.date, { color: t.faint }]}>
          #{item.id} · {notificationDate(item.createdAt)}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {item.messages.map((m) =>
          m.mine ? (
            <View key={m.id} style={s.mineRow}>
              <View style={[s.bubble, { backgroundColor: t.orange + '1f' }]}>
                <Text style={[s.text, { color: t.text }]}>{m.text}</Text>
                <Text style={[s.time, { color: t.faint }]}>{messageTime(m.createdAt)}</Text>
              </View>
            </View>
          ) : (
            <View key={m.id} style={s.teamRow}>
              <View style={[s.bubble, { backgroundColor: t.rowIconBg }]}>
                <Text style={[s.team, { color: t.orange }]}>{tr('support.teamName')}</Text>
                <Text style={[s.text, { color: t.text }]}>{m.text}</Text>
                <Text style={[s.time, { color: t.faint }]}>{messageTime(m.createdAt)}</Text>
              </View>
            </View>
          )
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '800' },
  date: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  mineRow: { alignItems: 'flex-end' },
  teamRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '88%', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  team: { fontSize: 12, fontWeight: '800', marginBottom: 3 },
  text: { fontSize: 14, lineHeight: 20 },
  time: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
});

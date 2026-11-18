import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';

function SettingsRow({ icon, label, value, danger, color, onPress }) {
  const { theme: t } = useTheme();

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: danger ? 'rgba(224,71,58,0.13)' : color ? color + '22' : t.rowIconBg,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={19} color={danger ? t.red : color || t.muted} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? t.red : t.text }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: t.muted }]}>{value}</Text> : null}
      {!danger && <MaterialCommunityIcons name="chevron-right" size={18} color={t.faint} />}
    </TouchableOpacity>
  );
}

// Qatorlar ro'yxati bitta kartada, orasida ajratuvchi chiziq bilan.
// `rows`: [{ icon, label, value?, color?, danger?, onPress }]. `title` — kartadan oldingi kichik sarlavha.
export default function MenuCard({ rows, title, style }) {
  const { theme: t } = useTheme();

  return (
    <View style={[{ paddingHorizontal: 20 }, style]}>
      {!!title && <Text style={[styles.groupLabel, { color: t.faint }]}>{title}</Text>}
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
        {rows.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: t.border }]} />}
            <SettingsRow {...row} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: { flex: 1, fontWeight: '600', fontSize: 14 },
  rowValue: { fontSize: 12.5 },
  divider: { height: 1 },
});

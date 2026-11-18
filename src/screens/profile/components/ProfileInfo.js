import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

// Ism, telefon, manzil, holat belgilari va "Tahrirlash" tugmasi (markazda). Bo'sh qiymatlar chizilmaydi.
export default function ProfileInfo({
  name,
  phone,
  location,
  onEdit,
  onLocationPress,
  identityStatus,
  rating,
  onIdentityPress,
  onRatingPress,
}) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  return (
    <View style={styles.wrap}>
      {!!name && (
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
            {name}
          </Text>
          {identityStatus === 'approved' && (
            <MaterialCommunityIcons name="check-decagram" size={20} color={t.green} />
          )}
        </View>
      )}
      {!!phone && <Text style={[styles.phone, { color: t.muted }]}>{phone}</Text>}
      {!!location && (
        <TouchableOpacity
          onPress={onLocationPress}
          disabled={!onLocationPress}
          activeOpacity={0.7}
          hitSlop={8}
          style={styles.locRow}
        >
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={t.faint} />
          <Text style={[styles.loc, { color: t.faint }]} numberOfLines={1}>
            {location}
          </Text>
          {!!onLocationPress && <MaterialCommunityIcons name="pencil" size={11} color={t.faint} />}
        </TouchableOpacity>
      )}
      <View style={styles.chips}>
        {identityStatus === 'approved' ? (
          <Chip icon="shield-check" color={t.green} label={tr('account.identityApproved')} />
        ) : identityStatus ? (
          <Chip
            icon="shield-account-outline"
            color={identityStatus === 'rejected' ? t.red : t.gold}
            label={tr(`account.verify.status.${identityStatus}`)}
            onPress={onIdentityPress}
            chevron
          />
        ) : null}
        <Chip
          icon="star"
          color={t.gold}
          label={rating ? rating.toFixed(1) : tr('account.noRatingYet')}
          onPress={onRatingPress}
        />
      </View>
      <TouchableOpacity
        style={[styles.editBtn, { backgroundColor: t.orange }]}
        activeOpacity={0.85}
        onPress={onEdit}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="pencil-outline" size={15} color="#fff" />
        <Text style={styles.editText}>{tr('common.edit')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Chip({ icon, color, label, onPress, chevron }) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: color + '22', borderColor: color + '44' }]}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={13} color={color} />
      <Text style={{ color, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>
        {label}
      </Text>
      {chevron && <MaterialCommunityIcons name="chevron-right" size={14} color={color} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 14, alignSelf: 'stretch' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '92%' },
  name: { fontWeight: '800', fontSize: 23, letterSpacing: -0.3, flexShrink: 1 },
  phone: { fontSize: 13.5, marginTop: 3, fontWeight: '500' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, maxWidth: '90%' },
  loc: { fontSize: 12, flexShrink: 1 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 22,
    height: 40,
    borderRadius: 20,
  },
  editText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },
});

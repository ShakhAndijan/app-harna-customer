import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { common } from '../styles';

export default function PaymentOption({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  active,
  onPress,
  t,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        s.paymentCard,
        {
          backgroundColor: active ? (t.isDark ? 'rgba(232,122,69,0.14)' : '#FDEEE4') : t.card,
          borderColor: active ? t.orange : t.border,
        },
      ]}
    >
      <View style={[s.paymentIconWrap, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={19} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.paymentTitle, { color: t.text }]}>{title}</Text>
        {!!subtitle && (
          <Text style={[s.paymentSub, { color: t.muted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[common.radioOuter, { borderColor: active ? t.orange : t.border }]}>
        {active && <View style={[common.radioInner, { backgroundColor: t.orange }]} />}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  paymentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: { fontSize: 14, fontWeight: '700' },
  paymentSub: { fontSize: 11.5, marginTop: 2, lineHeight: 15 },
});

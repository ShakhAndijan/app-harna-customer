import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const SIZE = 44;

// Reels o'ng tomonidagi yumaloq amal tugmasi: belgi va ostida yozuv (son yoki nom).
export default function ReelActionButton({
  icon,
  label,
  active,
  activeColor,
  fill,
  onPress,
  a11yLabel,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      style={s.wrap}
    >
      <View style={[s.circle, !!fill && { backgroundColor: fill, borderColor: fill }]}>
        <MaterialCommunityIcons name={icon} size={23} color={active ? activeColor : '#fff'} />
      </View>
      {label != null && label !== '' && <Text style={s.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 3, width: 56 },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(15,20,28,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
});

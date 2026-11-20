import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { depositState } from './utils';

// Mijozning omonati qayerda turgani (to'lanib bo'lgach): ushlab turilgan, qaytariladi, qaytarildi,
// ustaga o'tdi yoki to'lanmadi. Aytadigan gap bo'lmasa hech narsa ko'rinmaydi.
export default function DepositState({ deposit }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const state = depositState(tr, deposit);
  if (!state) return null;
  const color = state.tone === 'good' ? t.green : state.tone === 'warn' ? t.gold : t.muted;
  return (
    <View
      accessibilityRole="text"
      style={[s.box, { backgroundColor: color + '18', borderColor: color + '55' }]}
    >
      <Text style={[s.text, { color: t.text }]}>{state.text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderRadius: 14, borderWidth: 1, padding: 14 },
  text: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
});

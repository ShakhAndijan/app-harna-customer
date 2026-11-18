import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';
import { documentRoute } from '../../navigation/params';

// Shaxsiy ma'lumotlarga rozilik belgisi: matndagi "Maxfiylik siyosati" va "rozilik" so'zlari tegishli
// hujjatni ochadi (backenddagi /legal/privacy va /legal/consent). Belgi foydalanuvchi tomonidan
// qo'lda qo'yilishi shart — oldindan belgilanmaydi.
// `round` — yumaloq belgi va yengil (qalin emas) tagi chizilgan havolalar (kirish oynasi uslubi).
export default function ConsentCheck({
  checked,
  onToggle,
  error = false,
  colors = {},
  onOpenDoc,
  round = false,
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const c = {
    text: COLORS.muted,
    link: COLORS.white,
    border: COLORS.border,
    active: COLORS.orange,
    error: '#e0473a',
    ...colors,
  };
  // `onOpenDoc` — modal ichida (marshrut ostida qolib ketmasligi uchun) hujjatni o'sha yerda ochish.
  const open = (key) => (onOpenDoc ? onOpenDoc(key) : router.push(documentRoute(key)));

  return (
    <View style={s.row}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={[
          s.box,
          round && s.boxRound,
          { borderColor: error && !checked ? c.error : checked ? c.active : c.border },
          checked && { backgroundColor: c.active },
        ]}
      >
        {checked && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
      </TouchableOpacity>
      <Text style={[s.text, { color: c.text }]} onPress={onToggle}>
        {t('legal.check.prefix')}
        <Text
          style={[s.link, round && s.linkLight, { color: c.link }]}
          onPress={() => open('privacy')}
        >
          {t('legal.check.privacy')}
        </Text>
        {t('legal.check.mid')}
        <Text
          style={[s.link, round && s.linkLight, { color: c.link }]}
          onPress={() => open('consent')}
        >
          {t('legal.check.consent')}
        </Text>
        {t('legal.check.suffix')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxRound: { width: 26, height: 26, borderRadius: 13 },
  text: { flex: 1, fontSize: 13, lineHeight: 19 },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
  linkLight: { fontWeight: '400' },
});

import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Ilova ochiq turganda chiqqan yangi versiya (EAS Update) — saytdagi `ReleaseBanner`.
// Telefon har ishga tushganda expo-updates o'zi tekshiradi (fonda yuklaydi); ilovaga qaytganda ham so'raymiz,
// lekin 15 daqiqada bir martadan ko'p emas. Yuklangan versiya keyingi ishga tushishda o'zi ochiladi, shu vaqtgacha
// uni hoziroq yoqishni taklif qilamiz: majburiy qayta yuklash yo'q, forma to'ldirayotgan mijoz yozganini yo'qotmaydi.
// "×" — "hozir emas": ilovaga keyingi qaytganda yana chiqadi.
// Yangilanish manzili yo'q yig'malar (Expo Go, development, `updates.url` sozlanmasdan yig'ilgan) — hech narsa qilmaydi.
const CHECK_GAP_MS = 15 * 60_000;

let lastCheck = Date.now();
let checking = false;

async function check() {
  if (checking || Date.now() - lastCheck < CHECK_GAP_MS) return;
  checking = true;
  lastCheck = Date.now();
  try {
    const found = await Updates.checkForUpdateAsync();
    if (found.isAvailable) await Updates.fetchUpdateAsync();
  } catch {
    // Tarmoq yo'q yoki xizmat band: ilovaga keyingi qaytganda yana so'raladi.
  } finally {
    checking = false;
  }
}

export default function ReleaseBanner() {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const insets = useSafeAreaInsets();
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!Updates.isEnabled) return undefined;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setDismissed(false);
      check();
    });
    return () => sub.remove();
  }, []);

  if (!Updates.isEnabled || !isUpdatePending || dismissed) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[
        s.box,
        // Tab paneli va ekranlarning pastki tugmalari ustida turadi.
        { bottom: insets.bottom + 70, backgroundColor: t.card, borderColor: t.border },
      ]}
    >
      <View style={s.head}>
        <MaterialCommunityIcons name="update" size={20} color={t.orange} />
        <Text style={[s.title, { color: t.text }]}>{tr('release.title')}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={tr('common.close')}
          hitSlop={10}
          onPress={() => setDismissed(true)}
        >
          <MaterialCommunityIcons name="close" size={20} color={t.muted} />
        </TouchableOpacity>
      </View>
      <Text style={[s.body, { color: t.muted }]}>{tr('release.body')}</Text>
      <TouchableOpacity
        style={[s.btn, { backgroundColor: t.orange }]}
        activeOpacity={0.85}
        accessibilityRole="button"
        onPress={() => Updates.reloadAsync().catch(() => {})}
      >
        <Text style={s.btnText}>{tr('release.reload')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '800', lineHeight: 21 },
  body: { fontSize: 13.5, lineHeight: 19 },
  btn: { height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { createTelegramLink, getTelegramStatus } from '../api/account';
import { getCustomerMe } from '../api/user';
import { useConsentStatus } from '../queries/legal';
import { getErrorMessage } from '../utils/errors';

// Bu ishga tushirish davrida qaysi hisobga javob berilgan (qaysi tugma bo'lmasin): ilova qayta ochilguncha
// shu hisobdan so'ralmaydi, boshqa hisob bilan kirilsa yana so'raladi.
let answeredFor = null;

// Raqam shu yerlarning o'zida so'raladi/o'zgartiriladi: ular ustida taklif chiqmaydi.
const PHONE_SCREENS = new RegExp('^/(change-phone|edit-profile|security|verify-email)');

// Telefoni hech narsa bilan tasdiqlanmagan hisobdan kirgandan so'ng ilova ishga tushganda bir marta so'raladi
// (sayt PhonePromptModal'i). Google/Telegram/email orqali kirgan mijoz hech narsa noto'g'ri deb sezmaydi, lekin
// raqamsiz hisobga qaytishning yagona yo'li — shu raqam. Majburlash emas: «Keyinroq» ilova qayta ochilguncha yopadi.
// Telegram birinchi: bot bir bosishda so'raydi va raqamni Telegram kafolatlaydi; «SMS orqali» telefon almashtirish
// ekranini ochadi. Rozilik oynasi ustida va telefon ekranlarining o'zida chiqmaydi.
export default function PhonePrompt() {
  const { signedIn } = useAuth();
  const consent = useConsentStatus(signedIn);
  const pathname = usePathname();
  const [, rerender] = useState(0);

  const me = useQuery({
    queryKey: ['customer', 'me'],
    queryFn: getCustomerMe,
    enabled: signedIn,
    staleTime: 60 * 1000,
  });

  const account = me.data ? (me.data.id ?? 'me') : null;
  const unproven = !!me.data && !(me.data.phone && me.data.is_phone_verified);
  const consentSettled = consent.isFetched && consent.data?.required !== true;
  const onPhoneScreen = PHONE_SCREENS.test(pathname);
  const open = signedIn && unproven && answeredFor !== account && consentSettled && !onPhoneScreen;
  if (!open) return null;

  return (
    <PromptSheet
      onClose={() => {
        answeredFor = account;
        rerender((n) => n + 1);
      }}
    />
  );
}

// Modal o'z SafeAreaProvider'ida o'lchanadi, shuning uchun pastki chekka ichki komponentda olinadi.
function PromptSheet({ onClose }) {
  return (
    <Modal transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <SheetBody onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

function SheetBody({ onClose }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  // Telegram bu muhitda o'chiq bo'lsa, tugma ko'rsatilmaydi.
  const telegram = useQuery({
    queryKey: ['telegram', 'status'],
    queryFn: getTelegramStatus,
    staleTime: 30 * 1000,
  });

  const viaTelegram = async () => {
    setBusy(true);
    setProblem('');
    try {
      const { url } = await createTelegramLink();
      onClose();
      await Linking.openURL(url);
    } catch (e) {
      setProblem(getErrorMessage(e, tr, 'account.telegram.failed'));
    } finally {
      setBusy(false);
    }
  };

  const viaSms = () => {
    onClose();
    router.push('/change-phone');
  };

  return (
    <View
      style={[
        s.sheet,
        { backgroundColor: t.card, borderColor: t.border, paddingBottom: 18 + insets.bottom },
      ]}
    >
      <View style={[s.handle, { backgroundColor: t.border }]} />
      <Text style={[s.title, { color: t.text }]}>{tr('phoneGate.promptTitle')}</Text>
      <Text style={[s.text, { color: t.muted }]}>{tr('phoneGate.promptCustomer')}</Text>
      {!!problem && <Text style={[s.error, { color: t.red }]}>{problem}</Text>}

      {telegram.data?.enabled === true && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: t.orange, opacity: busy ? 0.7 : 1 }]}
          activeOpacity={0.85}
          disabled={busy}
          onPress={viaTelegram}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>{tr('phoneGate.viaTelegram')}</Text>
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          s.btn,
          telegram.data?.enabled === true
            ? { borderWidth: 1.5, borderColor: t.border }
            : { backgroundColor: t.orange },
        ]}
        activeOpacity={0.85}
        onPress={viaSms}
      >
        <Text style={[s.btnText, telegram.data?.enabled === true && { color: t.text }]}>
          {tr('phoneGate.viaSms')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.later} activeOpacity={0.7} onPress={onClose}>
        <Text style={[s.laterText, { color: t.muted }]}>{tr('phoneGate.later')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '800' },
  text: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 13, fontWeight: '600' },
  btn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  later: { height: 44, alignItems: 'center', justifyContent: 'center' },
  laterText: { fontSize: 14, fontWeight: '700' },
});

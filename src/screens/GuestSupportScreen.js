import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSendSupportItem } from '../queries/support';
import { useSiteConfig } from '../queries/siteConfig';
import { SUPPORT_MAX_LENGTH, SUPPORT_MIN_LENGTH } from '../api/support';
import { parseContact } from './support/utils';
import { getErrorMessage } from '../utils/errors';
import Turnstile from '../components/Turnstile';
import useBottomInset from '../hooks/useBottomInset';

// Backend `support/antiabuse.py` kodlari -> `guestSupport.*` matni.
const CODE_TEXT = {
  captcha_required: 'guestSupport.captchaRequired',
  captcha_failed: 'guestSupport.captchaFailed',
  support_anon_quota_exceeded: 'guestSupport.quota',
};

// Kirmasdan yordam so'rash (saytdagi /support): ism, aloqa vositasi (telefon / email / @telegram), matn va
// CAPTCHA yoqilgan bo'lsa Turnstile. Murojaatlar ro'yxati yo'q — mehmon xabari hech bir hisobga tegishli emas,
// javob ko'rsatilgan aloqa orqali keladi; kirsa, javob ilovada ko'rinadi.
export default function GuestSupportScreen({ kind: initialKind = 'question', onBack }) {
  const bottomInset = useBottomInset();
  const router = useRouter();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const siteKey = useSiteConfig().data?.turnstileSiteKey ?? '';
  const [kind, setKind] = useState(initialKind === 'suggestion' ? 'suggestion' : 'question');
  const send = useSendSupportItem(kind);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [body, setBody] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaRound, setCaptchaRound] = useState(0);
  const [problem, setProblem] = useState(null);
  const [sent, setSent] = useState(false);
  const isSuggestion = kind === 'suggestion';

  const text = body.trim();
  const tooShort = text.length < SUPPORT_MIN_LENGTH;

  const switchKind = (next) => {
    setKind(next);
    setSent(false);
    setProblem(null);
  };

  const submit = () => {
    if (send.isPending) return;
    const sender = name.trim();
    const parsed = parseContact(contact);
    if (sender.length < 2) return setProblem(tr('guestSupport.nameRequired'));
    if (!contact.trim()) return setProblem(tr('guestSupport.contactRequired'));
    if (!parsed) return setProblem(tr('support.contactInvalid'));
    if (tooShort) return setProblem(tr('support.tooShort', { n: SUPPORT_MIN_LENGTH }));
    if (siteKey && !captcha) return setProblem(tr('guestSupport.captchaWait'));
    setProblem(null);
    send.mutate(
      { body: text, name: sender, contact: parsed.value, captcha },
      {
        onSuccess: () => {
          setBody('');
          setSent(true);
        },
        onError: (e) => {
          const key = CODE_TEXT[e?.code];
          setProblem(key ? tr(key) : getErrorMessage(e, tr));
        },
        // Token bitta xabar uchun: xato bo'lsa ham yangisi olinadi.
        onSettled: () => {
          setCaptcha('');
          setCaptchaRound((n) => n + 1);
        },
      }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: t.text }]} numberOfLines={1}>
          {tr(isSuggestion ? 'support.suggestionTitle' : 'support.contactTitle')}
        </Text>
      </View>

      <View style={[s.tabs, { backgroundColor: t.card, borderColor: t.border }]}>
        {['question', 'suggestion'].map((k) => (
          <TouchableOpacity
            key={k}
            style={[s.tab, kind === k && { backgroundColor: t.orange }]}
            activeOpacity={0.8}
            onPress={() => switchKind(k)}
          >
            <Text style={[s.tabText, { color: kind === k ? '#fff' : t.muted }]}>
              {tr(k === 'question' ? 'support.tabQuestions' : 'support.tabSuggestions')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 40 + bottomInset,
            gap: 14,
          }}
        >
          <Text style={[s.hint, { color: t.muted }]}>
            {tr(isSuggestion ? 'support.suggestionHint' : 'support.contactHint')}
          </Text>

          {sent && (
            <View
              style={[s.banner, { backgroundColor: t.green + '1a', borderColor: t.green + '55' }]}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={t.green} />
              <Text style={[s.bannerText, { color: t.green }]}>{tr('guestSupport.sent')}</Text>
            </View>
          )}

          <View style={[s.compose, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[s.label, { color: t.text }]}>{tr('support.name')}</Text>
            <TextInput
              style={[
                s.field,
                { backgroundColor: t.inputBg, borderColor: t.border, color: t.text },
              ]}
              value={name}
              onChangeText={setName}
              placeholder={tr('support.namePlaceholder')}
              placeholderTextColor={t.faint}
              autoComplete="name"
              maxLength={100}
            />

            <Text style={[s.label, { color: t.text }]}>{tr('support.contact')}</Text>
            <TextInput
              style={[
                s.field,
                { backgroundColor: t.inputBg, borderColor: t.border, color: t.text },
              ]}
              value={contact}
              onChangeText={setContact}
              placeholder={tr('support.contactHelp')}
              placeholderTextColor={t.faint}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={120}
            />

            <View style={s.labelRow}>
              <Text style={[s.label, { color: t.text }]}>
                {tr(isSuggestion ? 'support.suggestionBody' : 'support.questionBody')}
              </Text>
              <Text style={[s.count, { color: t.faint }]}>
                {body.length} / {SUPPORT_MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              style={[
                s.field,
                s.input,
                { backgroundColor: t.inputBg, borderColor: t.border, color: t.text },
              ]}
              value={body}
              onChangeText={(x) => {
                setBody(x);
                if (sent) setSent(false);
              }}
              placeholder={tr(
                isSuggestion ? 'support.suggestionPlaceholder' : 'support.questionPlaceholder'
              )}
              placeholderTextColor={t.faint}
              multiline
              maxLength={SUPPORT_MAX_LENGTH}
              textAlignVertical="top"
            />

            <Turnstile key={captchaRound} siteKey={siteKey} onToken={setCaptcha} />

            {!!problem && <Text style={[s.error, { color: t.red }]}>{problem}</Text>}

            <TouchableOpacity
              style={[s.send, { backgroundColor: t.orange, opacity: send.isPending ? 0.6 : 1 }]}
              activeOpacity={0.85}
              disabled={send.isPending}
              onPress={submit}
            >
              {send.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={17} color="#fff" />
                  <Text style={s.sendText}>{tr('support.send')}</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={[s.note, { color: t.faint }]}>{tr('guestSupport.note')}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/login')}>
              <Text style={[s.loginLink, { color: t.orange }]}>{tr('guestSupport.login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '800', fontSize: 20, flex: 1 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
  },
  tab: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13.5, fontWeight: '700' },
  hint: { fontSize: 13.5, lineHeight: 20 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
  },
  bannerText: { flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  compose: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '800' },
  count: { fontSize: 12, fontWeight: '600' },
  field: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  input: {
    minHeight: 130,
    maxHeight: 260,
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 21,
  },
  error: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  note: { fontSize: 12.5, lineHeight: 18 },
  send: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  loginLink: { fontSize: 14, fontWeight: '800', textAlign: 'center', paddingVertical: 4 },
});

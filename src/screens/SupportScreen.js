import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import AppLoader from '../components/AppLoader';
import SectionError from './zakazchi-main/components/SectionError';
import SupportItemCard from './support/SupportItemCard';
import { useSendSupportItem, useSupportItems } from '../queries/support';
import { SUPPORT_MAX_LENGTH, SUPPORT_MIN_LENGTH } from '../api/support';
import { getErrorMessage } from '../utils/errors';
import useBottomInset from '../hooks/useBottomInset';

// "Murojaatlarim" va "Takliflarim" (saytdagi /support va kabinet): yangi murojaat/taklif yozish va
// yuborilganlar ro'yxati; jamoa javobi shu yerda va bildirishnomalarda ko'rinadi.
export default function SupportScreen({ kind: initialKind = 'question', onBack }) {
  const bottomInset = useBottomInset();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { user } = useUser();

  const [kind, setKind] = useState(initialKind === 'suggestion' ? 'suggestion' : 'question');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);
  const isSuggestion = kind === 'suggestion';

  const items = useSupportItems(kind);
  const send = useSendSupportItem(kind);

  const text = body.trim();
  const tooShort = text.length < SUPPORT_MIN_LENGTH;
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();

  // Tortib yangilash: murojaatlar ro'yxati qayta o'qiladi.
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => {
    setRefreshing(true);
    items.refetch().finally(() => setRefreshing(false));
  };

  const switchKind = (next) => {
    setKind(next);
    setSent(false);
    setBody('');
  };

  const submit = () => {
    if (tooShort || send.isPending) return;
    send.mutate(
      { body: text, name: name.length >= 2 ? name : undefined },
      {
        onSuccess: () => {
          setBody('');
          setSent(true);
        },
        onError: (e) => appAlert(tr('common.errorTitle'), getErrorMessage(e, tr)),
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={t.orange}
              colors={[t.orange]}
            />
          }
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
              <Text style={[s.bannerText, { color: t.green }]}>{tr('support.sentAuthed')}</Text>
            </View>
          )}

          <View style={[s.compose, { backgroundColor: t.card, borderColor: t.border }]}>
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
            <Text style={[s.note, { color: t.faint }]}>
              {tooShort && text.length > 0
                ? tr('support.tooShort', { n: SUPPORT_MIN_LENGTH })
                : tr('support.replyNote')}
            </Text>
            <TouchableOpacity
              style={[
                s.send,
                { backgroundColor: t.orange, opacity: tooShort || send.isPending ? 0.5 : 1 },
              ]}
              activeOpacity={0.85}
              disabled={tooShort || send.isPending}
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
          </View>

          <Text style={[s.section, { color: t.text }]}>
            {tr(isSuggestion ? 'support.mineSuggestions' : 'support.mineQuestions')}
          </Text>
          {items.isPending ? (
            <View style={s.center}>
              <AppLoader size={100} />
            </View>
          ) : items.isError ? (
            <SectionError onRetry={items.refetch} />
          ) : items.data.length === 0 ? (
            <View style={s.center}>
              <MaterialCommunityIcons
                name={isSuggestion ? 'lightbulb-outline' : 'inbox-outline'}
                size={36}
                color={t.faint}
              />
              <Text style={{ color: t.muted, fontSize: 14 }}>
                {tr(isSuggestion ? 'support.noSuggestions' : 'support.mineEmpty')}
              </Text>
            </View>
          ) : (
            items.data.map((it) => <SupportItemCard key={it.id} item={it} />)
          )}
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
  input: {
    minHeight: 130,
    maxHeight: 260,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    lineHeight: 21,
  },
  note: { fontSize: 12.5 },
  send: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  section: { fontSize: 16, fontWeight: '800', marginTop: 6 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 30 },
});

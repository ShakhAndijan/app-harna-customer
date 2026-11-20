import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import useBottomInset from '../hooks/useBottomInset';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import AppLoader from '../components/AppLoader';
import SectionError from './zakazchi-main/components/SectionError';
import { useSendSupportChat, useSupportConversation } from '../queries/support';
import { SUPPORT_MAX_LENGTH, SUPPORT_MIN_LENGTH } from '../api/support';
import { useSupportContact } from '../queries/siteConfig';
import { telHref } from '../utils/siteLinks';
import { messageTime, parseContact } from './support/utils';
import { getErrorMessage } from '../utils/errors';

// "Bizga xabar yuboring" (saytdagi chat vidjeti): jamoa bilan yozishma. Bu jonli chat emas —
// javob ish vaqtida keladi (ekranda shu haqda ogohlantirish bor), yangi javoblar o'zi yangilanadi.
export default function SupportChatScreen({ onBack }) {
  const { theme: t } = useTheme();
  const bottomInset = useBottomInset();
  const { t: tr } = useLanguage();
  const { user } = useUser();
  const scrollRef = useRef(null);
  const companyPhone = useSupportContact().phone;

  const conversation = useSupportConversation();
  const send = useSendSupportChat();
  const [text, setText] = useState('');
  const [contactInput, setContactInput] = useState('');

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const profileContact = user?.phone || user?.email || '';
  const needContact = !profileContact;
  const messages = conversation.data?.messages ?? [];

  useEffect(() => {
    if (messages.length) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const submit = () => {
    const body = text.trim();
    if (body.length < SUPPORT_MIN_LENGTH) {
      appAlert(tr('common.errorTitle'), tr('supportChat.tooShort', { n: SUPPORT_MIN_LENGTH }));
      return;
    }
    const contact = parseContact(needContact ? contactInput : profileContact);
    if (name.length < 2 || !contact) {
      appAlert(
        tr('common.errorTitle'),
        tr(
          contactInput.trim() || !needContact ? 'supportChat.badContact' : 'supportChat.needContact'
        )
      );
      return;
    }
    send.mutate(
      { name, contact: contact.value, body },
      {
        onSuccess: () => setText(''),
        onError: (e) => appAlert(tr('common.errorTitle'), getErrorMessage(e, tr)),
      }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={t.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: t.text }]} numberOfLines={1}>
            {tr('supportChat.title')}
          </Text>
          <Text style={[s.sub, { color: t.faint }]} numberOfLines={2}>
            {tr('supportChat.notInstant')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {conversation.isPending ? (
          <View style={s.center}>
            <AppLoader size={110} />
          </View>
        ) : conversation.isError && messages.length === 0 ? (
          <SectionError style={{ margin: 20 }} onRetry={conversation.refetch} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={s.messages}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!!companyPhone && (
              <View style={[s.bubble, s.them, { backgroundColor: t.rowIconBg }]}>
                <Text style={[s.text, { color: t.text }]}>{tr('supportChat.callUs')}</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(telHref(companyPhone))}
                  style={s.phoneRow}
                >
                  <MaterialCommunityIcons name="phone" size={15} color={t.orange} />
                  <Text style={[s.text, { color: t.orange, fontWeight: '800' }]}>
                    {companyPhone}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {messages.length === 0 && (
              <View style={[s.bubble, s.them, { backgroundColor: t.rowIconBg }]}>
                <Text style={[s.text, { color: t.text }]}>{tr('supportChat.intro')}</Text>
              </View>
            )}
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  s.bubble,
                  m.mine ? s.mine : s.them,
                  { backgroundColor: m.mine ? t.orange + '26' : t.rowIconBg },
                ]}
              >
                {!m.mine && (
                  <Text style={[s.team, { color: t.orange }]}>{tr('support.teamName')}</Text>
                )}
                <Text style={[s.text, { color: t.text }]}>{m.text}</Text>
                <Text style={[s.time, { color: t.faint }]}>{messageTime(m.createdAt)}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View
          style={[
            s.footer,
            { borderTopColor: t.border, backgroundColor: t.bg, paddingBottom: 10 + bottomInset },
          ]}
        >
          {needContact && (
            <TextInput
              style={[
                s.contact,
                { backgroundColor: t.inputBg, color: t.text, borderColor: t.border },
              ]}
              value={contactInput}
              onChangeText={setContactInput}
              placeholder={tr('support.contactHelp')}
              placeholderTextColor={t.faint}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={120}
            />
          )}
          <View style={s.inputRow}>
            <TextInput
              style={[
                s.input,
                { backgroundColor: t.inputBg, color: t.text, borderColor: t.border },
              ]}
              value={text}
              onChangeText={setText}
              placeholder={tr('supportChat.placeholder')}
              placeholderTextColor={t.faint}
              multiline
              maxLength={SUPPORT_MAX_LENGTH}
            />
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: text.trim() ? t.orange : t.card3 }]}
              activeOpacity={0.85}
              onPress={submit}
              disabled={!text.trim() || send.isPending}
              accessibilityLabel={tr('supportChat.send')}
            >
              {send.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '800', fontSize: 16 },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: { maxWidth: '84%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9, gap: 3 },
  mine: { alignSelf: 'flex-end' },
  them: { alignSelf: 'flex-start' },
  team: { fontSize: 12, fontWeight: '800' },
  text: { fontSize: 14.5, lineHeight: 20 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  time: { fontSize: 10, alignSelf: 'flex-end' },
  footer: { paddingHorizontal: 14, paddingVertical: 10, gap: 8, borderTopWidth: 1 },
  contact: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14.5,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

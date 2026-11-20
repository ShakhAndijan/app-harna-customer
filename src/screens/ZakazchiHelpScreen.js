import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useFaq } from '../queries/support';
import { FAQ_ITEMS } from '../i18n/siteTexts';
import { useSupportContact } from '../queries/siteConfig';
import { telHref } from '../utils/siteLinks';
import SiteLinks from '../components/SiteLinks';
import { documentRoute, supportRoute } from '../navigation/params';
import useBottomInset from '../hooks/useBottomInset';

const DOCS = ['about', 'terms', 'privacy', 'consent'];
// Eski hujjatlar nomi `support.*` da, backenddan keladigan yangilari `legal.docs.*` da.
const docLabelKey = (key) => (key === 'consent' ? 'legal.docs.consent' : `support.${key}`);

function FaqItem({ item, isOpen, onToggle }) {
  const { theme: t } = useTheme();

  return (
    <View>
      <TouchableOpacity style={s.faqRow} activeOpacity={0.7} onPress={onToggle}>
        <Text style={[s.faqQ, { color: t.text, flex: 1 }]}>{item.q}</Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={isOpen ? t.orange : t.faint}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={[s.faqBody, { borderTopWidth: 1, borderTopColor: t.border }]}>
          <Text style={[s.faqA, { color: t.muted }]}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

// Savollar saytdagi bilan bir xil: backenddagi (/faq) ro'yxat, u bo'sh yoki yuklanmasa — ilovadagi
// zaxira matnlar (uz/ru/en).
function FaqAccordion({ items }) {
  const { theme: t } = useTheme();
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <View style={[s.faqCard, { backgroundColor: t.card, borderColor: t.border }]}>
      {items.map((item, i) => (
        <View key={item.id ?? i}>
          {i > 0 && <View style={{ height: 1, backgroundColor: t.border }} />}
          <FaqItem
            item={item}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
          />
        </View>
      ))}
    </View>
  );
}

export default function ZakazchiHelpScreen({ onBack }) {
  const bottomInset = useBottomInset();
  const router = useRouter();
  const { theme: t } = useTheme();
  const { language, t: tr } = useLanguage();
  const { signedIn } = useAuth();
  // Telefon, email va Telegram saytning config.json'idan (u yo'q bo'lsa — qattiq kodlangan zaxira).
  const contact = useSupportContact();
  const faq = useFaq();
  const faqItems = faq.data ?? FAQ_ITEMS[language] ?? FAQ_ITEMS.uz;

  const contacts = [
    // Yozishma hisobga bog'langan — mehmonga faqat telefon/email va "Savol/Taklif" shakllari ko'rsatiladi.
    ...(signedIn
      ? [
          {
            key: 'chat',
            icon: 'message-text',
            bg: '#e87a45',
            sub: tr('help.chatSub'),
            onPress: () => router.push('/support-chat'),
          },
        ]
      : []),
    ...(contact.phone
      ? [
          {
            key: 'call',
            icon: 'phone',
            bg: '#2fa37a',
            sub: contact.phone,
            onPress: () => Linking.openURL(telHref(contact.phone)),
          },
        ]
      : []),
    ...(contact.telegram
      ? [
          {
            key: 'telegram',
            icon: 'send',
            bg: '#2aabee',
            sub: contact.telegramLabel,
            onPress: () => Linking.openURL(contact.telegram),
          },
        ]
      : []),
    ...(contact.email
      ? [
          {
            key: 'email',
            icon: 'email-outline',
            bg: '#3f7fd4',
            sub: contact.email,
            onPress: () => Linking.openURL(`mailto:${contact.email}`),
          },
        ]
      : []),
    {
      key: 'question',
      icon: 'help-circle-outline',
      bg: '#8a6fd8',
      sub: tr('support.contactHint'),
      onPress: () => router.push(supportRoute('question')),
    },
    {
      key: 'suggestion',
      icon: 'lightbulb-outline',
      bg: '#d9a21b',
      sub: tr('support.suggestionHint'),
      onPress: () => router.push(supportRoute('suggestion')),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + bottomInset }}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color={t.text} />
          </TouchableOpacity>
          <Text style={{ fontWeight: '700', fontSize: 20, color: t.text }}>
            {tr('profile.settings.helpCenter')}
          </Text>
        </View>

        {/* ── Hero card ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={s.hero}>
            <View style={s.heroBg}>
              <MaterialCommunityIcons
                name="message-text"
                size={110}
                color="rgba(255,255,255,0.16)"
              />
            </View>
            <Text style={{ fontWeight: '700', fontSize: 19, color: '#fff' }}>
              {tr('help.heroTitle')}
            </Text>
            <Text
              style={{
                fontSize: 12.5,
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                maxWidth: 220,
              }}
            >
              {tr('help.heroSubtitle')}
            </Text>
          </View>
        </View>

        {/* ── Bog'lanish kanallari ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 18, gap: 11 }}>
          {contacts.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[s.contactRow, { backgroundColor: t.card, borderColor: t.border }]}
              activeOpacity={0.8}
              onPress={item.onPress}
            >
              <View style={[s.contactIcon, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 13 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>
                  {item.key === 'telegram' ? 'Telegram' : tr(`help.contacts.${item.key}`)}
                </Text>
                <Text style={{ fontSize: 11.5, color: t.muted, marginTop: 2 }} numberOfLines={2}>
                  {item.sub}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={t.faint}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tez-tez so'raladi ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginBottom: 12 }}>
            {tr('help.faqTitle')}
          </Text>
          <FaqAccordion items={faqItems} />

          <View style={[s.notFound, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>
              {tr('support.faqNotFoundTitle')}
            </Text>
            <Text style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>
              {tr('support.faqNotFoundHint')}
            </Text>
            <TouchableOpacity
              style={[s.notFoundBtn, { backgroundColor: t.orange }]}
              activeOpacity={0.85}
              onPress={() => router.push(supportRoute('question'))}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                {tr('help.contacts.question')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Foydali maqolalar (saytda ham yordam bo'limida) ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <TouchableOpacity
            style={[s.faqCard, s.faqRow, { backgroundColor: t.card, borderColor: t.border }]}
            activeOpacity={0.7}
            onPress={() => router.push('/articles')}
          >
            <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color={t.orange} />
            <View style={{ flex: 1 }}>
              <Text style={[s.faqQ, { color: t.text }]}>{tr('articles.menu')}</Text>
              <Text style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>
                {tr('articles.menuHint')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={t.faint} />
          </TouchableOpacity>
        </View>

        {/* ── Hujjatlar ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginBottom: 12 }}>
            {tr('support.legal')}
          </Text>
          <View style={[s.faqCard, { backgroundColor: t.card, borderColor: t.border }]}>
            {DOCS.map((key, i) => (
              <View key={key}>
                {i > 0 && <View style={{ height: 1, backgroundColor: t.border }} />}
                <TouchableOpacity
                  style={s.faqRow}
                  activeOpacity={0.7}
                  onPress={() => router.push(documentRoute(key))}
                >
                  <Text style={[s.faqQ, { color: t.text, flex: 1 }]}>{tr(docLabelKey(key))}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={t.faint} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ── Tarmoqlar, mutaxassislar ilovasi, manzil, reklama (config.json) ── */}
        <SiteLinks style={{ marginTop: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    backgroundColor: '#e87a45',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    right: -20,
    bottom: -24,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  faqCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  faqQ: { fontWeight: '600', fontSize: 13.8 },
  faqBody: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  faqA: { fontSize: 13, lineHeight: 20 },
  notFound: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 14 },
  notFoundBtn: {
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});

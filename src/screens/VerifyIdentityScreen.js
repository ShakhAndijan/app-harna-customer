import { useEffect, useState } from 'react';
import {
  AppState,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AppLoader from '../components/AppLoader';
import SectionError from './zakazchi-main/components/SectionError';
import { getIdentityStatus, startIdentityProvider } from '../api/account';
import { ApiError } from '../utils/request';
import { getErrorMessage } from '../utils/errors';
import useBottomInset from '../hooks/useBottomInset';

const STATUS_ICON = {
  approved: 'shield-check',
  rejected: 'shield-alert-outline',
  pending: 'shield-sync-outline',
  not_submitted: 'shield-account-outline',
};

const STEPS = [
  ['open-in-new', 'one'],
  ['face-recognition', 'two'],
  ['check-decagram', 'three'],
];

// Kod (`rejected_reason` yoki MyID qaytishidagi `reason`) → foydalanuvchi tilidagi matn.
const reasonText = (tr, code) => {
  const c = String(code ?? '');
  if (c === 'pinfl_already_used') return tr('account.verify.reasons.pinfl_already_used');
  if (c === 'verification_state_expired' || c === 'state_expired') {
    return tr('account.verify.reasons.verification_state_expired');
  }
  return tr('account.verify.reasons.default');
};

// MyID tugagach server shu manzilga qaytaradi (`?status=verified` yoki `?status=...&reason=...`).
const MYID_RETURN_URL = 'harna://cabinet/verify';

// Shaxsni tasdiqlash: qo'lda hujjat/selfie yuborish yopilgan (410 `manual_verification_closed`),
// tasdiqlash faqat MyID orqali.
export default function VerifyIdentityScreen({ onBack }) {
  const bottomInset = useBottomInset();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: ['identity', 'status'], queryFn: getIdentityStatus });
  const [starting, setStarting] = useState(false);

  // MyID brauzerdan ilovaga qaytilganda holat qayta o'qiladi.
  const refetch = status.refetch;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  const startError = (e) => {
    if (e instanceof ApiError) {
      if (e.status === 410 || e.code === 'manual_verification_closed') {
        return tr('account.verify.closed');
      }
      if (e.code === 'verification_already_in_progress') return tr('account.verify.inProgress');
      if (e.code === 'identity_already_verified') return tr('account.verify.alreadyVerified');
      if (e.code === 'verification_provider_unavailable') {
        return tr('account.verify.providerUnavailable');
      }
    }
    return getErrorMessage(e, tr, 'account.verify.startFailed');
  };

  const startMyId = async () => {
    setStarting(true);
    try {
      const { redirect_url } = await startIdentityProvider('myid');
      const result = await WebBrowser.openAuthSessionAsync(redirect_url, MYID_RETURN_URL);
      if (result.type === 'success') {
        const query = Linking.parse(result.url).queryParams ?? {};
        if (query.status && query.status !== 'verified') {
          appAlert(tr('common.errorTitle'), reasonText(tr, query.reason));
        } else if (query.status === 'verified') {
          appAlert(tr('account.verify.verifiedNow'));
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['identity', 'status'] });
    } catch (e) {
      appAlert(tr('common.errorTitle'), startError(e));
      // identity_already_verified / verification_already_in_progress: holat o'zgargan bo'lishi mumkin.
      queryClient.invalidateQueries({ queryKey: ['identity', 'status'] });
    } finally {
      setStarting(false);
    }
  };

  const st = status.data?.submission_status ?? 'not_submitted';
  const hasMyId = (status.data?.available_providers ?? []).includes('myid');
  const approved = st === 'approved';
  const noProvider = !approved && !hasMyId;
  const showCta = !approved && hasMyId;
  const accent = approved
    ? t.green
    : st === 'pending'
      ? t.gold
      : st === 'rejected'
        ? t.red
        : t.orange;
  const heroTitle = approved
    ? tr('account.verify.verifiedNow')
    : noProvider
      ? tr('account.verify.soon.title')
      : tr('account.verify.autoTitle');
  const heroBody = approved
    ? tr('account.verify.approvedBody')
    : noProvider
      ? tr('account.verify.soon.body')
      : st === 'pending'
        ? tr('account.verify.pendingHint')
        : st === 'rejected' && status.data?.rejected_reason
          ? reasonText(tr, status.data.rejected_reason)
          : tr('account.verify.autoBody');

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
          {tr('account.verify.title')}
        </Text>
      </View>

      {status.isPending ? (
        <View style={s.center}>
          <AppLoader size={160} />
        </View>
      ) : status.isError ? (
        <SectionError style={{ marginHorizontal: 20, marginTop: 24 }} onRetry={status.refetch} />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 18 }}
          >
            <LinearGradient
              colors={[accent, accent + 'B3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.hero}
            >
              <View style={s.heroBlobA} />
              <View style={s.heroBlobB} />
              <View style={s.heroIcon}>
                <MaterialCommunityIcons name={STATUS_ICON[st]} size={34} color="#fff" />
              </View>
              <View style={s.pill}>
                <Text style={s.pillText}>{tr(`account.verify.status.${st}`)}</Text>
              </View>
              <Text style={s.heroTitle}>{heroTitle}</Text>
              <Text style={s.heroBody}>{heroBody}</Text>
            </LinearGradient>

            {showCta && (
              <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
                <Text style={[s.cardTitle, { color: t.text }]}>
                  {tr('account.verify.steps.title')}
                </Text>
                {STEPS.map(([icon, key], i) => (
                  <View key={key} style={s.step}>
                    <View style={s.stepRail}>
                      <View style={[s.stepIcon, { backgroundColor: accent + '22' }]}>
                        <MaterialCommunityIcons name={icon} size={20} color={accent} />
                      </View>
                      {i < STEPS.length - 1 && (
                        <View style={[s.stepLine, { backgroundColor: t.line2 }]} />
                      )}
                    </View>
                    <View style={s.stepText}>
                      <Text style={[s.stepTitle, { color: t.text }]}>
                        {tr(`account.verify.steps.${key}`)}
                      </Text>
                      <Text style={[s.stepHint, { color: t.muted }]}>
                        {tr(`account.verify.steps.${key}Hint`)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={s.note}>
              <MaterialCommunityIcons name="lock-outline" size={15} color={t.faint} />
              <Text style={[s.noteText, { color: t.faint }]}>
                {tr('account.verify.privacyNote')}
              </Text>
            </View>
          </ScrollView>

          {showCta && (
            <View
              style={[
                s.footer,
                { backgroundColor: t.bg, borderColor: t.border, paddingBottom: 14 + bottomInset },
              ]}
            >
              <TouchableOpacity
                style={[s.primary, { backgroundColor: t.orange, opacity: starting ? 0.6 : 1 }]}
                activeOpacity={0.85}
                disabled={starting}
                onPress={startMyId}
              >
                {starting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="flash" size={19} color="#fff" />
                )}
                <Text style={s.primaryText}>
                  {st === 'pending' ? tr('account.verify.reopen') : tr('account.verify.autoStart')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontWeight: '700', fontSize: 20 },
  hero: { borderRadius: 26, padding: 22, overflow: 'hidden', gap: 10 },
  heroBlobA: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -60,
    top: -70,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroBlobB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: 40,
    bottom: -60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 29, marginTop: 2 },
  heroBody: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 21 },
  card: { borderRadius: 22, borderWidth: 1, padding: 18 },
  cardTitle: { fontWeight: '800', fontSize: 16, marginBottom: 14 },
  step: { flexDirection: 'row', gap: 14 },
  stepRail: { alignItems: 'center' },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: { width: 2, flex: 1, minHeight: 14, borderRadius: 1, marginVertical: 4 },
  stepText: { flex: 1, paddingTop: 2, paddingBottom: 16 },
  stepTitle: { fontSize: 14.5, fontWeight: '700' },
  stepHint: { fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 4 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  primary: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
});

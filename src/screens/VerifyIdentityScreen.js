import { useEffect, useState } from 'react';
import {
  AppState,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AppLoader from '../components/AppLoader';
import SectionError from './zakazchi-main/components/SectionError';
import SelectField from './edit-profile/components/SelectField';
import BirthDateSheet from './edit-profile/components/BirthDateSheet';
import { formatDisplayDate } from './edit-profile/utils';
import { getIdentityStatus } from '../api/account';
import { getCustomerMe } from '../api/user';
import { SITE_URL } from '../constants/config';
import { ApiError } from '../utils/request';
import { getErrorMessage } from '../utils/errors';
import { formatDate } from '../utils/format';
import {
  PASSPORT_PATTERN,
  PINFL_PATTERN,
  failureKey,
  finishMyId,
  isVerifiedNow,
  leaveMyId,
  myIdReturnFromParams,
  myIdReturnFromUrl,
  normalisePassport,
  normalisePinfl,
  reasonKey,
  receiveMyIdReturn,
  restartMyId,
  startMyId,
  useMyIdView,
} from '../utils/myid';

const STATUS_ICON = {
  approved: 'shield-check',
  rejected: 'shield-alert-outline',
  pending: 'shield-sync-outline',
  not_submitted: 'shield-account-outline',
};

// Bekor qilingan tasdiq sababi → matn.
const REVOKED_KEYS = {
  myid_required: 'myid.revokedMyidRequired',
  operator_revoked: 'myid.revokedOperator',
  test_identity: 'myid.revokedTest',
};

// "2026-10-28" → "28.10.2026" (mahalliy peshin: vaqt mintaqasi sanani siljitmaydi).
const formatDay = (iso) => formatDate(`${iso}T12:00:00`);

// MyID tasdig'i uchun «… gacha amal qiladi» / «muddatsiz»; operator tasdig'ining muddati yo'q.
function validityText(tr, status) {
  if (!status || status.method !== 'myid') return null;
  if (status.valid_until) return tr('myid.validUntil', { date: formatDay(status.valid_until) });
  return (status.validity_years ?? 1) === 0 ? tr('myid.validForever') : null;
}

// Shaxsni tasdiqlash: faqat MyID WebSDK orqali. Foydalanuvchi tug'ilgan sana va JSHSHIR/pasport
// kiritadi, MyID sahifasi yuzni kamera bilan tekshiradi, ilovaga qaytgach «Tasdiqlashni yakunlash»
// MyID javobini hisobga yozadi (ism-familiya va tug'ilgan sana MyID'dagidek bo'lib qulflanadi).
// Tekshiruv mantig'i — src/utils/myid.js; bu ekran uning bosqichini ko'rsatadi.
export default function VerifyIdentityScreen({ onBack }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const status = useQuery({ queryKey: ['identity', 'status'], queryFn: getIdentityStatus });
  const me = useQuery({ queryKey: ['customer', 'me'], queryFn: getCustomerMe, staleTime: 30000 });
  const view = useMyIdView();
  const [form, setForm] = useState({ birth: null, doc: 'pinfl', number: '', agreed: false });
  const [problems, setProblems] = useState({});
  const [sheet, setSheet] = useState(false);
  // Tasdiqlangan foydalanuvchi MyID'ni qayta o'qishi mumkin («MyID ma'lumotlarini yangilash»).
  const [renewing, setRenewing] = useState(false);

  // MyID brauzerdan ilovaga qaytilganda holat qayta o'qiladi.
  const refetch = status.refetch;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  // Shu ekranni ochgan MyID javobi (Android havolani routerga beradi yoki ilova havoladan yangidan
  // ishga tushadi) va ekran ochiq paytda kelgani.
  const back = myIdReturnFromParams(useLocalSearchParams());
  const backSession = back?.session_id ?? null;
  const backStatus = back?.status ?? null;
  const backCode = back?.auth_code ?? null;
  useEffect(() => {
    if (backSession) {
      receiveMyIdReturn({ session_id: backSession, status: backStatus, auth_code: backCode });
    }
  }, [backSession, backStatus, backCode]);
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) =>
      receiveMyIdReturn(myIdReturnFromUrl(url))
    );
    return () => sub.remove();
  }, []);
  useEffect(() => () => leaveMyId(), []);

  const birth = form.birth ?? String(me.data?.birth_date ?? '').slice(0, 10);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setProblems({});
  };

  const startError = (e) => {
    if (e instanceof ApiError) {
      if (e.code === 'verification_already_in_progress') return tr('myid.inProgress');
      if (e.code === 'identity_already_verified') return tr('myid.alreadyVerified');
      if (e.code === 'verification_provider_unavailable') return tr('myid.providerUnavailable');
    }
    return getErrorMessage(e, tr, 'myid.startFailed');
  };

  const start = async (mode) => {
    const pinfl = form.doc === 'pinfl';
    const number = pinfl ? normalisePinfl(form.number) : normalisePassport(form.number);
    const found = {};
    if (!birth) found.birth = tr('myid.birthDateRequired');
    if (!(pinfl ? PINFL_PATTERN : PASSPORT_PATTERN).test(number)) {
      found.number = tr(pinfl ? 'myid.pinflInvalid' : 'myid.passportInvalid');
    }
    if (!form.agreed) found.consent = tr('myid.consentRequired');
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    try {
      await startMyId(
        { birth_date: birth, ...(pinfl ? { pinfl: number } : { pass_data: number }) },
        mode
      );
    } catch (e) {
      setProblems({ start: startError(e) });
    }
  };

  const pressProblem = (error) => {
    if (error == null) return null;
    if (
      error instanceof ApiError &&
      (error.code === 'verification_provider_error' || error.code === 'verification_in_progress')
    ) {
      return tr('myid.providerError');
    }
    return getErrorMessage(error, tr, 'myid.providerFailed');
  };

  const data = status.data;
  const verified = isVerifiedNow(data);
  // Muddati o'tgan yoki bekor qilingan tasdiq «tasdiqlanmagan» deb o'qiladi.
  const state = verified
    ? 'approved'
    : data?.submission_status === 'approved'
      ? 'not_submitted'
      : (data?.submission_status ?? 'not_submitted');
  const lapsed = state === 'not_submitted' && data?.expired === true;
  const revoked =
    state === 'not_submitted' && !lapsed && data?.revoked_reason ? data.revoked_reason : null;
  const offered = data?.myid_available === true;
  const canStart = data?.can_start ?? offered;
  const mode = data?.app_open_mode ?? 'auth_session';
  const years = data?.validity_years ?? 1;
  const busy = view.kind !== 'idle' && view.kind !== 'unfinished';
  const wantsForm = !verified || renewing;
  const renewsMyId = verified && data?.method === 'myid';

  const accent =
    lapsed || revoked
      ? t.red
      : { approved: t.green, pending: t.gold, rejected: t.red, not_submitted: t.orange }[state];
  const icon = STATUS_ICON[state];

  const heroTitle = verified
    ? data?.method === 'myid'
      ? tr('myid.approvedTitle')
      : data?.method === 'operator'
        ? tr('myid.approvedOperator')
        : tr('myid.approved')
    : lapsed
      ? tr('myid.expiredTitle')
      : !offered
        ? tr('myid.soonTitle')
        : tr('myid.autoTitle');
  const heroBody = verified
    ? validityText(tr, data)
    : lapsed
      ? tr('myid.expiredBody')
      : revoked
        ? tr(REVOKED_KEYS[revoked] ?? 'myid.revokedOperator')
        : state === 'rejected'
          ? tr(reasonKey(data?.rejected_reason))
          : state === 'pending' && view.kind === 'idle'
            ? tr('myid.pendingHint')
            : !offered
              ? tr('myid.soonBody')
              : tr('myid.autoBody');

  const requirement = (name, title, hint) => (
    <View style={s.req}>
      <View style={[s.reqIcon, { backgroundColor: accent + '22' }]}>
        <MaterialCommunityIcons name={name} size={20} color={accent} />
      </View>
      <View style={s.grow}>
        <Text style={[s.reqTitle, { color: t.text }]}>{title}</Text>
        <Text style={[s.hint, { color: t.muted }]}>{hint}</Text>
      </View>
    </View>
  );

  const card = [s.card, { backgroundColor: t.card, borderColor: t.border }];
  const primary = (title, onPress, opts = {}) => (
    <TouchableOpacity
      style={[
        s.primary,
        { backgroundColor: opts.ghost ? 'transparent' : t.orange },
        opts.ghost && { borderWidth: 1, borderColor: t.border },
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[s.primaryText, opts.ghost && { color: t.text }]}>{title}</Text>
    </TouchableOpacity>
  );
  const errorLine = (text) =>
    text ? <Text style={[s.error, { color: t.red }]}>{text}</Text> : null;

  const identityRows = (identity) =>
    [
      [tr('myid.firstName'), identity.first_name],
      [tr('myid.lastName'), identity.last_name],
      [tr('myid.middleName'), identity.middle_name],
      [tr('myid.birthDateLabel'), identity.birth_date ? formatDay(identity.birth_date) : null],
    ]
      .filter(([, value]) => Boolean(value))
      .map(([label, value]) => (
        <View key={label} style={s.row}>
          <Text style={[s.rowLabel, { color: t.muted }]}>{label}</Text>
          <Text style={[s.rowValue, { color: t.text }]}>{value}</Text>
        </View>
      ));

  // Boshlangan tekshiruv yoki uning tugashi.
  const flowCard = () => {
    switch (view.kind) {
      case 'opening':
      case 'waiting':
        return (
          <View style={[card, s.cardCenter]}>
            <ActivityIndicator color={t.orange} />
            <Text style={[s.hint, { color: t.muted }]}>{tr('myid.startPageOpening')}</Text>
          </View>
        );
      case 'unfinished':
        return (
          <View style={card}>
            <Text style={[s.cardTitle, { color: t.text }]}>{tr('myid.notFinished')}</Text>
            <Text style={[s.hint, { color: t.muted }]}>{tr('myid.pendingHint')}</Text>
          </View>
        );
      case 'final':
        return (
          <View style={card}>
            <Text style={[s.cardTitle, { color: t.text }]}>{tr('myid.finishTitle')}</Text>
            <Text style={[s.hint, { color: t.muted }]}>{tr('myid.finishBody')}</Text>
            {errorLine(pressProblem(view.error))}
            {/* Foydalanuvchining o'z bosishi: MyID shartlari shuni talab qiladi, uni hech narsa o'zi bosmaydi. */}
            {primary(view.error ? tr('myid.retryFinish') : tr('myid.finish'), () =>
              finishMyId(data ?? null)
            )}
            {view.error ? primary(tr('myid.restart'), restartMyId, { ghost: true }) : null}
          </View>
        );
      case 'finishing':
        return (
          <View style={[card, s.cardCenter]}>
            <ActivityIndicator color={t.orange} />
            <Text style={[s.cardTitle, { color: t.text }]}>{tr('myid.finishing')}</Text>
            {view.slow ? (
              <Text style={[s.hint, s.centerText, { color: t.muted }]}>
                {tr('myid.finishingSlow')}
              </Text>
            ) : null}
          </View>
        );
      case 'done': {
        const line = validityText(tr, view.status ?? data);
        return (
          <View style={card}>
            <View style={s.req}>
              <MaterialCommunityIcons name="check-decagram" size={22} color={t.green} />
              <Text style={[s.cardTitle, s.grow, { color: t.green }]}>
                {tr('myid.successTitle')}
              </Text>
            </View>
            {view.identity ? identityRows(view.identity) : null}
            {line ? <Text style={{ color: t.text }}>{line}</Text> : null}
            <Text style={[s.hint, { color: t.muted }]}>{tr('myid.successNames')}</Text>
          </View>
        );
      }
      case 'failed':
        return (
          <View style={card}>
            <Text style={[s.cardTitle, { color: t.red }]}>{tr('myid.failedTitle')}</Text>
            <Text style={{ color: t.text }}>{tr(failureKey(view.status))}</Text>
            {primary(tr('myid.restart'), restartMyId)}
          </View>
        );
      case 'refused':
        return (
          <View style={card}>
            <Text style={[s.cardTitle, { color: t.red }]}>{tr('myid.failedTitle')}</Text>
            <Text style={{ color: t.text }}>
              {view.error != null
                ? getErrorMessage(view.error, tr, 'myid.providerFailed')
                : tr(reasonKey(view.reason))}
            </Text>
            {primary(tr('myid.restart'), restartMyId)}
          </View>
        );
      default:
        return null;
    }
  };

  const pinfl = form.doc === 'pinfl';
  const privacy = [
    tr('myid.privacyNote'),
    tr('myid.privacyValidity', {
      validity:
        years === 0 ? tr('myid.validityForever') : tr('myid.validityYears', { count: years }),
    }),
  ].join(' ');
  const startTitle = renewsMyId
    ? tr('myid.refresh')
    : state === 'pending'
      ? tr('myid.autoRestart')
      : tr('myid.autoStart');

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
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}
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
              <MaterialCommunityIcons name={icon} size={34} color="#fff" />
            </View>
            <View style={s.pill}>
              <Text style={s.pillText}>{tr(`myid.${state}`)}</Text>
            </View>
            <Text style={s.heroTitle}>{heroTitle}</Text>
            {heroBody ? <Text style={s.heroBody}>{heroBody}</Text> : null}
          </LinearGradient>

          {flowCard()}

          {/* Tasdiqlangan va MyID taklif qilinadi: qayta o'qish — foydalanuvchi tanlovi. */}
          {verified && offered && canStart && !renewing && !busy ? (
            <View style={card}>
              {renewsMyId
                ? requirement('refresh', tr('myid.refresh'), tr('myid.refreshHint'))
                : requirement('flash-outline', tr('myid.autoTitle'), tr('myid.autoBody'))}
              {primary(
                renewsMyId ? tr('myid.refresh') : tr('myid.autoStart'),
                () => setRenewing(true),
                { ghost: true }
              )}
            </View>
          ) : null}

          {wantsForm && !busy && offered && canStart && mode === 'website' ? (
            <View style={card}>
              {requirement('web', tr('myid.appWebsiteMode'), tr('myid.autoBody'))}
              {primary(tr('myid.appOpenSite'), () =>
                Linking.openURL(`${SITE_URL}/cabinet/settings/verify`).catch(() => undefined)
              )}
            </View>
          ) : null}

          {wantsForm && !busy && offered && canStart && mode !== 'website' ? (
            <>
              <View style={card}>
                <Text style={[s.cardTitle, { color: t.text }]}>{tr('myid.needTitle')}</Text>
                {requirement(
                  'card-account-details-outline',
                  tr('myid.needId'),
                  tr('myid.needIdHint')
                )}
                {requirement('camera-outline', tr('myid.needCamera'), tr('myid.needCameraHint'))}
              </View>

              <View style={card}>
                <Text style={[s.cardTitle, { color: t.text }]}>{tr('myid.formTitle')}</Text>
                <SelectField
                  label={tr('myid.birthDateLabel')}
                  value={formatDisplayDate(birth)}
                  placeholder={tr('editProfile.birthDatePlaceholder')}
                  onPress={() => setSheet(true)}
                />
                {errorLine(problems.birth)}

                <View style={[s.segment, { backgroundColor: t.inputBg, borderColor: t.border }]}>
                  {[
                    ['pinfl', tr('myid.docPinfl')],
                    ['passport', tr('myid.docPassport')],
                  ].map(([key, label]) => {
                    const active = form.doc === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[s.segmentItem, active && { backgroundColor: t.orange }]}
                        activeOpacity={0.85}
                        onPress={() => set({ doc: key, number: '' })}
                      >
                        <Text style={[s.segmentText, { color: active ? '#fff' : t.muted }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ gap: 8 }}>
                  <Text style={[s.label, { color: t.muted }]}>
                    {pinfl ? tr('myid.pinflLabel') : tr('myid.passportLabel')}
                  </Text>
                  <TextInput
                    key={form.doc}
                    style={[
                      s.input,
                      { backgroundColor: t.inputBg, borderColor: t.border, color: t.text },
                    ]}
                    value={form.number}
                    // Pasport harflari lotin: kirill o'xshashi darhol lotin juftiga almashadi.
                    onChangeText={(text) =>
                      set({
                        number: pinfl ? text.replace(/[^\d\s]/g, '') : normalisePassport(text),
                      })
                    }
                    keyboardType={pinfl ? 'number-pad' : 'default'}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoComplete="off"
                    maxLength={pinfl ? 20 : 12}
                    placeholder={pinfl ? '' : 'AA1234567'}
                    placeholderTextColor={t.faint}
                  />
                  <Text style={[s.hint, { color: t.muted }]}>
                    {pinfl ? tr('myid.pinflHint') : tr('myid.passportHint')}
                  </Text>
                </View>
                {errorLine(problems.number)}

                <View style={s.note}>
                  <MaterialCommunityIcons name="lock-outline" size={15} color={t.faint} />
                  <Text style={[s.noteText, { color: t.faint }]}>{privacy}</Text>
                </View>

                <TouchableOpacity
                  style={s.consent}
                  activeOpacity={0.8}
                  onPress={() => set({ agreed: !form.agreed })}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: form.agreed }}
                >
                  <MaterialCommunityIcons
                    name={form.agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={form.agreed ? t.orange : t.muted}
                  />
                  <Text style={[s.consentText, { color: t.text }]}>{tr('myid.consent')}</Text>
                </TouchableOpacity>
                {errorLine(problems.consent)}
                {errorLine(problems.start)}

                {primary(startTitle, () => start(mode))}
                {renewing
                  ? primary(tr('common.cancel'), () => setRenewing(false), { ghost: true })
                  : null}
              </View>
            </>
          ) : null}
        </ScrollView>
      )}

      <BirthDateSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        value={birth}
        onChange={(iso) => set({ birth: iso })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardCenter: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  grow: { flex: 1 },
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
  card: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 14 },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  req: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  reqIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqTitle: { fontSize: 14.5, fontWeight: '700' },
  hint: { fontSize: 12.5, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  segment: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4 },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontSize: 13.5, fontWeight: '700' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17 },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  consentText: { flex: 1, fontSize: 14, fontWeight: '600' },
  error: { fontSize: 12.5, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14.5, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  primary: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
});

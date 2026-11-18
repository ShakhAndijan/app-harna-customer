import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';
import BackBtn from '../../components/login/BackBtn';
import OtpInput from '../../components/login/OtpInput';
import PrimaryBtn from '../../components/login/PrimaryBtn';
import BrandLogo from '../../components/BrandLogo';

const RESEND_SECONDS = 60;

const formatPhone = (raw = '') => {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  let s = '';
  if (d.length > 0) s += d.slice(0, 2);
  if (d.length > 2) s += ' ' + d.slice(2, 5);
  if (d.length > 5) s += ' ' + d.slice(5, 7);
  if (d.length > 7) s += ' ' + d.slice(7, 9);
  return s;
};

export default function CodeStep({
  phone,
  email,
  onBack,
  onConfirm,
  devCode,
  onResend,
  resendLoading,
  resendError,
  confirmLoading,
  error,
  onAltLogin,
}) {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [deadline, setDeadline] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Ilova fonga ketib qaytganda taymer to'xtab qolgani uchun (setInterval
    // background'da ishlamaydi) — foregroundga qaytganda haqiqiy vaqtga
    // qarab darhol qayta hisoblaymiz.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => sub.remove();
  }, []);

  const timer = Math.max(0, Math.ceil((deadline - now) / 1000));

  const handleBack = () => {
    setCode('');
    onBack();
  };
  const resend = async () => {
    setCode('');
    setDeadline(Date.now() + RESEND_SECONDS * 1000);
    if (onResend) await onResend();
  };

  // Klaviatura ochiq bo'lganda ham pastdagi "boshqa yo'l" kartasi ko'rinishi va bosilishi uchun sahifa suriladi.
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <BackBtn onPress={handleBack} />

          <View style={styles.header}>
            <BrandLogo width={280} dark />
            <Text style={styles.title}>{t('login.codeStep.title')}</Text>
            <Text style={styles.subtitle}>
              {email ? (
                <Text style={styles.phone}>{email}</Text>
              ) : (
                <Text style={styles.phone}>+998 {formatPhone(phone)}</Text>
              )}{' '}
              {email ? t('login.codeStep.subtitleEmail') : t('login.codeStep.subtitle')}
            </Text>
          </View>

          <OtpInput value={code} onChange={setCode} length={6} />

          {!!error && <Text style={styles.errorText}>{error}</Text>}
          {!!resendError && <Text style={styles.errorText}>{resendError}</Text>}

          {!!devCode && (
            <Text style={styles.devCode}>
              {t('login.codeStep.devCode')} <Text style={styles.devCodeVal}>{devCode}</Text>
            </Text>
          )}

          <Text style={styles.timerText}>
            {timer > 0 ? (
              <>
                {t('login.codeStep.resendIn')}{' '}
                <Text style={styles.timerCount}>00:{String(timer).padStart(2, '0')}</Text>
              </>
            ) : resendLoading ? (
              <ActivityIndicator size="small" color={COLORS.orange} />
            ) : (
              <Text style={styles.resend} onPress={resend}>
                {t('login.codeStep.resendNow')}
              </Text>
            )}
          </Text>

          <PrimaryBtn
            label={t('common.confirm')}
            disabled={code.length < 6 || confirmLoading}
            icon={
              confirmLoading ? <ActivityIndicator size="small" color={COLORS.white} /> : undefined
            }
            onPress={() => onConfirm?.(code)}
          />

          {!!onAltLogin && (
            <View style={styles.altLoginCard}>
              <View style={styles.altLoginIcon}>
                <Ionicons name="key-outline" size={18} color={COLORS.orange} />
              </View>
              <View style={styles.altLoginTextWrap}>
                <Text style={styles.altLogin} onPress={onAltLogin}>
                  {t('login.codeStep.altLogin')}
                </Text>
                <Text style={styles.altLoginHint}>{t('login.codeStep.altLoginHint')}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 18,
    gap: 26,
  },
  header: { gap: 12, marginTop: 8, alignItems: 'center' },
  logo: {
    width: 200,
    height: 130,
  },
  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  phone: {
    color: COLORS.white,
    fontWeight: '700',
  },
  timerText: {
    color: COLORS.muted,
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: -8,
  },
  devCode: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: -8,
  },
  errorText: {
    color: '#e0473a',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: -8,
  },
  devCodeVal: {
    color: COLORS.orange,
    fontWeight: '700',
  },
  timerCount: {
    color: COLORS.white,
    fontWeight: '700',
  },
  resend: {
    color: COLORS.orange,
    fontWeight: '700',
  },
  altLoginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: -6,
  },
  altLoginIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232,122,69,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altLoginTextWrap: { flex: 1, gap: 2 },
  altLogin: {
    color: COLORS.orange,
    fontWeight: '700',
    fontSize: 13.5,
  },
  altLoginHint: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});

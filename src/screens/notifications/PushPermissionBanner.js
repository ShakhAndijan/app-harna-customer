import { useCallback, useEffect, useState } from 'react';
import { AppState, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getPushPermission, registerPush, requestPushPermission } from '../../utils/push';

// Tizim ruxsati berilmagan bo'lsa chiqadi: bosilganda ruxsat so'raladi (ikki marta rad etilgan
// bo'lsa telefon sozlamalari ochiladi). Sozlamalardan qaytganda holat qayta tekshiriladi.
export default function PushPermissionBanner() {
  const { theme: t } = useTheme();
  const { t: tr, language } = useLanguage();
  const { signedIn } = useAuth();
  const [perm, setPerm] = useState(null);

  const refresh = useCallback(() => {
    getPushPermission()
      .then(setPerm)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  if (!perm || perm.status === 'granted') return null;
  const blocked = perm.status === 'denied' && !perm.canAskAgain;

  const onPress = async () => {
    const ok = await requestPushPermission(tr);
    if (ok && signedIn) await registerPush({ locale: language });
    refresh();
  };

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.orange + '66' }]}>
      <View style={[s.icon, { backgroundColor: t.orange + '1f' }]}>
        <MaterialCommunityIcons name="bell-off-outline" size={22} color={t.orange} />
      </View>
      <View style={s.body}>
        <Text style={[s.title, { color: t.text }]}>{tr('notif.push.title')}</Text>
        <Text style={[s.sub, { color: t.muted }]}>
          {blocked ? tr('notif.push.blockedSub') : tr('notif.push.sub')}
        </Text>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: t.orange }]}
          activeOpacity={0.85}
          onPress={onPress}
          accessibilityRole="button"
        >
          <Text style={s.btnTxt}>
            {blocked ? tr('notif.push.openSettings') : tr('notif.push.enable')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  btn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  btnTxt: { color: '#fff', fontSize: 13.5, fontWeight: '800' },
});

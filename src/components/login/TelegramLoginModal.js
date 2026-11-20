import { useRef } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { isTelegramReturn, readTelegramResult, telegramLoginUrl } from '../../utils/telegramLogin';

// "Telegram bilan davom etish": Telegramning kirish sahifasi (oauth.telegram.org) oyna ichida ochiladi.
// Foydalanuvchi tasdiqlagach Telegram imzolangan javobni sayt manziliga qaytaradi; sahifa yuklanmaydi,
// javob o'qilib `onResult(data)` ga o'zgartirilmagan holda beriladi (serverga ham shunday yuboriladi).
// Javobsiz qaytilsa (rad etildi) yoki oyna yopilsa `onClose()`.
export default function TelegramLoginModal({ visible, botId, onClose, onResult }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  // Javob bir marta olinadi: ham `onShouldStartLoadWithRequest`, ham `onNavigationStateChange` ushlashi mumkin.
  const handled = useRef(false);

  const inspect = (url) => {
    if (!isTelegramReturn(url)) return true;
    if (!handled.current) {
      handled.current = true;
      const data = readTelegramResult(url);
      if (data) onResult(data);
      else onClose();
    }
    return false;
  };

  return (
    <Modal
      visible={visible && botId != null}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        handled.current = false;
      }}
    >
      <SafeAreaProvider style={{ flex: 1 }}>
        <SafeAreaView style={[s.screen, { backgroundColor: t.bg }]}>
          <View style={[s.head, { borderBottomColor: t.border }]}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={tr('common.back')}
              style={[s.back, { backgroundColor: t.card, borderColor: t.border }]}
            >
              <Feather name="arrow-left" size={20} color={t.text} />
            </TouchableOpacity>
            <Text style={[s.title, { color: t.text }]}>{tr('telegramLogin.title')}</Text>
          </View>
          {botId != null && (
            <WebView
              source={{ uri: telegramLoginUrl(botId) }}
              originWhitelist={['https://*']}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={s.loading}>
                  <ActivityIndicator color={t.orange} />
                </View>
              )}
              onShouldStartLoadWithRequest={(request) => inspect(request.url)}
              onNavigationStateChange={(nav) => {
                inspect(nav.url);
              }}
              style={s.web}
            />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800', flex: 1 },
  web: { flex: 1 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});

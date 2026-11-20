import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { SITE_URL } from '../constants/config';
import { useTheme } from '../context/ThemeContext';

// Cloudflare Turnstile ("Men robot emasman"): mehmon yordam shakli uchun. Vidjet kichik WebView ichida
// ishlaydi; sahifa manbai `SITE_URL` — kalit shu domen uchun berilgan. Yechilgan token `onToken` orqali
// keladi, muddati tugasa yoki tekshiruv xato bo'lsa `''`. Token bitta xabar uchun yaroqli: yuborilgach
// `key`ni o'zgartirib qayta ochiladi.
const page = (siteKey, theme) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:transparent}</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=go&render=explicit" async defer></script>
<script>
function say(token){window.ReactNativeWebView.postMessage(token)}
function go(){turnstile.render('#box',{sitekey:${JSON.stringify(siteKey)},theme:${JSON.stringify(theme)},
callback:say,'expired-callback':function(){say('')},'error-callback':function(){say('')}})}
</script></head><body><div id="box"></div></body></html>`;

export default function Turnstile({ siteKey, onToken }) {
  const { theme: t } = useTheme();
  if (!siteKey) return null;
  return (
    <View style={[s.box, { borderColor: t.border }]}>
      <WebView
        source={{ html: page(siteKey, t.isDark ? 'dark' : 'light'), baseUrl: SITE_URL }}
        originWhitelist={['https://*']}
        onMessage={(e) => onToken(e.nativeEvent.data)}
        scrollEnabled={false}
        style={s.web}
      />
    </View>
  );
}

const s = StyleSheet.create({
  box: { height: 72, borderRadius: 12, overflow: 'hidden' },
  web: { backgroundColor: 'transparent' },
});

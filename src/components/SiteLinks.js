import { Linking, Platform, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSiteConfig } from '../queries/siteConfig';
import { listOf, socialLinks, telHref, webHref } from '../utils/siteLinks';

// Saytning pastki qismi (footer), telefonga kerak bo'lgan qadar — hammasi saytning `config.json`idan:
// «Bizni kuzating» (tarmoqlar), «Mobil ilova» (mutaxassislar ilovasi), manzil va «Reklama va hamkorlik».
// To'ldirilmagan narsa ko'rsatilmaydi; hech narsa bo'lmasa — komponent ham bo'sh.
// Telefon va email "Yordam markazi"dagi aloqa qatorlarida alohida turadi.
function Row({ icon, label, value, onPress }) {
  const { theme: t } = useTheme();
  return (
    <TouchableOpacity
      style={s.row}
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'link' : undefined}
    >
      <MaterialCommunityIcons name={icon} size={20} color={t.orange} />
      <Text style={[s.rowLabel, { color: t.text }]}>{label}</Text>
      {!!value && <Text style={[s.rowValue, { color: t.muted }]}>{value}</Text>}
      {!!onPress && <MaterialCommunityIcons name="open-in-new" size={16} color={t.faint} />}
    </TouchableOpacity>
  );
}

function Card({ children }) {
  const { theme: t } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>{children}</View>
  );
}

function Heading({ children }) {
  const { theme: t } = useTheme();
  return <Text style={[s.heading, { color: t.text }]}>{children}</Text>;
}

export default function SiteLinks({ style }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const config = useSiteConfig().data;
  if (!config) return null;

  const ios = Platform.OS === 'ios';
  const social = socialLinks(config.social);
  const store = webHref(ios ? config.apps.workerAppStore : config.apps.workerGooglePlay);
  const { address } = config.contact;
  const adsPhones = listOf(config.ads.phones);
  const open = (href) => Linking.openURL(href).catch(() => {});

  if (!social.length && !store && !address && !adsPhones.length) return null;

  return (
    <View style={[{ paddingHorizontal: 20, gap: 18 }, style]}>
      {social.length > 0 && (
        <View style={{ gap: 10 }}>
          <Heading>{tr('siteLinks.followUs')}</Heading>
          <View style={s.social}>
            {social.map((x) => (
              <TouchableOpacity
                key={x.key}
                accessibilityRole="link"
                accessibilityLabel={x.label}
                activeOpacity={0.7}
                onPress={() => open(x.href)}
                style={[s.round, { backgroundColor: t.card, borderColor: t.border }]}
              >
                <MaterialCommunityIcons name={x.icon} size={21} color={t.text} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!!store && (
        <View style={{ gap: 10 }}>
          <Heading>{tr('siteLinks.apps')}</Heading>
          <Card>
            <Row
              icon={ios ? 'apple' : 'google-play'}
              label={tr('siteLinks.appWorker')}
              value={ios ? 'App Store' : 'Google Play'}
              onPress={() => open(store)}
            />
          </Card>
        </View>
      )}

      {!!address && (
        <View style={{ gap: 10 }}>
          <Heading>{tr('siteLinks.contact')}</Heading>
          <Card>
            <Row icon="map-marker-outline" label={address} />
          </Card>
        </View>
      )}

      {adsPhones.length > 0 && (
        <View style={{ gap: 10 }}>
          <Heading>{tr('siteLinks.ads')}</Heading>
          <Text style={[s.note, { color: t.muted }]}>
            {config.ads.note || tr('siteLinks.adsNote')}
          </Text>
          <Card>
            {adsPhones.map((phone) => (
              <Row
                key={phone}
                icon="bullhorn-outline"
                label={phone}
                onPress={() => open(telHref(phone))}
              />
            ))}
          </Card>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  heading: { fontWeight: '700', fontSize: 15 },
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  rowLabel: { flex: 1, fontWeight: '600', fontSize: 13.8 },
  rowValue: { fontSize: 12.5 },
  social: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { fontSize: 12.5, lineHeight: 18 },
});

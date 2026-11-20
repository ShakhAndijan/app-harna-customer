import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import PhotoGallery from './PhotoGallery';

// Bir to'plam rasm (katta rasm + kichiklari) va ustida yozuv.
export function PhotoStrip({ label, photos }) {
  const { theme: t } = useTheme();
  const [index, setIndex] = useState(0);
  if (!photos?.length) return null;
  return (
    <View style={s.strip}>
      {!!label && <Text style={[s.stripLabel, { color: t.muted }]}>{label}</Text>}
      <PhotoGallery
        photos={photos}
        index={Math.min(index, photos.length - 1)}
        onIndexChange={setIndex}
        t={t}
        height={190}
      />
    </View>
  );
}

// «Ish suratlari» (13.11): ustaning o'z suratlari, urinish-urinish — «Ishdan oldin» va «Ishdan keyin».
// Buyurtma ikkala tomoniga ko'rinadi. Surat bo'lmasa hech narsa chiqmaydi.
export default function WorkPhotosGallery({ photos }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const rounds = (photos?.rounds ?? []).filter((r) => r.before.length > 0 || r.after.length > 0);
  if (!rounds.length) return null;
  const numbered = rounds.length > 1;

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[s.title, { color: t.muted }]}>{tr('workPhotos.title')}</Text>
      {rounds.map((r) => (
        <View key={r.round} style={s.round}>
          {numbered && (
            <Text style={[s.roundLabel, { color: t.text }]}>
              {tr('workPhotos.round', { n: r.round })}
            </Text>
          )}
          <PhotoStrip label={tr('workPhotos.before')} photos={r.before} />
          <PhotoStrip label={tr('workPhotos.after')} photos={r.after} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  title: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  round: { gap: 10 },
  roundLabel: { fontSize: 14, fontWeight: '800' },
  strip: { gap: 6 },
  stripLabel: { fontSize: 13, fontWeight: '600' },
});

import { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { encodeImageUri } from '../utils';
import useThumb from '../../../hooks/useThumb';

// E'lon surati; rasm yo'q yoki yuklanmasa — kulrang fonda belgi. Video e'lon (`video`) muqovasiz
// bo'lsa (`thumb` — kichik nusxa), standart qorong'i muqova va katta "play" belgisi ko'rsatiladi.
export default function ListingPhoto({
  uri,
  style,
  iconSize = 28,
  video = false,
  thumb = false,
  resizeMode = 'cover',
  children,
}) {
  const { theme: t } = useTheme();
  const [failedUri, setFailedUri] = useState(null);
  // `thumb` — karta va ro'yxatdagi kichik ko'rinish: 800 px nusxa, u bo'lmasa rasmning o'zi.
  const { src, onError: thumbError } = useThumb(uri, thumb);
  const show = !!uri && failedUri !== uri;

  return (
    <View style={[s.box, { backgroundColor: t.card3 }, style]}>
      {show ? (
        <Image
          source={{ uri: encodeImageUri(src) }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onError={() => {
            if (!thumbError()) setFailedUri(uri);
          }}
        />
      ) : video ? (
        <>
          <LinearGradient
            colors={['#2a3140', '#12161e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.playRing}>
            <MaterialCommunityIcons name="play" size={iconSize + 6} color="#fff" />
          </View>
        </>
      ) : (
        <MaterialCommunityIcons name="image-outline" size={iconSize} color={t.faint} />
      )}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
});

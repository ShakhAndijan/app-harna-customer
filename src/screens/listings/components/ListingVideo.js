import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { encodeImageUri } from '../utils';

// expo-video pleyeri xossalari (muted) to'g'ridan-to'g'ri o'zgartiriladi.
function setPlayerMuted(player, value) {
  player.muted = value;
}

function setPlayerRate(player, value) {
  player.playbackRate = value;
}

// E'lon videosi. `active` bo'lmaganda to'xtab turadi (reels'da faqat ko'rinib turgan sahifa o'ynaydi).
// Bosilsa to'xtaydi/davom etadi, bosib turilsa 2x tezlikda o'ynaydi; `controls` — tizim boshqaruvi (batafsil sahifada). Ovoz standart o'chiq.
export default function ListingVideo({
  uri,
  poster,
  width,
  height,
  active = true,
  controls = false,
  contentFit = 'cover',
  style,
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [fast, setFast] = useState(false);

  useEffect(() => {
    if (active && !paused) player.play();
    else player.pause();
  }, [active, paused, player]);

  return (
    <View style={[{ width, height, backgroundColor: '#000' }, style]}>
      {!!poster && (
        <Image
          source={{ uri: encodeImageUri(poster) }}
          style={StyleSheet.absoluteFill}
          resizeMode={contentFit === 'contain' ? 'contain' : 'cover'}
        />
      )}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => setPaused((v) => !v)}
        delayLongPress={250}
        onLongPress={() => {
          setPlayerRate(player, 2);
          setFast(true);
        }}
        onPressOut={() => {
          if (!fast) return;
          setPlayerRate(player, 1);
          setFast(false);
        }}
        accessibilityRole="button"
      >
        <View style={StyleSheet.absoluteFill} pointerEvents={controls ? 'auto' : 'none'}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit}
            nativeControls={controls}
            allowsPictureInPicture={false}
          />
        </View>
        {fast && (
          <View style={s.fast} pointerEvents="none">
            <MaterialCommunityIcons name="fast-forward" size={16} color="#fff" />
            <Text style={s.fastTxt}>2x</Text>
          </View>
        )}
      </Pressable>
      {/* To'xtatish belgisi ekranning aynan o'rtasida: joyi o'lchamdan hisoblanadi (flex'ga bog'liq emas). */}
      {paused && (
        <View
          pointerEvents="none"
          style={[
            s.playCircle,
            height != null && width != null
              ? { top: height / 2 - 32, left: width / 2 - 32 }
              : { top: '50%', left: '50%', marginTop: -32, marginLeft: -32 },
          ]}
        >
          <MaterialCommunityIcons name="play" size={34} color="#fff" />
        </View>
      )}
      {!controls && (
        <TouchableOpacity
          style={s.mute}
          onPress={() => {
            setPlayerMuted(player, !muted);
            setMuted(!muted);
          }}
          activeOpacity={0.8}
          hitSlop={8}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={muted ? 'volume-off' : 'volume-high'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  playCircle: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fast: {
    position: 'absolute',
    top: 124,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  fastTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  mute: {
    position: 'absolute',
    right: 12,
    top: 124,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

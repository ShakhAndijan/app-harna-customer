import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { encodeImageUri, formatVideoDuration } from '../utils';

// expo-video pleyeri xossalari (muted) to'g'ridan-to'g'ri o'zgartiriladi.
function setPlayerMuted(player, value) {
  player.muted = value;
}

function seekPlayer(player, seconds) {
  player.currentTime = seconds;
}

function setPlayerRate(player, value) {
  player.playbackRate = value;
}

// Pleyerning joriy vaqti va umumiy uzunligi bilan sudraladigan chiziq. Bo'laklangan (fragmented) MP4
// sarlavhasida uzunlik yozilmaydi: pleyer musbat uzunlik bermaguncha serverdagi `video_duration` olinadi.
function ProgressBar({ player, fallbackDuration, bottom, showTime }) {
  const [time, setTime] = useState(0);
  const [scrub, setScrub] = useState(null); // sudralayotgan joy: 0..1
  const widthRef = useRef(1);
  const startRatioRef = useRef(0);
  const startXRef = useRef(0);
  const scrubRef = useRef(null);

  useEventListener(player, 'timeUpdate', (e) => setTime(e.currentTime));

  const playerDuration = player.duration;
  const duration =
    playerDuration > 0 ? playerDuration : fallbackDuration > 0 ? fallbackDuration : 0;

  if (!(duration > 0)) return null;
  const ratio = scrub ?? Math.min(1, time / duration);
  const shown = scrub != null ? scrub * duration : time;
  const clamp = (v) => Math.min(1, Math.max(0, v));

  return (
    <View style={[s.bar, { bottom }]} pointerEvents="box-none">
      {(scrub != null || showTime) && (
        <Text style={s.barTime}>
          {formatVideoDuration(shown)} / {formatVideoDuration(duration)}
        </Text>
      )}
      <View
        style={s.barTouch}
        onLayout={(e) => {
          widthRef.current = Math.max(1, e.nativeEvent.layout.width);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          startRatioRef.current = clamp(e.nativeEvent.locationX / widthRef.current);
          startXRef.current = e.nativeEvent.pageX;
          scrubRef.current = startRatioRef.current;
          setScrub(scrubRef.current);
        }}
        onResponderMove={(e) => {
          const dx = e.nativeEvent.pageX - startXRef.current;
          scrubRef.current = clamp(startRatioRef.current + dx / widthRef.current);
          setScrub(scrubRef.current);
        }}
        onResponderRelease={() => {
          if (scrubRef.current != null) seekPlayer(player, scrubRef.current * duration);
          scrubRef.current = null;
          setScrub(null);
        }}
        onResponderTerminate={() => {
          scrubRef.current = null;
          setScrub(null);
        }}
      >
        <View style={[s.barTrack, scrub != null && s.barTrackActive]}>
          <View style={[s.barFill, { width: `${ratio * 100}%` }]} />
        </View>
      </View>
    </View>
  );
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
  duration,
  barBottom = 0,
  style,
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
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
        <ProgressBar
          player={player}
          fallbackDuration={duration}
          bottom={barBottom}
          showTime={paused}
        />
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
  bar: { position: 'absolute', left: 0, right: 0, alignItems: 'stretch' },
  barTime: {
    alignSelf: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  barTouch: { height: 22, justifyContent: 'flex-end', paddingBottom: 6 },
  barTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  barTrackActive: { height: 5 },
  barFill: { height: '100%', backgroundColor: '#fff' },
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

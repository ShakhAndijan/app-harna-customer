import { memo, useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { encodeImageUri, priceText, timeAgo } from '../utils';
import ReelActionButton from './ReelActionButton';
import ListingVideo from './ListingVideo';
import { setReelsChromeHidden, useReelsChromeHidden } from '../../../navigation/reelsChrome';

const ORANGE = '#e87a45';
const GOLD = '#f5c451';
const RING = '#e87a45';

// Bitta e'lon — to'liq ekran: orqa fonda rasmlar (gorizontal suriladi), tepada orqaga/belgi,
// o'ngda amallar, pastda usta, sarlavha, tavsif, narx va "Bog'lanish".
function ReelPage({
  listing,
  width,
  height,
  insets,
  onBack,
  onSearch,
  onFilter,
  filterActive,
  onLike,
  onSave,
  onComments,
  onShare,
  onDetails,
  onContact,
  onOpenWorker,
  active = true,
}) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const worker = listing.worker;
  const photos = listing.photos;
  const ago = timeAgo(listing.createdAt, tr);

  // Rasmga bir marta bosilsa pastdagi yozuvlar va tugmalar (pastki menyu bilan birga) sekin pastga tushib
  // yashirinadi, yana bosilsa qaytadi. Video bosilganda to'xtash/davom etish ishlaydi, shuning uchun u yerda yo'q.
  const chromeHidden = useReelsChromeHidden();
  const [chrome] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(chrome, {
      toValue: chromeHidden ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [chromeHidden, chrome]);
  // Yashirin holat keyingi rasmli e'lonlarda ham saqlanadi; videoda esa bosish to'xtatish uchun,
  // shuning uchun video e'longa kelganda yozuvlar qaytadi.
  const hasVideo = !!listing.videoUrl;
  useEffect(() => {
    if (active && hasVideo && chromeHidden) setReelsChromeHidden(false);
  }, [active, hasVideo, chromeHidden]);
  const slide = chrome.interpolate({ inputRange: [0, 1], outputRange: [0, 140] });
  const slideRight = chrome.interpolate({ inputRange: [0, 1], outputRange: [0, 90] });
  const fade = chrome.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const toggleChrome = () => setReelsChromeHidden(!chromeHidden);

  return (
    <View style={{ width, height, backgroundColor: '#0b1117' }}>
      {listing.videoUrl ? (
        <ListingVideo
          uri={listing.videoUrl}
          poster={listing.videoPoster ?? photos[0]}
          width={width}
          height={height}
          active={active}
        />
      ) : photos.length > 0 ? (
        <FlatList
          data={photos}
          keyExtractor={(uri, i) => `${i}-${uri}`}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          // Faqat ko'rinib turgan sahifadan atrofdagi rasmlar yuklanadi.
          initialNumToRender={1}
          windowSize={3}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(e) =>
            setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item: uri }) => (
            // "cover": rasm har qanday ekran nisbatida butun ekranni to'ldiradi (ortiqcha chetlari qirqiladi).
            <Pressable onPress={toggleChrome} accessibilityRole="button">
              <Image
                source={{ uri: encodeImageUri(uri) }}
                style={{ width, height }}
                resizeMode="cover"
              />
            </Pressable>
          )}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.noPhoto]}>
          <MaterialCommunityIcons
            name="image-off-outline"
            size={56}
            color="rgba(255,255,255,0.3)"
          />
        </View>
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.55)', 'transparent']}
        style={[s.topShade, { height: insets.top + 110 }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[s.bottomShade, { height: height * 0.5, opacity: fade }]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.88)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={[s.topRow, { top: insets.top + 10 }]} pointerEvents="box-none">
        {!!onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={tr('common.back')}
            style={s.backBtn}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
        )}
        {listing.isTop && (
          <View style={s.topBadge}>
            <Ionicons name="flame" size={13} color={ORANGE} />
            <Text style={s.topBadgeTxt}>{tr('listings.top')}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {!listing.videoUrl && photos.length > 1 && (
          <View style={s.counter}>
            <Text style={s.counterTxt}>
              {photoIndex + 1}/{photos.length}
            </Text>
          </View>
        )}
        {!!onFilter && (
          <TouchableOpacity
            onPress={onFilter}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={tr('listings.reels.filterTitle')}
            style={s.backBtn}
          >
            <MaterialCommunityIcons name="tune-variant" size={22} color="#fff" />
            {filterActive && <View style={s.filterDot} />}
          </TouchableOpacity>
        )}
        {!!onSearch && (
          <TouchableOpacity
            onPress={onSearch}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={tr('common.search')}
            style={s.backBtn}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View
        style={[
          s.rail,
          { bottom: insets.bottom + 16, opacity: fade, transform: [{ translateX: slideRight }] },
        ]}
        pointerEvents={chromeHidden ? 'none' : 'box-none'}
      >
        <ReelActionButton
          icon={listing.isLiked ? 'heart' : 'heart-outline'}
          active={listing.isLiked}
          activeColor="#ff4d5e"
          label={String(listing.likeCount)}
          a11yLabel={tr('listings.reels.like')}
          onPress={() => onLike(listing)}
        />
        <ReelActionButton
          icon="comment-outline"
          label={String(listing.commentCount)}
          a11yLabel={tr('listings.reels.comments')}
          onPress={() => onComments(listing)}
        />
        <ReelActionButton
          icon="share-variant-outline"
          a11yLabel={tr('listings.reels.share')}
          onPress={() => onShare(listing)}
        />
        <ReelActionButton
          icon={listing.isFavorite ? 'bookmark' : 'bookmark-outline'}
          active={listing.isFavorite}
          activeColor={GOLD}
          a11yLabel={tr(listing.isFavorite ? 'listings.reels.saved' : 'listings.reels.save')}
          onPress={() => onSave(listing)}
        />
        <ReelActionButton
          icon="phone"
          fill={t.orange}
          a11yLabel={tr('listings.reels.contact')}
          onPress={() => onContact(listing)}
        />
      </Animated.View>

      <Animated.View
        style={[
          s.info,
          { paddingBottom: insets.bottom + 16, opacity: fade, transform: [{ translateY: slide }] },
        ]}
        pointerEvents={chromeHidden ? 'none' : 'box-none'}
      >
        <View style={s.topLine}>
          {!!worker && (
            <TouchableOpacity
              onPress={() => onOpenWorker(worker)}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={s.workerRow}
            >
              <View style={[s.avatar, { backgroundColor: worker.color }]}>
                {worker.photo ? (
                  <Image
                    source={{ uri: encodeImageUri(worker.photo) }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={s.avatarTxt}>{worker.initial}</Text>
                )}
              </View>
              <View style={{ flexShrink: 1 }}>
                <View style={s.nameRow}>
                  <Text style={s.workerName} numberOfLines={1}>
                    {worker.name}
                  </Text>
                  {worker.rating != null && worker.rating > 0 && (
                    <View style={s.ratingChip}>
                      <Ionicons name="star" size={11} color={GOLD} />
                      <Text style={s.rating}>{worker.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                {(!!worker.nickname || !!ago) && (
                  <View style={s.subRow}>
                    {!!worker.nickname && (
                      <Text style={[s.nick, { flexShrink: 1 }]} numberOfLines={1}>
                        @{worker.nickname}
                      </Text>
                    )}
                    {!!worker.nickname && !!ago && <View style={s.dot} />}
                    {!!ago && (
                      <>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={12}
                          color="rgba(255,255,255,0.6)"
                        />
                        <Text style={s.nick} numberOfLines={1}>
                          {ago}
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Sarlavha bosilsa e'lon tafsilotlari ochiladi (alohida "Batafsil" tugmasi yo'q). */}
        <TouchableOpacity
          onPress={() => onDetails(listing)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={tr('listings.reels.details')}
          style={s.titleRow}
        >
          <Text style={s.title} numberOfLines={2}>
            {listing.title}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Narx va tavsif bitta qatorda: narx to'q sariq qalin, tavsif uning yonida; bosilsa tavsif to'liq ochiladi. */}
        <Pressable onPress={() => setExpanded((v) => !v)} style={s.descWrap}>
          <Text style={s.desc} numberOfLines={expanded ? 8 : 1}>
            <Text style={[s.price, { color: listing.price == null ? '#fff' : ORANGE }]}>
              {priceText(listing, tr)}
            </Text>
            {!!listing.description && (
              <Text style={s.descMuted}>{`  ·  ${listing.description}`}</Text>
            )}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default memo(ReelPage);

const s = StyleSheet.create({
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomShade: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  topRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: ORANGE,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#fff',
  },
  topBadgeTxt: { color: '#111', fontSize: 12.5, fontWeight: '800' },
  counter: {
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  rail: { position: 'absolute', right: 6, gap: 14, alignItems: 'center' },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingLeft: 16, paddingRight: 72 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  workerRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: RING,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  workerName: { flexShrink: 1, color: '#fff', fontSize: 14.5, fontWeight: '800' },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9,
    backgroundColor: 'rgba(245,196,81,0.18)',
  },
  rating: { color: GOLD, fontSize: 12, fontWeight: '800' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  nick: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 10 },
  title: { flexShrink: 1, color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 24 },
  descWrap: { marginTop: 5 },
  desc: { color: 'rgba(255,255,255,0.82)', fontSize: 13.5, lineHeight: 19 },
  price: { fontWeight: '800' },
  descMuted: { color: 'rgba(255,255,255,0.82)', fontWeight: '400' },
});

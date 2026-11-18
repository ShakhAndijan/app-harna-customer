import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useAllCategoriesQuery } from '../../../queries/categories';
import { priceText, encodeImageUri, formatVideoDuration } from '../utils';
import ListingPhoto from './ListingPhoto';
import FavoriteButton from './FavoriteButton';

// E'lon kartasi (ro'yxatda ikki ustunli to'r va gorizontal karuselda). Kengligi tashqaridan beriladi
// (`width`) yoki ota-element belgilaydi.
export default function ListingCard({ listing, onPress, width, style }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { categories } = useAllCategoriesQuery();
  const category = categories.find((c) => c.id === listing.categoryId);
  const worker = listing.worker;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(listing)}
      accessibilityRole="button"
      accessibilityLabel={listing.title}
      style={[s.card, { backgroundColor: t.card, borderColor: t.border, width }, style]}
    >
      <ListingPhoto
        uri={listing.photos[0] ?? listing.videoPoster}
        video={!!listing.videoUrl}
        style={s.photo}
      >
        {listing.isTop && (
          <View style={[s.badge, { backgroundColor: t.orange }]}>
            <Ionicons name="flame" size={11} color="#fff" />
            <Text style={s.badgeTxt}>{tr('listings.top')}</Text>
          </View>
        )}
        <FavoriteButton listing={listing} overlay style={s.heart} />
        {!!listing.videoUrl && (
          <View style={s.count}>
            <MaterialCommunityIcons name="play-circle-outline" size={13} color="#fff" />
            {listing.videoDuration != null && (
              <Text style={s.countTxt}>{formatVideoDuration(listing.videoDuration)}</Text>
            )}
          </View>
        )}
        {!listing.videoUrl && listing.photos.length > 1 && (
          <View style={s.count}>
            <MaterialCommunityIcons name="image-multiple-outline" size={12} color="#fff" />
            <Text style={s.countTxt}>{listing.photos.length}</Text>
          </View>
        )}
      </ListingPhoto>

      <View style={s.body}>
        {!!category && (
          <Text style={[s.category, { color: t.muted }]} numberOfLines={1}>
            {category.name}
          </Text>
        )}
        <Text style={[s.title, { color: t.text }]} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text
          style={[s.price, { color: listing.price == null ? t.muted : t.orange }]}
          numberOfLines={1}
        >
          {priceText(listing, tr)}
        </Text>

        {!!worker && (
          <View style={[s.foot, { borderTopColor: t.border }]}>
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
            <Text style={[s.workerName, { color: t.muted }]} numberOfLines={1}>
              {worker.name}
            </Text>
            {worker.rating != null && worker.rating > 0 && (
              <View style={s.rating}>
                <Ionicons name="star" size={11} color={t.gold} />
                <Text style={[s.ratingTxt, { color: t.gold }]}>{worker.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1.18 },
  badge: {
    position: 'absolute',
    top: 9,
    left: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTxt: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
  heart: { position: 'absolute', top: 7, right: 7 },
  count: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: 'rgba(12,24,40,0.6)',
  },
  countTxt: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
  body: { padding: 12, paddingBottom: 11 },
  category: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  title: { fontSize: 14.5, fontWeight: '800', lineHeight: 19, marginTop: 3, minHeight: 19 },
  price: { fontSize: 14, fontWeight: '800', marginTop: 5 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  workerName: { flex: 1, fontSize: 11.5, fontWeight: '600' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingTxt: { fontSize: 11, fontWeight: '800' },
});

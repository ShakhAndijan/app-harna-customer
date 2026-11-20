import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useLanguage } from '../context/LanguageContext';
import PresenceBadge from './PresenceBadge';
import useThumb from '../hooks/useThumb';

const DEFAULT_COLORS = {
  card: '#142639',
  border: 'rgba(255,255,255,0.07)',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.45)',
  gold: '#f5c451',
  ratingBg: 'rgba(245,196,81,0.14)',
};

function formatPrice(n) {
  return n.toLocaleString('ru-RU');
}

// `listing.reviewCount` va `listing.tags` ixtiyoriy (reyting yonida sharhlar soni, kategoriya teglari);
// `onContact` berilsa pastda "Bog'lanish" tugmasi chiqadi.
export default function ListingCard({ listing, accent, onPress, onContact, colors }) {
  const { t } = useLanguage();
  const c = { ...DEFAULT_COLORS, ...colors };
  const [photoFailed, setPhotoFailed] = useState(false);
  const { src: photoSrc, onError: thumbError } = useThumb(listing.profile_photo);
  const showPhoto = listing.profile_photo && !photoFailed;
  // "Chilonzor, Toshkent · 14 ta ish": bajarilgan ishlar soni (nol bo'lsa ko'rsatilmaydi).
  const jobs =
    listing.completedJobCount > 0
      ? t('workerStats.cardJobs', { n: listing.completedJobCount })
      : '';
  const meta = [listing.location, listing.postedAgo, jobs].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <View style={[styles.avatar, { backgroundColor: listing.color }]}>
              {showPhoto ? (
                <Image
                  source={{ uri: photoSrc }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                  onError={() => {
                    if (!thumbError()) setPhotoFailed(true);
                  }}
                />
              ) : (
                <Text style={styles.avatarText}>{listing.initial}</Text>
              )}
            </View>
            {listing.certified && (
              <View style={[styles.verifiedBadge, { borderColor: c.card }]}>
                <Feather name="check" size={9} color="#fff" />
              </View>
            )}
          </View>
          <View>
            <Text style={[styles.name, { color: c.text }]}>{listing.name}</Text>
            {!!meta && <Text style={[styles.meta, { color: c.muted }]}>{meta}</Text>}
            <PresenceBadge worker={listing} style={{ marginTop: 5 }} />
          </View>
        </View>
        <View style={[styles.ratingPill, { backgroundColor: c.ratingBg }]}>
          <Text style={[styles.ratingText, { color: c.gold }]}>
            ★ {listing.rating.toFixed(1)}
            {listing.reviewCount > 0 ? ` (${listing.reviewCount})` : ''}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: c.text }]}>{listing.title}</Text>
      <Text style={[styles.desc, { color: c.muted }]} numberOfLines={2}>
        {listing.desc}
      </Text>

      {listing.tags?.length > 0 && (
        <View style={styles.tags}>
          {listing.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { borderColor: c.border }]}>
              <Text style={[styles.tagText, { color: c.muted }]} numberOfLines={1}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <View>
          <Text style={[styles.price, { color: c.text }]}>
            {t('listingCard.priceLine', { price: formatPrice(listing.price) })}
          </Text>
          <Text style={[styles.priceSub, { color: c.muted }]}>{t('listingCard.priceCaption')}</Text>
        </View>
        {onContact ? (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onContact}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={[styles.viewProfileBtn, { backgroundColor: accent }]}
            >
              <Feather name="message-circle" size={13} color="#fff" />
              <Text style={styles.viewProfileText}>{t('listingCard.contact')}</Text>
            </TouchableOpacity>
            <View
              style={[styles.profileArrow, { borderColor: c.border }]}
              accessibilityLabel={t('listingCard.viewProfile')}
            >
              <Feather name="chevron-right" size={16} color={c.text} />
            </View>
          </View>
        ) : (
          <View style={[styles.viewProfileBtn, { backgroundColor: accent }]}>
            <Text style={styles.viewProfileText}>{t('listingCard.viewProfile')}</Text>
            <Feather name="chevron-right" size={13} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    paddingLeft: 20,
    overflow: 'hidden',
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },
  verifiedBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#3f7fd4',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 14.5, fontWeight: '800' },
  meta: { fontSize: 11, marginTop: 1 },
  ratingPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  ratingText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '800', marginTop: 12 },
  desc: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    maxWidth: 150,
  },
  tagText: { fontSize: 10.5, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  price: { fontSize: 15, fontWeight: '800' },
  priceSub: { fontSize: 10.5, fontWeight: '600', marginTop: 1 },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  viewProfileText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

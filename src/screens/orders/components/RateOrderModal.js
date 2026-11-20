import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { appAlert } from '../../../components/AppAlert';
import { createOrderReview, uploadReviewPhoto, MAX_REVIEW_PHOTOS } from '../../../api/reviews';
import { getErrorMessage } from '../../../utils/errors';
import FlowModal from '../../requests/components/FlowModal';

const MAX_COMMENT = 2000;

// Yakunlangan buyurtmada ustaga baho: yulduz (majburiy), izoh va rasmlar (ixtiyoriy).
// `onRated(rating)` — muvaffaqiyatli yuborilgach chaqiriladi.
export default function RateOrderModal({ visible, ...rest }) {
  // Forma har ochilganda yangidan boshlanadi.
  return visible ? <RateForm {...rest} /> : null;
}

function RateForm({ order, onClose, onRated }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]); // [{ uri, mimeType }]
  const [photosPublic, setPhotosPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  const pickPhotos = async () => {
    const remaining = MAX_REVIEW_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      appAlert(tr('common.errorTitle'), tr('newOrder.photosPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPhotos((prev) =>
      [...prev, ...result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType }))].slice(
        0,
        MAX_REVIEW_PHOTOS
      )
    );
  };

  const submit = async () => {
    setBusy(true);
    try {
      const photoKeys = await Promise.all(photos.map((p) => uploadReviewPhoto(p.uri, p.mimeType)));
      await createOrderReview(order.id, { rating, comment, photoKeys, photosPublic });
      onRated(rating);
    } catch (e) {
      appAlert(
        tr('common.errorTitle'),
        e?.code === 'UNSUPPORTED_PHOTO_TYPE'
          ? tr('newOrder.photosUnsupported')
          : getErrorMessage(e, tr, 'orderDetail.rateFailed')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <FlowModal
      visible
      title={tr('orderDetail.rateTitle')}
      hint={tr('orderDetail.rateHint', { name: order.master || '' })}
      confirmLabel={tr('orderDetail.rateSend')}
      disabled={rating === 0}
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
    >
      <View style={s.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            onPress={() => setRating(i)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={tr('orderDetail.rateStar', { n: i })}
          >
            <Ionicons
              name={i <= rating ? 'star' : 'star-outline'}
              size={38}
              color={i <= rating ? t.gold : t.border}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={MAX_COMMENT}
        placeholder={tr('orderDetail.rateCommentPlaceholder')}
        placeholderTextColor={t.faint}
        style={[s.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
      />

      <View style={s.photos}>
        {photos.map((p) => (
          <View key={p.uri} style={s.tile}>
            <Image source={{ uri: p.uri }} style={s.tileImg} />
            <TouchableOpacity
              onPress={() => setPhotos((prev) => prev.filter((x) => x.uri !== p.uri))}
              disabled={busy}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={s.remove}
            >
              <MaterialCommunityIcons name="close" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < MAX_REVIEW_PHOTOS && (
          <TouchableOpacity
            onPress={pickPhotos}
            disabled={busy}
            activeOpacity={0.8}
            style={[s.add, { backgroundColor: t.card, borderColor: t.border }]}
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={22} color={t.orange} />
            <Text style={[s.addTxt, { color: t.muted }]}>
              {photos.length}/{MAX_REVIEW_PHOTOS}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Buyurtma suratlari ustaning ochiq profilida ko'rinsinmi: sharh tahrirlanmaydi, shuning uchun faqat shu yerda. */}
      <TouchableOpacity
        style={s.consent}
        activeOpacity={0.8}
        onPress={() => setPhotosPublic((v) => !v)}
        disabled={busy}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: photosPublic }}
      >
        <View
          style={[
            s.box,
            {
              borderColor: photosPublic ? t.orange : t.border,
              backgroundColor: photosPublic ? t.orange : t.card,
            },
          ]}
        >
          {photosPublic && <MaterialCommunityIcons name="check" size={15} color="#fff" />}
        </View>
        <Text style={[s.consentText, { color: t.text }]}>{tr('reviewConsent.photosPublic')}</Text>
      </TouchableOpacity>
      <Text style={[s.consentHint, { color: t.muted }]}>
        {tr('reviewConsent.photosPublicHint')}
      </Text>
    </FlowModal>
  );
}

const s = StyleSheet.create({
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  input: {
    minHeight: 96,
    maxHeight: 160,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden' },
  tileImg: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addTxt: { fontSize: 10.5, fontWeight: '600' },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentText: { flex: 1, fontSize: 14, fontWeight: '600' },
  consentHint: { fontSize: 12.5, lineHeight: 18, marginTop: -4 },
});

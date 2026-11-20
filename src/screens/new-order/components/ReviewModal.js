import { Fragment, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import getReviewTexts from '../reviewTexts';
import { common } from '../styles';
import SummaryRow from './SummaryRow';
import { formatPhone } from '../utils';
import DepositNeedNotice from '../../deposit/DepositNeedNotice';

export default function ReviewModal({
  visible,
  onClose,
  onConfirm,
  submitting,
  depositNeed,
  t,
  tr,
  orderWorker,
  selectedCategories,
  addressTitle,
  addressSubtitle,
  street,
  mahalla,
  entrance,
  floor,
  when,
  whenDate,
  whenWindow,
  description,
  photos,
  workerCount,
  requirePhoto,
  minRating,
  pricingType,
  hourlyRate,
  estimatedHours,
  fixedPrice,
  paymentMethod,
  phone,
  backupPhone,
  requireVerified,
  minExperience,
  extraRequirements,
  quote,
}) {
  // "Qo'shimcha ma'lumotlar" yopiq turadi, bosilganda ochiladi.
  const [extraOpen, setExtraOpen] = useState(false);
  // Oyna yopilganda blok qayta yig'iladi.
  const handleClose = () => {
    setExtraOpen(false);
    onClose();
  };
  const toggleExtra = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExtraOpen((v) => !v);
  };

  const { notSet, whenText, ratingText, experienceText, pricingText, addressText } = getReviewTexts(
    {
      when,
      whenDate,
      whenWindow,
      minRating,
      minExperience,
      pricingType,
      hourlyRate,
      estimatedHours,
      fixedPrice,
      paymentMethod,
      street,
      mahalla,
      entrance,
      floor,
      addressTitle,
      addressSubtitle,
      quote,
    },
    tr
  );

  // 1) Tafsilotlar: tavsif, narx, sana, rasm.
  const rows = [
    !!orderWorker && {
      icon: 'account-star-outline',
      label: tr('newOrder.targetWorkerLabel'),
      value: [orderWorker.name, orderWorker.trade].filter(Boolean).join(' — '),
    },
    // E'lon orqali buyurtma: e'lon raqami (kodi) ham ko'rsatiladi.
    !!orderWorker?.listingId &&
      !!orderWorker.listingCode && {
        icon: 'bullhorn-outline',
        label: tr('orderHistory.listing'),
        value: `#${orderWorker.listingCode}`,
      },
    {
      icon: 'text-long',
      label: tr('newOrder.descriptionLabel'),
      value: description.trim() || notSet,
    },
    { icon: 'cash-multiple', label: tr('newOrder.pricingLabel'), value: pricingText },
    { icon: 'calendar-clock', label: tr('newOrder.whenLabel'), value: whenText },
    {
      icon: 'image-multiple-outline',
      label: tr('newOrder.photosLabel'),
      value: tr('newOrder.review.photosCount', { n: photos.length }),
    },
  ].filter(Boolean);

  // 2) Manzil va aloqa: manzil, telefon, zaxira telefon.
  const placeRows = [
    { icon: 'map-marker-outline', label: tr('newOrder.locationLabel'), value: addressText },
    {
      icon: 'phone-outline',
      label: tr('newOrder.phoneLabel'),
      value: `+998 ${formatPhone(phone)}`,
    },
    !!backupPhone.trim() && {
      icon: 'phone-plus-outline',
      label: tr('newOrder.backupPhoneLabel'),
      value: `+998 ${formatPhone(backupPhone)}`,
    },
  ].filter(Boolean);

  // 3) Ixtiyoriy: kategoriya, necha kishi, talablar (+ ilovaga xos asboblar).
  const extraRows = [
    {
      icon: 'briefcase-outline',
      label: tr('newOrder.categoryLabel'),
      value: selectedCategories.map((c) => c.name).join(', ') || notSet,
    },
    {
      icon: 'account-group-outline',
      label: tr('newOrder.workerCountLabel'),
      value: String(workerCount),
    },
    // Aniq ustaga buyurtmada ishchiga talablar yuborilmaydi — faqat "boshqa talablar".
    !orderWorker && {
      icon: 'shield-check-outline',
      label: tr('newOrder.requirements.photoRequired'),
      value: requirePhoto ? tr('common.yes') : tr('common.no'),
    },
    !orderWorker && {
      icon: 'check-decagram-outline',
      label: tr('newOrder.requirements.verifiedRequired'),
      value: requireVerified ? tr('common.yes') : tr('common.no'),
    },
    !orderWorker && {
      icon: 'star-outline',
      label: tr('newOrder.requirements.ratingLabel'),
      value: ratingText,
    },
    !orderWorker && {
      icon: 'briefcase-clock-outline',
      label: tr('newOrder.requirements.experienceLabel'),
      value: experienceText,
    },
    !!extraRequirements?.trim() && {
      icon: 'text-box-outline',
      label: tr('newOrder.requirements.otherLabel'),
      value: extraRequirements.trim(),
    },
  ].filter(Boolean);

  const renderRows = (list) =>
    list.map((row, i) => (
      <Fragment key={row.icon}>
        {i > 0 && <View style={[s.divider, { backgroundColor: t.border }]} />}
        <SummaryRow icon={row.icon} label={row.label} value={row.value} t={t} />
      </Fragment>
    ));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: t.bg }}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <View style={s.reviewHeader}>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.85}
              style={[common.mapBackBtn, { backgroundColor: t.card }]}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={t.text} />
            </TouchableOpacity>
            <Text style={[s.reviewHeaderTitle, { color: t.text }]}>
              {tr('newOrder.review.title')}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Omonat kerak bo'lsa: summa, to'lash vaqti va sababi — buyurtma shundan keyin e'lon qilinadi. */}
            <DepositNeedNotice need={depositNeed} />

            <Text style={[s.groupTitle, { color: t.muted }]}>{tr('newOrder.step1Title')}</Text>
            <View style={[s.box, { backgroundColor: t.card, borderColor: t.border }]}>
              {renderRows(rows)}
            </View>

            <Text style={[s.groupTitle, { color: t.muted }]}>{tr('newOrder.step2Title')}</Text>
            <View style={[s.box, { backgroundColor: t.card, borderColor: t.border }]}>
              {renderRows(placeRows)}
            </View>

            <TouchableOpacity
              onPress={toggleExtra}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ expanded: extraOpen }}
              style={[s.extraHeader, { backgroundColor: t.card, borderColor: t.border }]}
            >
              <MaterialCommunityIcons name="tune-variant" size={18} color={t.orange} />
              <Text style={[s.extraTitle, { color: t.text }]}>{tr('newOrder.step3Title')}</Text>
              <MaterialCommunityIcons
                name={extraOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={t.faint}
              />
            </TouchableOpacity>
            {extraOpen && (
              <View
                style={[s.box, { backgroundColor: t.card, borderColor: t.border, marginTop: 8 }]}
              >
                {renderRows(extraRows)}
              </View>
            )}
          </ScrollView>

          <View style={[s.reviewFooter, { backgroundColor: t.bg, borderTopColor: t.border }]}>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.85}
              disabled={submitting}
              style={[
                s.reviewEditBtn,
                { borderColor: t.border, backgroundColor: t.card },
                submitting && { opacity: 0.5 },
              ]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={t.text} />
              <Text style={[s.reviewEditTxt, { color: t.text }]}>{tr('common.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.85}
              disabled={submitting}
              style={[common.cta, { backgroundColor: t.orange, flex: 1, marginTop: 0 }]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={[common.ctaTxt, { color: '#fff' }]}>{tr('common.confirm')}</Text>
                  <MaterialCommunityIcons name="check" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  reviewHeaderTitle: { fontSize: 16, fontWeight: '700' },
  extraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 12,
  },
  box: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2 },
  divider: { height: 1 },
  groupTitle: { fontSize: 12.5, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  extraTitle: { flex: 1, fontSize: 14.5, fontWeight: '800' },
  reviewFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  reviewEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  reviewEditTxt: { fontSize: 14, fontWeight: '700' },
});

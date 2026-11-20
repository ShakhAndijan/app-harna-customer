import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { randomUUID } from '../utils/uuid';
import LocationMapPicker from '../components/LocationMapPicker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import LoginScreen from './LoginScreen';
import { useAllCategoriesQuery, useCategoryTreeQuery } from '../queries/categories';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, getDepositRequirement, getOrderAgain, getOrderBrief } from '../api/orders';
import { depositNewlyRequired } from './deposit/utils';
import { getCustomerMe } from '../api/user';
import { primaryFromMe } from './addresses/hooks/useAddresses';
import { stripCountryCode, toISODate } from './new-order/utils';
import buildOrderPayload from './new-order/buildOrderPayload';
import { catalogMoved, fitsPicks, platformQuote } from './new-order/platformPrice';
import { MAX_CATEGORIES, MAX_PHOTOS } from './new-order/constants';
import CategoryPickerModal from './new-order/components/CategoryPickerModal';
import CategorySuggestChip from './new-order/components/CategorySuggestChip';
import useCategorySuggestion from './new-order/hooks/useCategorySuggestion';
import AddressModal from './new-order/components/AddressModal';
import ReviewModal from './new-order/components/ReviewModal';
import PhotoPreviewModal from './new-order/components/PhotoPreviewModal';
import TargetWorkerCard from './new-order/sections/TargetWorkerCard';
import CategorySection from './new-order/sections/CategorySection';
import DescriptionSection from './new-order/sections/DescriptionSection';
import AddressSection from './new-order/sections/AddressSection';
import WhenSection from './new-order/sections/WhenSection';
import PhotosSection from './new-order/sections/PhotosSection';
import WorkerCountSection from './new-order/sections/WorkerCountSection';
import RequirementsSection from './new-order/sections/RequirementsSection';
import OrderProgressCard from './new-order/sections/OrderProgressCard';
import PricingSection from './new-order/sections/PricingSection';
import ContactSection, { BackupPhoneSection } from './new-order/sections/ContactSection';
import StepHeader from './new-order/components/StepHeader';
import ExtraSection from './new-order/sections/ExtraSection';
import CompanySiteSection from './new-order/sections/CompanySiteSection';
import SubmitButton from './new-order/sections/SubmitButton';
import useOrderPhotos from './new-order/hooks/useOrderPhotos';
import useOrderLocation from './new-order/hooks/useOrderLocation';
import useOrderDraft from './new-order/hooks/useOrderDraft';
import useTabBarSpace from '../navigation/useTabBarSpace';
import { getErrorMessage } from '../utils/errors';
import { trackEvent } from '../utils/analytics';
import { useOrderTiming } from '../queries/orderTiming';
import { keptWindow, tashkentToday } from './requests/arrival';

// `onBack` berilsa (masalan usta profilidan ochilganda) tepada orqaga tugmasi chiqadi va
// pastki menyu uchun joy qoldirilmaydi.
// `onRestartDraft` berilsa, tiklangan qoralama ustida "Yangidan boshlash" tugmasi chiqadi (u formani
// bo'sh holda qayta ochadi).
// `againFrom` — "Yana chaqirish": yakunlangan buyurtma id'si; forma shu buyurtma ma'lumotlari (tavsif,
// manzil, rasmlar) bilan to'ldiriladi (GET /orders/{id}/again). Narx, sana va telefon bo'sh qoladi.
export default function NewOrderScreen({
  onOrderCreated,
  targetWorker,
  onBack,
  onRestartDraft,
  againFrom,
}) {
  const tabSpace = useTabBarSpace(110);
  const insets = useSafeAreaInsets();
  const bottomSpace = onBack ? 32 + insets.bottom : tabSpace;
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { user } = useUser();
  // Mehmon: forma hisobsiz to'ldiriladi, "Tasdiqlash"da telefon kodi bilan kirish oynasi chiqadi.
  const { signedIn, signIn } = useAuth();
  const guest = !signedIn;
  const [authOpen, setAuthOpen] = useState(false);

  const [orderWorker, setOrderWorker] = useState(targetWorker || null);
  const [categoryIds, setCategoryIds] = useState(
    targetWorker?.categoryId ? [targetWorker.categoryId] : []
  );
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [street, setStreet] = useState('');
  const [mahalla, setMahalla] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [gpsLat, setGpsLat] = useState(null);
  const [gpsLng, setGpsLng] = useState(null);
  const [when, setWhen] = useState('today');
  const [whenDate, setWhenDate] = useState(null);
  // «Qaysi vaqtda kelsin?»: tanlangan oraliq boshi ("10:00"); haqiqatda yuboriladigani `whenWindow` (pastda).
  const [windowPick, setWindowPick] = useState(null);
  const timing = useOrderTiming();
  const [previewIndex, setPreviewIndex] = useState(null);
  const [workerCount, setWorkerCount] = useState(1);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [requireVerified, setRequireVerified] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [extraRequirements, setExtraRequirements] = useState('');
  const [pricingType, setPricingType] = useState('fixed');
  const [hourlyRate, setHourlyRate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  // To'lov usuli formada tanlanmaydi: standart naqd pul.
  const paymentMethod = 'cash';
  const [phone, setPhone] = useState(stripCountryCode(user?.phone));
  const [backupPhone, setBackupPhone] = useState('');
  // Kompaniya obyekti (korporativ hisob): tanlansa buyurtma kompaniya hisobotiga tushadi.
  const [orgSiteId, setOrgSiteId] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Omonat: hozir berilgan buyurtma omonat kutadimi (forma ochilganda o'qiladi, yuborishdan oldin yana).
  const [depositNeed, setDepositNeed] = useState(null);
  // Bir xil so'rov qayta yuborilsa (masalan tarmoq xatosidan keyin "Tasdiqlash"
  // yana bosilsa) backend buni dublikat sifatida qaytarishi uchun shu bir xil
  // kalit qayta ishlatiladi — forma qayta ochilganda yangisi generatsiya qilinadi.
  const idempotencyKeyRef = useRef(null);

  // "Buyurtmangiz" kartasidagi bandni bosganda shu maydon turgan joyga o'tish: har bir bo'limning
  // skroll ichidagi balandligi (onLayout) saqlanadi.
  const scrollRef = useRef(null);
  const [sectionY, setSectionY] = useState({});
  const trackSection = (key) => (e) => {
    const y = e.nativeEvent.layout.y;
    setSectionY((prev) => (prev[key] === y ? prev : { ...prev, [key]: y }));
  };
  const scrollToSection = (key) => {
    const y = sectionY[key];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  };

  const { photos, pickPhotos, removePhoto, uploadAll, keptPhotos, setKeptPhotos, removeKept } =
    useOrderPhotos();
  const {
    regions,
    regionId,
    setRegionId,
    districts,
    districtId,
    setDistrictId,
    autoSelectLocation,
    presetLocation,
  } = useOrderLocation();

  const { categories } = useAllCategoriesQuery();
  const { tree: categoryTree } = useCategoryTreeQuery();
  const queryClient = useQueryClient();

  // "Yana chaqirish": forma eski buyurtma ma'lumotlari bilan bir marta to'ldiriladi. Tavsif allaqachon
  // yozilgan bo'lsa tegilmaydi. Bildirishnomadan (usta berilmagan) ochilganda usta buyurtmadan olinadi.
  const descriptionRef = useRef('');
  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);
  const againAppliedRef = useRef(false);
  useEffect(() => {
    if (againFrom == null || againAppliedRef.current) return;
    againAppliedRef.current = true;
    (async () => {
      try {
        const [again, brief] = await Promise.all([
          getOrderAgain(againFrom),
          targetWorker ? null : getOrderBrief(againFrom).catch(() => null),
        ]);
        if (descriptionRef.current.trim()) return;
        if (brief?.workerId != null) {
          setOrderWorker({
            id: brief.workerId,
            name: brief.master,
            trade: brief.service,
            bgColor: brief.color,
            initial: brief.letter,
            categoryId: brief.categoryId,
          });
        }
        setDescription(again.description);
        if (again.categoryIds.length > 0) setCategoryIds(again.categoryIds);
        setWorkerCount(again.workersNeeded);
        setExtraRequirements(again.extraRequirements);
        if (again.regionId != null) presetLocation(again.regionId, again.districtId);
        setStreet(again.landmark);
        setMahalla(again.mahalla);
        setEntrance(again.entrance);
        setFloor(again.floor);
        if (again.gpsLat != null && again.gpsLng != null) {
          setGpsLat(again.gpsLat);
          setGpsLng(again.gpsLng);
        }
        setKeptPhotos(again.photos.slice(0, MAX_PHOTOS));
      } catch (err) {
        appAlert(tr('newOrder.againFailedTitle'), getErrorMessage(err, tr, 'newOrder.againFailed'));
      }
    })();
    // Bir marta: forma ochilganda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [againFrom]);

  const toggleCategory = (id) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedCategories = categories.filter((c) => categoryIds.includes(c.id));
  // «O'zgarmas narx»: narxni platforma belgilagan yo'nalishlar. Narx buyurtma viloyatiga qarab hisoblanadi,
  // narxli va kelishiladigan ish bir buyurtmaga sig'maydi (tanlagich xiralashtiradi, forma ham tekshiradi).
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const quote = platformQuote(categoryIds, categoryById, regionId);

  // «Taklif»: tavsifga qarab server yo'nalish tavsiya qiladi. Aniq ustaga buyurtmada (yo'nalish ustaniki) va
  // yo'nalishlar yuklanmaguncha so'ralmaydi. Quyi yo'nalishi bor yo'nalish tanlanmaydi, tanlagichda ochiladi.
  const suggestedIds = useCategorySuggestion(description, !orderWorker && categoryTree.length > 0);
  const suggestedId = suggestedIds?.find((id) => categoryById.has(id)) ?? null;
  const suggested = suggestedId != null ? categoryById.get(suggestedId) : null;
  const suggestedOpens = categoryTree.some((c) => c.id === suggestedId && c.children?.length > 0);
  const [pickerFocus, setPickerFocus] = useState({ key: 0, parentId: null });
  const takeSuggestion = () => {
    if (suggestedOpens) {
      setPickerFocus((p) => ({ key: p.key + 1, parentId: suggestedId }));
      setCategoryPickerOpen(true);
    } else if (categoryIds.length < MAX_CATEGORIES) {
      setCategoryIds((prev) => [...prev, suggestedId]);
    }
  };
  const selectedRegion = regions.find((r) => r.id === regionId);
  const selectedDistrict = districts.find((d) => d.id === districtId);
  const hasAddress = !!(districtId || regionId || street.trim() || gpsLat);
  const addressTitle =
    [selectedDistrict?.name, selectedRegion?.name].filter(Boolean).join(', ') ||
    street.trim() ||
    tr('newOrder.addressModalTitle');
  const addressSubtitle = selectedDistrict?.name || selectedRegion?.name ? street.trim() : '';

  // Profilda saqlangan manzil: manzil hali tanlanmagan bo'lsa, shu manzilga berish so'raladi.
  const meQuery = useQuery({
    queryKey: ['customer', 'me'],
    queryFn: getCustomerMe,
    enabled: signedIn,
  });
  const [savedDismissed, setSavedDismissed] = useState(false);
  const saved = !hasAddress && !savedDismissed ? primaryFromMe(meQuery.data) : null;
  const savedAddress = saved
    ? {
        title:
          [saved.districtName, saved.regionName].filter(Boolean).join(', ') ||
          saved.street ||
          tr('newOrder.addressModalTitle'),
        subtitle: saved.districtName || saved.regionName ? saved.street : '',
      }
    : null;
  const applySavedAddress = () => {
    if (!saved) return;
    presetLocation(saved.regionId, saved.districtId);
    setStreet(saved.street);
    if (saved.lat != null && saved.lng != null) {
      setGpsLat(saved.lat);
      setGpsLng(saved.lng);
    }
  };

  // Majburiy maydonlar: xizmat turi (konkret usta tanlanmagan bo'lsa), tavsif, narx ("Ish uchun" — ish narxi, "Soatbay" — soat narxi), qachon
  // (sana tanlangan bo'lsa — sana ham), manzil, telefon.
  const addressReady = !!districtId || (gpsLat != null && gpsLng != null);
  const whenReady = !!when && (when !== 'date' || !!whenDate);
  // Oyna faqat aniq kun bilan so'raladi ("Bugun" yoki tanlangan sana), shoshilinch va "farqi yo'q"da yo'q.
  // Tanlangan oraliq shu kunda endi tanlab bo'lmaydigan bo'lib qolsa (vaqt o'tdi, kun o'zgardi) yuborilmaydi:
  // ko'rsatilgan narsa yuboriladi.
  const windowDay =
    when === 'today' ? tashkentToday() : when === 'date' && whenDate ? toISODate(whenDate) : null;
  const whenWindow = keptWindow(timing, windowDay, windowPick, { notBegun: true });
  // Narxli ishda narx yozilmaydi (platforma belgilagan), shuning uchun u "to'ldirilgan" hisoblanadi.
  const priceReady =
    quote.kind === 'priced' ||
    (pricingType === 'hourly' ? !!hourlyRate.trim() : !!fixedPrice.trim());
  const missing = [
    description.trim().length === 0 && 'newOrder.descriptionLabel',
    !priceReady && 'newOrder.pricingLabel',
    !whenReady && 'newOrder.whenLabel',
    !addressReady && 'newOrder.locationLabel',
    phone.trim().length === 0 && 'newOrder.phoneLabel',
  ].filter(Boolean);
  const ready = missing.length === 0 && quote.kind !== 'mixed';

  // Tahlil: forma ochildi; to'ldirilgan majburiy maydonlar soniga qarab 1–5-qadam (har biri bir marta);
  // 6-qadam — tasdiqlash oynasi.
  const seenStepsRef = useRef(new Set());
  const trackStep = (step) => {
    if (seenStepsRef.current.has(step)) return;
    seenStepsRef.current.add(step);
    trackEvent('wizard_step_viewed', step);
  };
  const filledCount = 5 - missing.length;
  useEffect(() => {
    trackEvent('wizard_opened');
  }, []);
  useEffect(() => {
    trackStep(Math.min(filledCount + 1, 5));
  }, [filledCount]);

  const extraFilled = [
    categoryIds.length > 0,
    !!backupPhone.trim(),
    workerCount > 1,
    requirePhoto ||
      requireVerified ||
      minRating > 0 ||
      minExperience > 0 ||
      !!extraRequirements.trim(),
  ].filter(Boolean).length;

  // Payload va tasdiqlash oynasi uchun umumiy forma qiymatlari.
  const form = {
    description,
    categoryIds,
    orderWorker,
    phone,
    backupPhone,
    regionId,
    districtId,
    gpsLat,
    gpsLng,
    street,
    mahalla,
    entrance,
    floor,
    when,
    whenDate,
    whenWindow,
    workerCount,
    requirePhoto,
    requireVerified,
    minRating,
    minExperience,
    extraRequirements,
    pricingType,
    hourlyRate,
    estimatedHours,
    fixedPrice,
    paymentMethod,
    orgSiteId,
    againFrom,
    keptPhotos,
    quote,
  };

  // Qoralama: konkret ustaga buyurtmada ishlatilmaydi (u ustaga xos, oddiy qoralamani buzmasligi kerak).
  const profilePhone = stripCountryCode(user?.phone);
  const draft = useOrderDraft({
    enabled: !targetWorker && signedIn,
    userId: user?.id ?? user?.phone,
    snapshot: {
      description,
      categoryIds,
      street,
      mahalla,
      entrance,
      floor,
      gpsLat,
      gpsLng,
      regionId,
      districtId,
      when,
      whenDate: whenDate ? whenDate.toISOString() : null,
      whenWindow: windowPick,
      workerCount,
      requirePhoto,
      requireVerified,
      minRating,
      minExperience,
      extraRequirements,
      pricingType,
      hourlyRate,
      estimatedHours,
      fixedPrice,
      // Profildagi telefon har safar profildan olinadi: faqat qo'lda o'zgartirilgani saqlanadi.
      phone: phone === profilePhone ? '' : phone,
      backupPhone,
      orgSiteId,
    },
    onRestore: (d) => {
      const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
      const str = (v) => (typeof v === 'string' ? v : '');
      setDescription(str(d.description));
      setCategoryIds(Array.isArray(d.categoryIds) ? d.categoryIds : []);
      setStreet(str(d.street));
      setMahalla(str(d.mahalla));
      setEntrance(str(d.entrance));
      setFloor(str(d.floor));
      setGpsLat(d.gpsLat != null && Number.isFinite(Number(d.gpsLat)) ? Number(d.gpsLat) : null);
      setGpsLng(d.gpsLng != null && Number.isFinite(Number(d.gpsLng)) ? Number(d.gpsLng) : null);
      if (d.regionId) presetLocation(d.regionId, d.districtId);
      // O'tib ketgan sana tiklanmaydi: "Bugun"ga qaytariladi.
      const savedDate = d.whenDate ? new Date(d.whenDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d.when === 'urgent') setWhen('urgent');
      else if (savedDate && !Number.isNaN(savedDate.getTime()) && savedDate >= today) {
        setWhen('date');
        setWhenDate(savedDate);
        // Saqlangan oraliq endi yaroqsiz bo'lsa, `keptWindow` uni tashlab yuboradi.
        setWindowPick(/^\d{2}:\d{2}$/.test(str(d.whenWindow)) ? d.whenWindow : null);
      }
      setWorkerCount(Math.max(1, num(d.workerCount, 1)));
      setRequirePhoto(!!d.requirePhoto);
      setRequireVerified(!!d.requireVerified);
      setMinRating(num(d.minRating));
      setMinExperience(num(d.minExperience));
      setExtraRequirements(str(d.extraRequirements));
      setPricingType(d.pricingType === 'hourly' ? 'hourly' : 'fixed');
      setHourlyRate(str(d.hourlyRate));
      setEstimatedHours(str(d.estimatedHours));
      setFixedPrice(str(d.fixedPrice));
      if (str(d.phone)) setPhone(d.phone);
      setBackupPhone(str(d.backupPhone));
      setOrgSiteId(d.orgSiteId ?? null);
    },
  });

  const restartDraft = () => {
    draft.clearDraft();
    onRestartDraft?.();
  };

  // Obyekt tanlanganda uning manzili va aloqa telefoni forma maydonlariga olinadi (keyin tahrirlash mumkin).
  const handleSiteSelect = (site) => {
    setOrgSiteId(site?.id ?? null);
    if (!site) return;
    presetLocation(site.regionId, site.districtId);
    if (site.address) setStreet(site.address);
    if (site.contactPhone) setPhone(stripCountryCode(site.contactPhone));
  };

  const openReview = () => {
    idempotencyKeyRef.current = randomUUID();
    trackStep(6);
    setReviewOpen(true);
  };

  const handleMapChange = (lat, lng, opts) => {
    const nLat = Number(lat);
    const nLng = Number(lng);
    setGpsLat(nLat);
    setGpsLng(nLng);
    if (!opts?.fromSearch) autoSelectLocation(nLat, nLng);
  };

  const handleSubmit = () => {
    if (submitting) return;
    trackEvent('wizard_submit_pressed');
    if (guest) {
      setReviewOpen(false);
      trackEvent('wizard_phone_asked');
      setAuthOpen(true);
      return;
    }
    submitOrder();
  };

  // Kirish tugagach (token saqlangan) sessiya ochiladi va buyurtma shu formadan yuboriladi.
  const handleGuestLogin = async (actorType) => {
    setAuthOpen(false);
    signIn(actorType);
    await submitOrder({ afterGate: true });
  };

  const submitOrder = async ({ afterGate = false } = {}) => {
    if (submitting) return;
    const payload = buildOrderPayload(form);

    setSubmitting(true);
    try {
      // Omonat: qoida forma ochiq turganda o'zgargan bo'lishi mumkin (mehmon esa kirgach o'qiladi). Aytilmagan
      // omonat topilsa buyurtma yuborilmaydi: eslatma ko'rsatiladi, keyingi bosish yuboradi.
      const said = !afterGate && depositNeed?.required === true;
      const fresh = await getDepositRequirement().catch(() => null);
      if (fresh) setDepositNeed(fresh);
      if (depositNewlyRequired(said, fresh)) {
        setReviewOpen(true);
        return;
      }

      if (photos.length > 0) {
        try {
          payload.photo_temp_keys = await uploadAll();
        } catch (uploadErr) {
          appAlert(
            tr('newOrder.submitErrorTitle'),
            uploadErr?.code === 'UNSUPPORTED_PHOTO_TYPE'
              ? tr('newOrder.photosUnsupported')
              : tr('newOrder.photosUploadFailed')
          );
          return;
        }
      }

      const created = await createOrder(payload, idempotencyKeyRef.current);
      trackEvent('wizard_order_created');
      // Yangi buyurtma ro'yxatda, bosh sahifada va profil sonida ko'rinsin.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['home', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'me'] });
      setReviewOpen(false);
      draft.clearDraft();
      // Narx qotirilgan buyurtma: takliflar shu narxda keladi, mijoz faqat usta va kunni tanlaydi.
      if (created?.platform_price != null) {
        appAlert(tr('platformPrice.label'), tr('platformPrice.doneBody'));
      }
      onOrderCreated?.({
        id: created?.id ?? null,
        category: selectedCategories.map((c) => c.name).join(', '),
        address: addressTitle,
        raw: created,
      });
    } catch (err) {
      // Katalog forma ochiq turganda o'zgardi (narx o'zgardi yoki ish narxli/kelishiladigan bo'ldi, 409):
      // yo'nalishlar qayta o'qiladi va tasdiqlash oynasi yopiladi — mijoz yangi summani ko'rib qayta yuboradi.
      if (catalogMoved(err)) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        setReviewOpen(false);
      }
      appAlert(tr('newOrder.submitErrorTitle'), getErrorMessage(err, tr, 'common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      {/* Xarita "manzil" oynasi ochilishidan oldin shu yerda ko'rinmas holda
          oldindan yuklanib turadi — aks holda foydalanuvchi "Manzil"ga
          kirganda WebView noldan ishga tushib, sezilarli kutish bo'lardi. */}
      <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} pointerEvents="none">
        <LocationMapPicker height={1} showExpand={false} />
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomSpace }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Klaviatura va maydon orasidagi zaxira masofa. Kutubxona ekran balandligini tizim panellarisiz
        // hisoblagani uchun Android'da maydonni yetarlicha ko'tarmay qo'yadi (maydon klaviatura tagida
        // qoladi) — zaxira pastki tizim paneli balandligiga qarab oshiriladi.
        bottomOffset={96 + insets.bottom}
        // "layout": klaviatura balandligicha bo'sh joy (spacer) qo'shiladi — Android'da skroll doim ishlaydi.
        // Standart "insets" rejimi (1.21+) ClippingScrollView ishlatadi va ayrim qurilmalarda skrollni buzadi.
        mode="layout"
      >
        {!!onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            style={[s.back, { backgroundColor: t.card, borderColor: t.border }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={t.text} />
          </TouchableOpacity>
        )}
        <Text style={[s.title, { color: t.text }]}>{tr('newOrder.headerTitle')}</Text>
        <Text style={[s.subtitle, { color: t.muted }]}>{tr('newOrder.headerSubtitle')}</Text>

        {draft.restored && !!onRestartDraft && (
          <View style={[s.draft, { backgroundColor: t.card, borderColor: t.border }]}>
            <MaterialCommunityIcons name="content-save-check-outline" size={18} color={t.orange} />
            <Text style={[s.draftText, { color: t.muted }]}>{tr('newOrder.draftRestored')}</Text>
            <TouchableOpacity
              onPress={restartDraft}
              activeOpacity={0.8}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={[s.draftBtn, { color: t.orange }]}>{tr('newOrder.draftRestart')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TargetWorkerCard orderWorker={orderWorker} setOrderWorker={setOrderWorker} />

        {signedIn && <CompanySiteSection siteId={orgSiteId} onSelect={handleSiteSelect} />}

        {/* Tartib saytdagi (dev.harna.uz/buyurtma) bilan bir xil:
            1) tafsilotlar — tavsif, narx, sana, rasm;
            2) manzil va aloqa — manzil, telefon;
            3) qo'shimcha — xizmat turi, zaxira telefon,
               necha kishi, talablar. */}
        <StepHeader no={1} title={tr('newOrder.step1Title')} />
        <View onLayout={trackSection('newOrder.descriptionLabel')}>
          <DescriptionSection description={description} setDescription={setDescription} />
          {suggested && !categoryIds.includes(suggested.id) && (
            <CategorySuggestChip
              name={suggested.name}
              blocked={!suggestedOpens && !fitsPicks(suggested.id, categoryIds, categoryById)}
              full={!suggestedOpens && categoryIds.length >= MAX_CATEGORIES}
              onPress={takeSuggestion}
            />
          )}
        </View>
        <View onLayout={trackSection('newOrder.pricingLabel')}>
          <PricingSection
            pricingType={pricingType}
            setPricingType={setPricingType}
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
            estimatedHours={estimatedHours}
            setEstimatedHours={setEstimatedHours}
            fixedPrice={fixedPrice}
            setFixedPrice={setFixedPrice}
            priceMissing={!priceReady}
            quote={quote}
          />
        </View>
        <View onLayout={trackSection('newOrder.whenLabel')}>
          <WhenSection
            when={when}
            setWhen={setWhen}
            whenDate={whenDate}
            setWhenDate={setWhenDate}
            workerId={orderWorker?.id}
            windowDay={windowDay}
            whenWindow={whenWindow}
            setWhenWindow={setWindowPick}
            timing={timing}
          />
        </View>
        <PhotosSection
          photos={photos}
          keptPhotos={keptPhotos}
          removeKept={removeKept}
          pickPhotos={pickPhotos}
          removePhoto={removePhoto}
          setPreviewIndex={setPreviewIndex}
        />

        <StepHeader no={2} title={tr('newOrder.step2Title')} />
        <View onLayout={trackSection('newOrder.locationLabel')}>
          <AddressSection
            hasAddress={hasAddress}
            setAddressModalOpen={setAddressModalOpen}
            addressTitle={addressTitle}
            addressSubtitle={addressSubtitle}
            savedAddress={savedAddress}
            onUseSaved={applySavedAddress}
            onDismissSaved={() => setSavedDismissed(true)}
          />
        </View>
        <View onLayout={trackSection('newOrder.phoneLabel')}>
          <ContactSection phone={phone} setPhone={setPhone} />
        </View>

        {/* Ixtiyoriy maydonlar yig'ilgan holda turadi */}
        <ExtraSection no={3} filled={extraFilled}>
          <CategorySection
            selectedCategories={selectedCategories}
            toggleCategory={toggleCategory}
            setCategoryPickerOpen={setCategoryPickerOpen}
          />
          <BackupPhoneSection backupPhone={backupPhone} setBackupPhone={setBackupPhone} />
          <WorkerCountSection workerCount={workerCount} setWorkerCount={setWorkerCount} />
          <RequirementsSection
            targeted={!!orderWorker}
            requirePhoto={requirePhoto}
            setRequirePhoto={setRequirePhoto}
            requireVerified={requireVerified}
            setRequireVerified={setRequireVerified}
            minRating={minRating}
            setMinRating={setMinRating}
            minExperience={minExperience}
            setMinExperience={setMinExperience}
            extraRequirements={extraRequirements}
            setExtraRequirements={setExtraRequirements}
          />
        </ExtraSection>

        <OrderProgressCard missing={missing} onItemPress={scrollToSection} />

        <SubmitButton ready={ready} missing={missing} onPress={openReview} />
      </KeyboardAwareScrollView>

      <CategoryPickerModal
        key={pickerFocus.key}
        initialParentId={pickerFocus.parentId}
        visible={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        categories={categoryTree}
        selectedIds={categoryIds}
        onToggle={toggleCategory}
        fits={(id) => fitsPicks(id, categoryIds, categoryById)}
        t={t}
        tr={tr}
      />

      <AddressModal
        visible={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        regions={regions}
        regionId={regionId}
        onSelectRegion={setRegionId}
        districts={districts}
        districtId={districtId}
        onSelectDistrict={setDistrictId}
        street={street}
        onStreetChange={setStreet}
        mahalla={mahalla}
        onMahallaChange={setMahalla}
        entrance={entrance}
        onEntranceChange={setEntrance}
        floor={floor}
        onFloorChange={setFloor}
        gpsLat={gpsLat}
        gpsLng={gpsLng}
        onMapChange={handleMapChange}
        t={t}
        tr={tr}
      />

      <ReviewModal
        {...form}
        visible={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onConfirm={handleSubmit}
        submitting={submitting}
        depositNeed={depositNeed}
        t={t}
        tr={tr}
        selectedCategories={selectedCategories}
        addressTitle={addressTitle}
        addressSubtitle={addressSubtitle}
        photos={[...keptPhotos, ...photos]}
      />

      <PhotoPreviewModal
        photos={[...keptPhotos, ...photos]}
        previewIndex={previewIndex}
        setPreviewIndex={setPreviewIndex}
      />

      {guest && (
        <Modal
          visible={authOpen}
          animationType="slide"
          onRequestClose={() => setAuthOpen(false)}
          statusBarTranslucent
        >
          <LoginScreen
            guestOrder
            initialPhone={phone.replace(/D/g, '').slice(-9)}
            onBack={() => setAuthOpen(false)}
            onLoginSuccess={handleGuestLogin}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  draft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  draftText: { flex: 1, fontSize: 12.5 },
  draftBtn: { fontSize: 12.5, fontWeight: '700' },
  title: { fontWeight: '800', fontSize: 22, marginTop: 6 },
  subtitle: { fontSize: 13.5, lineHeight: 19, marginTop: 6, marginBottom: 20 },
});

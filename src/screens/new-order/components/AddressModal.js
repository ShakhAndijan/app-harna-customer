import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  PanResponder,
  Animated,
  Keyboard,
  LayoutAnimation,
  Platform,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardProvider,
  KeyboardStickyView,
  useKeyboardState,
} from 'react-native-keyboard-controller';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import LocationMapPicker from '../../../components/LocationMapPicker';
import { common } from '../styles';
import SelectField from './SelectField';
import OptionSheet from './OptionSheet';
import useAddressMapSync from '../hooks/useAddressMapSync';

function AddressModalContent({
  visible,
  onClose,
  regions,
  regionId,
  onSelectRegion,
  districts,
  districtId,
  onSelectDistrict,
  street,
  onStreetChange,
  mahalla,
  onMahallaChange,
  entrance,
  onEntranceChange,
  floor,
  onFloorChange,
  gpsLat,
  gpsLng,
  onMapChange,
  t,
  tr,
  // Ixtiyoriy: "Mening manzillarim" ekrani uchun.
  title,
  header,
  onSave,
  hideUnitFields,
}) {
  const { height: screenH } = useWindowDimensions();
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [districtSheetOpen, setDistrictSheetOpen] = useState(false);
  // Boshida ixcham panel (xarita ko'proq ko'rinadi); manzil qatori bosilsa maydonlar ochiladi.
  const [expanded, setExpandedRaw] = useState(false);
  // Panel silliq ochiladi/yopiladi (pastdan tepaga o'sadi).
  const setExpanded = useCallback((value) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRaw(value);
  }, []);

  // Panel tutqichi (tepadagi chiziqcha): panel barmoq ortidan siljiydi. Ochiq panel pastga tortilib
  // yetarlicha surilsa yopiladi; yopiq panel tepaga tortilsa ochiladi (u yerda faqat yengil "tortilish"
  // ko'rinadi, chunki panel hali o'sib ulgurmagan). Qisqa bosish holatni almashtiradi. Qo'yib
  // yuborilganda panel prujina bilan joyiga qaytadi.
  const dragY = useState(() => new Animated.Value(0))[0];
  // `expanded` o'zgarganda (faqat qo'yib yuborilganda) tutqich qayta yaratiladi — gesture o'rtasida emas.
  const handlePan = useMemo(() => {
    const settle = () =>
      Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 5 }).start();
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        if (expanded) dragY.setValue(Math.max(0, g.dy));
        else dragY.setValue(g.dy < 0 ? Math.max(g.dy * 0.4, -36) : Math.min(g.dy * 0.4, 24));
      },
      onPanResponderRelease: (_e, g) => {
        settle();
        if (!expanded && (g.dy < -30 || g.vy < -0.7)) setExpanded(true);
        else if (expanded && (g.dy > 60 || g.vy > 0.7)) setExpanded(false);
        else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) setExpanded(!expanded);
      },
      onPanResponderTerminate: settle,
    });
  }, [expanded, dragY, setExpanded]);
  const [sheetH, setSheetH] = useState(0);
  // Telefonning pastki tizim tugmalari (orqaga / uy) paneldagi tugmani yopib qo'ymasligi uchun.
  // Modal ichida Android'da inset ba'zan 0 qaytadi (Samsung 3 tugmali navigatsiya), shuning uchun zaxira bor.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 0);
  // 3D / kompas tugmalari status bar ostida qolmasligi uchun (xarita butun ekran).
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0
  );
  const kbVisible = useKeyboardState((st) => st.isVisible);
  const kbHeight = useKeyboardState((st) => st.height);
  // Klaviatura ochiq bo'lganda panel ko'tarilgani uchun maydonlar ro'yxati qisqartiriladi.
  const sheetMaxH = kbVisible ? Math.max(120, screenH - kbHeight - 250) : screenH * 0.46;
  // "Hozirgi joylashuv" tugmasi panel (va klaviatura) tepasida turadi.
  const controlsBottom = sheetH + 12 + (kbVisible ? kbHeight : 0);

  // Xarita hali ko'rinib tursin deb panel va uning ichidagi maydonlar
  // to'liq xira emas, biroz shaffof — "bilinar-bilinmas" fon.
  const sheetBg = t.isDark ? 'rgba(10,20,34,0.88)' : 'rgba(238,242,247,0.9)';
  const fieldBg = t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)';

  const selectedRegionName = regions.find((r) => r.id === regionId)?.name;
  const selectedDistrictName = districts.find((d) => d.id === districtId)?.name;
  const areaText = [selectedDistrictName, selectedRegionName].filter(Boolean).join(', ');

  const {
    panLat,
    panLng,
    panZoom,
    geocodeQuery,
    geocodeZoom,
    focusPoint,
    suggestions,
    noResults,
    isSearching,
    selectSuggestion,
    handleAddressResolved,
  } = useAddressMapSync({
    regions,
    regionId,
    selectedRegionName,
    selectedDistrictName,
    street,
    onStreetChange,
  });
  const showSuggestions = expanded && (suggestions.length > 0 || noResults || isSearching);

  return (
    <>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {/* ── Butun ekranni egallagan xarita ── */}
        <LocationMapPicker
          lat={gpsLat}
          lng={gpsLng}
          onChange={onMapChange}
          fill
          controlsBottom={controlsBottom}
          controlsTop={topInset + 12}
          showExpand={false}
          borderRadius={0}
          geocodeQuery={geocodeQuery}
          geocodeZoom={geocodeZoom}
          panLat={panLat}
          panLng={panLng}
          panZoom={panZoom}
          focusPoint={focusPoint}
          onAddressResolved={handleAddressResolved}
          autoLocate={!gpsLat}
          locateRound
          locateBg={t.card}
          locateColor={t.text}
          showTapHint
          tapHint={tr('newOrder.mapTapHint')}
          locateLabel={tr('newOrder.mapLocateLabel')}
          locatingLabel={tr('newOrder.mapLocating')}
          permissionTitle={tr('newOrder.locationPermissionTitle')}
          permissionMessage={tr('newOrder.locationPermissionMsg')}
          errorTitle={tr('common.errorTitle')}
          errorMessage={tr('newOrder.locationError')}
        />

        {/* ── "Orqaga" tugmasi: xaritaning pastki chap burchagida, panel tepasida ── */}
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={tr('common.back')}
          style={[s.backBtn, { backgroundColor: t.card, bottom: controlsBottom }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.text} />
        </TouchableOpacity>

        {/* ── Ko'cha yozilganda mos manzillar: tanlanmaguncha xarita siljimaydi ── */}
        {showSuggestions && (
          <View
            style={[
              s.suggestCard,
              { backgroundColor: t.card, borderColor: t.border, bottom: controlsBottom - 4 },
            ]}
          >
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  selectSuggestion(item);
                  Keyboard.dismiss();
                }}
                activeOpacity={0.7}
                style={[
                  s.suggestRow,
                  idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
                ]}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={22} color={t.orange} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.suggestTitle, { color: t.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!!item.subtitle && (
                    <Text style={[s.suggestSub, { color: t.muted }]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {suggestions.length === 0 && (
              <Text style={[s.suggestEmpty, { color: t.muted }]}>
                {isSearching ? tr('newOrder.addressSearching') : tr('newOrder.addressNoResults')}
              </Text>
            )}
          </View>
        )}

        {/* ── Sarlavha faqat ekran o'zi bergan bo'lsagina ("Mening manzillarim"da) ── */}
        {!!title && (
          <SafeAreaView edges={['top']} style={s.mapTopBar} pointerEvents="box-none">
            <View style={[s.mapTitlePill, { backgroundColor: t.card }]}>
              <Text style={[s.mapTitlePillTxt, { color: t.text }]}>{title}</Text>
            </View>
          </SafeAreaView>
        )}

        {/* ── Xaritaning pastki qismida suzuvchi panel: boshida ixcham, bosilsa maydonlar ochiladi ── */}
        <KeyboardStickyView style={s.bottomSheetWrap}>
          <Animated.View style={{ transform: [{ translateY: dragY }] }}>
            <View
              onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
              style={[
                s.bottomSheet,
                {
                  backgroundColor: sheetBg,
                  borderColor: t.border,
                  // Klaviatura ochiq bo'lsa tizim tugmalari ostida emas, qo'shimcha bo'sh joy shart emas
                  paddingBottom: kbVisible ? 16 : Math.max(bottomInset, 12) + 16,
                },
              ]}
            >
              <View style={s.sheetHandleWrap} {...handlePan.panHandlers}>
                <View style={[common.sheetHandle, { backgroundColor: t.border }]} />
              </View>

              {expanded ? (
                <>
                  <ScrollView
                    style={{ maxHeight: sheetMaxH }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={[s.mapHint, { color: t.faint }]}>{tr('newOrder.mapHint')}</Text>

                    <View style={{ gap: 14, marginTop: 10 }}>
                      {header}
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <SelectField
                            label={tr('newOrder.regionLabel')}
                            value={selectedRegionName}
                            placeholder={tr('newOrder.regionPlaceholder')}
                            onPress={() => setRegionSheetOpen(true)}
                            t={t}
                            bg={fieldBg}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <SelectField
                            label={tr('newOrder.districtLabel')}
                            value={selectedDistrictName}
                            placeholder={
                              regionId
                                ? tr('newOrder.districtPlaceholder')
                                : tr('newOrder.regionPlaceholder')
                            }
                            onPress={() => setDistrictSheetOpen(true)}
                            t={t}
                            bg={fieldBg}
                            disabled={!regionId}
                          />
                        </View>
                      </View>

                      <TextInput
                        value={street}
                        onChangeText={onStreetChange}
                        placeholder={tr('newOrder.streetPlaceholder')}
                        placeholderTextColor={t.faint}
                        style={[
                          common.input,
                          { backgroundColor: fieldBg, borderColor: t.border, color: t.text },
                        ]}
                      />
                      {!!onMahallaChange && (
                        <TextInput
                          value={mahalla ?? ''}
                          onChangeText={onMahallaChange}
                          placeholder={tr('newOrder.mahallaPlaceholder')}
                          placeholderTextColor={t.faint}
                          style={[
                            common.input,
                            { backgroundColor: fieldBg, borderColor: t.border, color: t.text },
                          ]}
                        />
                      )}
                      {!hideUnitFields && (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TextInput
                            value={entrance}
                            onChangeText={onEntranceChange}
                            placeholder={tr('newOrder.entrancePlaceholder')}
                            placeholderTextColor={t.faint}
                            style={[
                              common.input,
                              {
                                flex: 1,
                                backgroundColor: fieldBg,
                                borderColor: t.border,
                                color: t.text,
                              },
                            ]}
                          />
                          <TextInput
                            value={floor}
                            onChangeText={onFloorChange}
                            placeholder={tr('newOrder.floorPlaceholder')}
                            placeholderTextColor={t.faint}
                            style={[
                              common.input,
                              {
                                flex: 1,
                                backgroundColor: fieldBg,
                                borderColor: t.border,
                                color: t.text,
                              },
                            ]}
                          />
                        </View>
                      )}

                      <View
                        style={[s.noteBox, { backgroundColor: fieldBg, borderColor: t.border }]}
                      >
                        <MaterialCommunityIcons
                          name="shield-check-outline"
                          size={16}
                          color={t.muted}
                        />
                        <Text style={[s.noteTxt, { color: t.muted }]}>
                          {tr('newOrder.addressAccuracyNote')}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                </>
              ) : (
                // Butun karta bitta bosiladigan maydon: ichidagi elementlar bosishni ushlab olmaydi
                // (`pointerEvents="none"`), shuning uchun kartaning istalgan joyiga bosilsa panel ochiladi.
                <Pressable
                  onPress={() => setExpanded(true)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    s.addressRow,
                    {
                      backgroundColor: fieldBg,
                      borderColor: t.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={s.addressRowInner} pointerEvents="none">
                    <View style={[s.addressIcon, { backgroundColor: t.orange + '1f' }]}>
                      <MaterialCommunityIcons name="map-marker" size={22} color={t.orange} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[s.addressTitle, { color: street?.trim() ? t.text : t.muted }]}
                        numberOfLines={1}
                      >
                        {street?.trim() || tr('newOrder.addressPickPlaceholder')}
                      </Text>
                      {!!areaText && (
                        <Text style={[s.addressSub, { color: t.muted }]} numberOfLines={1}>
                          {areaText}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons name="chevron-up" size={22} color={t.muted} />
                  </View>
                </Pressable>
              )}

              <TouchableOpacity
                onPress={onSave || onClose}
                activeOpacity={0.85}
                style={[common.modalDoneBtn, { backgroundColor: t.orange, marginTop: 14 }]}
              >
                <Text style={common.modalDoneTxt}>{tr('newOrder.addressSaveBtn')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardStickyView>
      </View>

      <OptionSheet
        visible={regionSheetOpen}
        onClose={() => setRegionSheetOpen(false)}
        title={tr('newOrder.regionLabel')}
        options={regions}
        selectedId={regionId}
        onSelect={onSelectRegion}
        t={t}
        tr={tr}
      />
      <OptionSheet
        visible={districtSheetOpen}
        onClose={() => setDistrictSheetOpen(false)}
        title={tr('newOrder.districtLabel')}
        options={districts}
        selectedId={districtId}
        onSelect={onSelectDistrict}
        t={t}
        tr={tr}
      />
    </>
  );
}

// Android'da Modal alohida oyna bo'lgani uchun klaviatura hodisalari uning ichida alohida
// KeyboardProvider orqali olinadi.
export default function AddressModal(props) {
  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      onRequestClose={props.onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
          <AddressModalContent {...props} />
        </KeyboardProvider>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  mapTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  mapTitlePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  mapTitlePillTxt: { fontSize: 14, fontWeight: '700' },
  addressRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
  },
  suggestCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  suggestTitle: { fontSize: 15, fontWeight: '700' },
  suggestSub: { fontSize: 12.5, marginTop: 1 },
  suggestEmpty: { fontSize: 13, lineHeight: 18, paddingVertical: 14, paddingHorizontal: 16 },
  addressRowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTitle: { fontSize: 16, fontWeight: '800' },
  addressSub: { fontSize: 12.5, marginTop: 2 },
  bottomSheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 18,
  },
  // Tutqich atrofi kattaroq — barmoq bilan ushlash oson bo'lishi uchun.
  sheetHandleWrap: { paddingTop: 8, paddingBottom: 16, marginTop: -4, alignItems: 'center' },
  mapHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  noteTxt: { flex: 1, fontSize: 12, lineHeight: 17 },
});

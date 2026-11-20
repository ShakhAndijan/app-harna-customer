import { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { appAlert, appConfirm } from '../../../components/AppAlert';
import LocationMapPicker from '../../../components/LocationMapPicker';
import { useLanguage } from '../../../context/LanguageContext';
import { askLocation } from '../../../utils/permissions';
import { useTheme } from '../../../context/ThemeContext';
import { setOrderLocation } from '../../../api/orders';
import { ApiError } from '../../../utils/request';
import { getErrorMessage } from '../../../utils/errors';
import { usePinAsked } from '../../../utils/realtime';

// Telefon o'zini topishi uchun beriladigan vaqt.
const LOCATE_MS = 30000;

// Buyurtma pini (13.11): usta mijozni topishi va «Yetib keldim» ishlashi uchun manzil nuqtasi.
// Qabul qilingan yoki jarayondagi buyurtmada nuqta yo'q va usta hali yetib kelmagan bo'lsa chiqadi.
// Ikki yo'l: telefonning joylashuvi («Hozir ish manzilidamisiz?» deb so'ralgach) yoki xaritadan tanlash.
// Usta nuqtani so'ragan bo'lsa (`asked`: bildirishnomadan yoki jonli kanaldan) karta yorqin turadi.
// Usta yetib kelgach nuqta qulflanadi (409 `location_locked`) va karta yo'qoladi.
export default function OrderPinCard({ order, asked = false, onChanged }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [busy, setBusy] = useState(null);
  const [problem, setProblem] = useState('');
  const [picker, setPicker] = useState(false);
  const askedLive = usePinAsked(order.id);

  const hasPin = order.gpsLat != null && order.gpsLng != null;
  const open = order.rawStatus === 'accepted' || order.rawStatus === 'active';
  if (!open || hasPin || order.workerArrivedAt) return null;
  const lit = asked || askedLive;

  const store = async (lat, lng) => {
    setBusy('pin');
    setProblem('');
    try {
      await setOrderLocation(order.id, lat, lng);
      appAlert(tr('arrivalPin.pinSaved'));
      onChanged?.();
    } catch (e) {
      setProblem(getErrorMessage(e, tr, 'newOrder.locationError'));
      // Usta yetib kelgan yoki buyurtma yopilgan: hozirgi holat qayta o'qiladi.
      if (
        e instanceof ApiError &&
        (e.code === 'location_locked' || e.code === 'order_already_finalized')
      ) {
        onChanged?.();
      }
    } finally {
      setBusy(null);
    }
  };

  // Telefonning hozirgi joylashuvi; ruxsat bo'lmasa yoki aniqlanmasa sababi aytiladi.
  const locate = async () => {
    setBusy('locate');
    setProblem('');
    let timer;
    try {
      // Tizim so'rovidan oldin sabab aytiladi; tugma bosilgan (`again`), shuning uchun avvalgi "Keyinroq" hisobga olinmaydi.
      const granted = await askLocation(tr, 'pin', { again: true });
      if (granted !== true) {
        if (granted === false) setProblem(tr('arrivalPin.locationOff'));
        return null;
      }
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('location_timeout')), LOCATE_MS);
        }),
      ]);
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch {
      setProblem(tr('newOrder.locationError'));
      return null;
    } finally {
      clearTimeout(timer);
      setBusy(null);
    }
  };

  const sendMine = () =>
    appConfirm({
      title: tr('arrivalPin.hereTitle'),
      message: tr('arrivalPin.hereBody'),
      confirmLabel: tr('arrivalPin.hereOk'),
      onConfirm: async () => {
        const point = await locate();
        if (point) await store(point.lat, point.lng);
      },
    });

  const working = busy != null;
  return (
    <View
      style={[
        s.card,
        lit
          ? { backgroundColor: t.gold + '1f', borderColor: t.gold + '88' }
          : { backgroundColor: t.card, borderColor: t.border },
      ]}
    >
      <View style={s.head}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={22} color={t.orange} />
        <Text style={[s.title, { color: t.text }]}>{tr('arrivalPin.pinTitle')}</Text>
      </View>
      {!!problem && <Text style={[s.error, { color: t.red }]}>{problem}</Text>}

      <TouchableOpacity
        style={[s.btn, { backgroundColor: t.orange, opacity: working ? 0.6 : 1 }]}
        activeOpacity={0.85}
        disabled={working}
        onPress={sendMine}
        accessibilityRole="button"
      >
        {busy === 'locate' || busy === 'pin' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnText}>{tr('arrivalPin.pinSend')}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.btn, { borderWidth: 1.5, borderColor: t.border, opacity: working ? 0.6 : 1 }]}
        activeOpacity={0.85}
        disabled={working}
        onPress={() => setPicker(true)}
        accessibilityRole="button"
      >
        <Text style={[s.btnText, { color: t.text }]}>{tr('arrivalPin.pinPick')}</Text>
      </TouchableOpacity>

      <Modal
        visible={picker}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPicker(false)}
      >
        <SafeAreaProvider style={{ flex: 1 }}>
          <PinPicker
            address={order.address}
            busy={busy === 'pin'}
            onClose={() => setPicker(false)}
            onDone={async (point) => {
              setPicker(false);
              await store(point.lat, point.lng);
            }}
          />
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}

// Butun ekran xarita: nuqta bosib tanlanadi, pastdagi tugma uni yuboradi. Xarita buyurtma manzili
// (viloyat, tuman…) bo'yicha ochiladi.
function PinPicker({ address, busy, onClose, onDone }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const insets = useSafeAreaInsets();
  const [point, setPoint] = useState(null);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LocationMapPicker
        lat={null}
        lng={null}
        onChange={(lat, lng) => setPoint({ lat: Number(lat), lng: Number(lng) })}
        fill
        controlsBottom={insets.bottom + 84}
        controlsTop={insets.top + 12}
        showExpand={false}
        borderRadius={0}
        geocodeQuery={address || undefined}
        geocodeZoom={13}
        locateRound
        locateBg={t.card}
        locateColor={t.text}
        showTapHint
        tapHint={tr('newOrder.mapTapHint')}
        locateLabel={tr('newOrder.mapLocateLabel')}
        locatingLabel={tr('arrivalPin.locating')}
        permissionTitle={tr('newOrder.locationPermissionTitle')}
        permissionMessage={tr('newOrder.locationPermissionMsg')}
        errorTitle={tr('common.errorTitle')}
        errorMessage={tr('newOrder.locationError')}
      />
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={tr('common.back')}
        style={[s.back, { backgroundColor: t.card, top: insets.top + 12 }]}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={t.text} />
      </TouchableOpacity>
      <View style={[s.foot, { paddingBottom: 14 + insets.bottom }]}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: t.orange, opacity: !point || busy ? 0.5 : 1 }]}
          activeOpacity={0.85}
          disabled={!point || busy}
          onPress={() => point && onDone(point)}
          accessibilityRole="button"
        >
          <Text style={s.btnText}>{tr('arrivalPin.pinDone')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 14.5, fontWeight: '800', lineHeight: 20 },
  error: { fontSize: 13, fontWeight: '600' },
  btn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  back: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  foot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

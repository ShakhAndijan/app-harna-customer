import { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { appAlert } from './AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { COLORS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { YANDEX_MAPS_API_KEY, YANDEX_GEOCODER_API_KEY } from '../constants/config';
import { devLog } from '../utils/log';
import { forwardGeocode, normalizeApostrophes } from '../utils/addressSearch';

// Yandex API kaliti "harna.uz" domeniga bog'lab yaratilgan, lekin WebView xarita
// HTML'ni to'g'ridan-to'g'ri matn sifatida (haqiqiy domensiz) yuklaydi —
// shuning uchun geokoder so'rovlari "scriptError" bilan rad etilishi mumkin.
// `baseUrl` WebView'ga shu domenni "sahifa manbai" sifatida beradi.
const MAP_BASE_URL = 'https://dev.harna.uz/';

const buildMapHtml = (initLat, initLng) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
  </style>
  <script src="https://api-maps.yandex.ru/v3/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU"></script>
</head>
<body>
<div id="map"></div>
<script>
  var myMap = null;
  var placemark = null;
  var C = null; // ymaps3 asosiy sinflari

  // Belgi (SVG): yumaloq kvadratda odamcha, pastida tayoqcha va halqa. Halqaning markazi — tanlangan nuqta.
  var PIN_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="92" viewBox="0 0 64 92">' +
    '<defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.28"/></filter></defs>' +
    '<g filter="url(#s)">' +
    '<rect x="4" y="4" width="56" height="56" rx="17" fill="#ffffff"/>' +
    '<rect x="8" y="8" width="48" height="48" rx="14" fill="#e87a45"/>' +
    '<g stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
    '<path d="M31 29 L31 40"/><path d="M31 40 L26 49"/><path d="M31 40 L36 49"/>' +
    '<path d="M31 32 L41 27"/><path d="M31 32 L23 37"/></g>' +
    '<circle cx="31" cy="22" r="5" fill="#ffffff"/>' +
    '<rect x="30.5" y="60" width="3" height="16" rx="1.5" fill="#2b2b2b"/>' +
    '<circle cx="32" cy="80" r="7" fill="#ffffff" stroke="#2b2b2b" stroke-width="3.5"/>' +
    '</g></svg>';
  var PIN_HREF = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PIN_SVG);

  // Geokodlash (manzil matnini topish) endi shu WebView ichida emas,
  // React Native tomonida (native fetch, CORS cheklovisiz) amalga oshiriladi —
  // WebView'ning brauzer konteksti Yandex'ning standalone Geocoder API'siga
  // cross-origin fetch yuborganda CORS bilan rad etilardi.
  function post(lat, lng, source) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      lat: lat.toFixed(6), lng: lng.toFixed(6), source: source || 'user'
    }));
  }

  // coords: [lat, lng]. v3 da koordinata tartibi [lng, lat]. Belgi DOM-marker: xarita burilganda ham tik turadi,
  // halqa markazi (64x92 rasmda 32,80) tanlangan nuqtaga to'g'ri keladi.
  function setPlacemark(coords) {
    var lngLat = [coords[1], coords[0]];
    if (placemark) {
      placemark.update({ coordinates: lngLat });
    } else {
      var el = document.createElement('div');
      el.style.cssText = 'transform:translate(-32px,-80px);pointer-events:none;width:64px;height:92px;';
      var img = document.createElement('img');
      img.src = PIN_HREF;
      img.width = 64;
      img.height = 92;
      img.style.cssText = 'display:block;pointer-events:none;';
      el.appendChild(img);
      placemark = new C.YMapMarker({ coordinates: lngLat }, el);
      myMap.addChild(placemark);
    }
  }

  // Pin faqat manzil (ko'cha/uy) matni haqiqatan topilib, formaga yozilgach
  // ko'rsatiladi — shuning uchun bu RN tomonidan aniq chaqiriladi, tegishli
  // koordinata post qilingandan va reverse-geokodlash tugagandan keyin.
  // Xarita (myMap) Yandex modullari yuklangach yaratiladi. Shundan oldin kelgan buyruqlar (masalan,
  // joylashuv sahifa yuklanishi bilan topilsa) yo'qolmasligi uchun navbatga qo'yiladi va xarita
  // yaratilgach tartib bilan bajariladi. (Oldin buyruq xarita yaratilmasdan bajarilib, xato berardi
  // va xarita standart markazda — Toshkentda — qolardi.)
  var queue = [];
  function whenMap(fn) {
    if (myMap) fn();
    else queue.push(fn);
  }

  function dropPin(lat, lng) {
    whenMap(function () { setPlacemark([lat, lng]); });
  }

  function goTo(lat, lng, zoom, source) {
    whenMap(function () {
      myMap.setLocation({ center: [lng, lat], zoom: zoom || 18 });
      post(lat, lng, source);
    });
  }

  // Faqat ko'rinishni suradi — pin/placemark qo'ymaydi. Viloyat/tuman
  // tanlangandagina xarita shu tomonga qaraydi, aniq nuqta hali belgilanmagan
  // bo'ladi — foydalanuvchi bosgandagina (yoki "hozirgi joylashuv"da) pin chiqadi.
  // Xarita hali tayyor bo'lmasa, tayyor bo'lgach nuqtaga o'tadi.
  function goToSafe(lat, lng, zoom) {
    goTo(lat, lng, zoom);
  }

  function panTo(lat, lng, zoom) {
    whenMap(function () { myMap.setLocation({ center: [lng, lat], zoom: zoom || 10 }); });
  }

  function panToSafe(lat, lng, zoom) {
    panTo(lat, lng, zoom);
  }

  // Ilova mavzusi o'zgarganda xarita ham almashadi (xarita yaratilmagan bo'lsa, yaratilganda window.__DARK o'qiladi).
  function setTheme(dark) {
    window.__DARK = !!dark;
    if (myMap) myMap.update({ theme: dark ? 'dark' : 'light' });
  }

  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]);
  }

  async function init() {
    await ymaps3.ready;
    C = ymaps3;
    ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', [
      '@yandex/ymaps3-default-ui-theme@0.0'
    ]);
    // Ikki barmoq bilan burish (pinchRotate) va yaqinlashtirish (pinchZoom) yoqilgan.
    myMap = new C.YMap(
      document.getElementById('map'),
      {
        location: { center: [69.2401, 41.2995], zoom: 12 },
        behaviors: ['drag', 'pinchZoom', 'pinchRotate', 'scrollZoom', 'dblClick'],
        theme: window.__DARK ? 'dark' : 'light'
      },
      [new C.YMapDefaultSchemeLayer({}), new C.YMapDefaultFeaturesLayer({})]
    );

    ${
      initLat && initLng
        ? `setPlacemark([${initLat}, ${initLng}]); myMap.setLocation({ center: [${initLng}, ${initLat}], zoom: 17 });`
        : ''
    }

    myMap.addChild(new C.YMapListener({
      layer: 'any',
      onClick: function (object, event) {
        var c = event && event.coordinates;
        if (c) post(c[1], c[0]);
      }
    }));

    var pending = queue;
    queue = [];
    pending.forEach(function (fn) { fn(); });

    // Zoom va kompas (shimolga qaytarish) tugmalari; yuklanmasa xarita baribir ishlaydi.
    try {
      var ui = await withTimeout(ymaps3.import('@yandex/ymaps3-default-ui-theme'), 8000);
      myMap.addChild(new C.YMapControls({ position: 'right' }, [new ui.YMapZoomControl({}), new ui.YMapRotateControl({})]));
    } catch (e) {}
  }
  init();
</script>
</body>
</html>`;

// Ikkalasi ham React Native'ning o'z `fetch`'i orqali (native tarmoq so'rovi,
// brauzer emas) chaqiriladi — shuning uchun CORS cheklovi umuman ishlamaydi.
// Geokoder o'zbek tilida (lotin) javob beradi — aks holda ko'cha nomlari ruscha (kirill) yoziladi.
// Uning "ʻ" belgilari ilovadagi oddiy apostrofga almashtiriladi ("ko'chasi").
async function reverseGeocodeAddress(lat, lng) {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_API_KEY}&format=json&lang=uz_UZ&geocode=${lng},${lat}`;
    const res = await fetch(url);
    const json = await res.json();
    const obj = json?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    if (!obj) return null;
    const meta = obj.metaDataProperty?.GeocoderMetaData || {};
    const addrComponents = meta.Address?.Components || [];
    const parts = {};
    addrComponents.forEach((c) => {
      parts[c.kind] = c.name;
    });
    return {
      addressResolved: true,
      addressLine: normalizeApostrophes(meta.text || obj.name),
      street: normalizeApostrophes(parts.street) || null,
      house: parts.house || null,
      district: normalizeApostrophes(parts.district) || null,
      locality: normalizeApostrophes(parts.locality) || null,
      area: normalizeApostrophes(parts.area) || null,
      province: normalizeApostrophes(parts.province) || null,
    };
  } catch {
    return null;
  }
}

// Joylashuvni aniqlashtirish sozlamalari.
const LOCATE_MAX_MS = 15000; // shundan keyin aniqlash to'xtatiladi
const LOCATE_GOOD_ACCURACY = 25; // metr: shu aniqlikka yetilsa darhol to'xtaydi
const LOCATE_WORST_ACCURACY = 2000; // metr: bundan taxminiyroq nuqta "joyingiz" sifatida ko'rsatilmaydi
const LOCATE_FALLBACK_MS = 10000; // aniq nuqta kelmasa: tarmoq orqali taxminiy nuqtani kutish vaqti
const LOCATE_MIN_GAIN = 15; // metr: xarita faqat aniqlik shuncha yaxshilansagina qayta suriladi

/**
 * Yandex Maps asosidagi joylashuv tanlash komponenti.
 * Xaritaga bosib yoki "hozirgi joylashuv" tugmasi orqali koordinata tanlanadi,
 * kengaytirish tugmasi xaritani butun ekranga ochadi.
 */
export default function LocationMapPicker({
  lat,
  lng,
  onChange,
  height = 220,
  fill = false,
  // Pastdagi tugmalar (joylashuv) xarita pastidan qancha yuqorida turishi; xarita ustida
  // panel bo'lsa, tugma panel ostida qolib ketmasligi uchun.
  controlsBottom = 10,
  showExpand = true,
  borderRadius = 18,
  geocodeQuery,
  geocodeZoom,
  panLat,
  panLng,
  panZoom,
  // Tanlangan taklif joyi: { lat, lng, zoom } — o'zgarganda xarita shu joyga o'tib, pin qo'yiladi.
  focusPoint,
  onAddressResolved,
  // true bo'lsa, xarita yuklangach hozirgi joylashuv o'zi tanlanadi (ruxsat berilmasa — indamay o'tkazib yuboriladi).
  autoLocate = false,
  // Yumaloq oq tugma (faqat belgi, yozuvsiz): `locateBg` — fon, `locateColor` — belgi rangi.
  locateRound = false,
  locateBg = '#ffffff',
  locateColor = '#1a1a1a',
  locateLabel,
  locatingLabel,
  tapHint,
  showTapHint = false,
  permissionTitle,
  permissionMessage,
  errorTitle,
  errorMessage,
}) {
  const webRef = useRef(null);
  const fullRef = useRef(null);
  const { theme } = useTheme();
  const isDark = !!theme?.isDark;
  // Sahifa yuklanishidan oldin mavzu beriladi; keyin o'zgarsa quyidagi effekt xaritalarga yuboradi.
  const themeJs = `window.__DARK=${isDark ? 'true' : 'false'};true;`;
  useEffect(() => {
    const js = `setTheme(${isDark ? 'true' : 'false'}); true;`;
    webRef.current?.injectJavaScript(js);
    fullRef.current?.injectJavaScript(js);
  }, [isDark]);
  const [locating, setLocating] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // HTML faqat bir marta quriladi (boshlang'ich nuqta bilan). `lat/lng` o'zgarganda qayta qurilsa WebView
  // butun xaritani (Yandex skripti bilan) qayta yuklardi: bu paytda xarita standart markazda (Toshkent)
  // ko'rinib, joylashuv "boshqa joyda" chiqardi. Keyingi nuqtalar `goTo`/`dropPin` orqali yuboriladi.
  const [mapHtml] = useState(() => buildMapHtml(lat, lng));

  const autoLocated = useRef(false);
  const geocodeSeq = useRef(0);
  // Xaritadagi nuqta (bosish / joylashuv / qidiruv) oxirgi marta qachon o'zgargani. Shundan keyin
  // avtomatik tanlangan viloyat/tuman xaritani uzoqqa qaytarib yubormasligi uchun ishlatiladi.
  const mapDrivenAt = useRef(0);
  const recentlyMapDriven = () => Date.now() - mapDrivenAt.current < 6000;

  // Joylashuvni aniqlashni to'xtatish (komponent yopilganda ham chaqiriladi).
  const stopLocateRef = useRef(null);
  useEffect(() => () => stopLocateRef.current?.(), []);

  // `silent` — avtomatik urinishda ruxsat berilmasa yoki xato bo'lsa oyna chiqarilmaydi.
  //
  // Aniqlik tartibi: avval (agar bor bo'lsa) yaqinda olingan ANIQ nuqta darhol ko'rsatiladi, so'ng GPS
  // (High) bilan yangilari kuzatiladi. Har bir nuqtaning `accuracy`si tekshiriladi: juda taxminiy nuqta
  // (Wi-Fi/uyali tarmoq xatosi) "joyingiz" deb ko'rsatilmaydi, aniqroq nuqta kelsa xarita qayta suriladi.
  const locate = async (ref, silent = false) => {
    stopLocateRef.current?.();
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!silent && permissionTitle) appAlert(permissionTitle, permissionMessage);
        return;
      }
      // Telefonda joylashuv (yoki Google "Location Accuracy") o'chiq bo'lsa, Android uni yoqish oynasini
      // ko'rsatadi. Oyna ochiq turganda aniqlash taymeri o'tib ketmasligi uchun avval shu oyna hal qilinadi;
      // rad etilsa ham davom etamiz (yoqilgan bo'lsa — faqat GPS bilan).
      let servicesOn = await Location.hasServicesEnabledAsync().catch(() => true);
      if (Platform.OS === 'android') {
        const provider = await Location.getProviderStatusAsync().catch(() => null);
        if (!servicesOn || (provider && !provider.networkAvailable)) {
          await Location.enableNetworkProviderAsync().catch(() => {});
          servicesOn = await Location.hasServicesEnabledAsync().catch(() => true);
        }
      }
      if (!servicesOn) {
        if (silent) return;
        throw new Error('services off');
      }

      let shown = null;
      const show = (coords) => {
        shown = coords;
        setLocating(false);
        ref.current?.injectJavaScript(`goToSafe(${coords.latitude}, ${coords.longitude}); true;`);
      };
      const accuracyOf = (coords) => coords.accuracy ?? Infinity;

      // 1) Yaqinda olingan va yetarlicha aniq nuqta bo'lsa — darhol (eskirgan/taxminiy nuqta olinmaydi).
      const last = await Location.getLastKnownPositionAsync({
        maxAge: 2 * 60 * 1000,
        requiredAccuracy: 150,
      }).catch(() => null);
      if (last) show(last.coords);

      // 2) GPS bilan aniqlashtirish: yaxshiroq nuqta kelgan sari xarita yangilanadi.
      await new Promise((resolve) => {
        let sub = null;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          sub?.remove();
          stopLocateRef.current = null;
          resolve();
        };
        const timer = setTimeout(finish, LOCATE_MAX_MS);
        stopLocateRef.current = finish;
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 0,
            mayShowUserSettingsDialog: false,
          },
          (pos) => {
            const acc = accuracyOf(pos.coords);
            if (
              acc <= LOCATE_WORST_ACCURACY &&
              (!shown || acc < accuracyOf(shown) - LOCATE_MIN_GAIN)
            ) {
              show(pos.coords);
            }
            if (acc <= LOCATE_GOOD_ACCURACY) finish();
          },
          finish
        )
          .then((s) => {
            sub = s;
            if (done) s.remove();
          })
          .catch(finish);
      });
      // 3) Aniq nuqta kelmadi (uyda GPS sekin, yoki faqat tarmoq nuqtasi bor): taxminiyroq nuqta olinadi —
      // foydalanuvchi xaritada o'zi surib to'g'rilashi mumkin. Avval tarmoq bilan, bo'lmasa oxirgi ma'lum nuqta.
      if (!shown) {
        const approx = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(
            () => null
          ),
          new Promise((resolve) => setTimeout(() => resolve(null), LOCATE_FALLBACK_MS)),
        ]);
        const fallback = approx ?? (await Location.getLastKnownPositionAsync().catch(() => null));
        if (fallback) show(fallback.coords);
      }
      if (!shown) throw new Error('no fix at all');
    } catch (err) {
      devLog('[LocationMapPicker] joylashuv aniqlanmadi:', err?.message);
      if (!silent && errorTitle) appAlert(errorTitle, errorMessage);
    } finally {
      setLocating(false);
    }
  };

  const handleLoadEnd = () => {
    if (!autoLocate || autoLocated.current) return;
    autoLocated.current = true;
    locate(webRef, true);
  };

  // Pin darhol emas — manzil (ko'cha/uy) matni topilib, formaga yozilgandan
  // keyingina ko'rsatiladi. `ref` orqali aniq shu WebView'ga (kichik yoki
  // to'liq ekran) `dropPin` buyrug'i yuboriladi.
  const makeOnMessage = (ref) => (e) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.debug) {
        devLog('[LocationMapPicker]', data.debug, data);
        return;
      }
      mapDrivenAt.current = Date.now();
      // Yozilgan ko'cha bo'yicha qidiruvdan kelgan nuqtada faqat koordinata saqlanadi: kiritilgan matn
      // ustidan yozilmaydi, viloyat/tuman ham o'zgartirilmaydi.
      const fromSearch = data.source === 'search';
      onChange?.(data.lat, data.lng, { fromSearch });
      if (fromSearch) return;
      const seq = ++geocodeSeq.current;
      reverseGeocodeAddress(data.lat, data.lng).then((resolved) => {
        if (seq !== geocodeSeq.current) return;
        if (resolved) onAddressResolved?.(resolved);
        ref.current?.injectJavaScript(`dropPin(${data.lat}, ${data.lng}); true;`);
      });
    } catch {}
  };

  // Viloyat/tuman tanlanganda WebView'ni qayta yuklamasdan, Yandex'ning o'z
  // geokoderi orqali shu manzilga markazni suradi (backend koordinata bermaydi).
  // Pin qo'yilmaydi — faqat ko'rinish suriladi.
  useEffect(() => {
    if (!geocodeQuery) return;
    let cancelled = false;
    forwardGeocode(geocodeQuery).then((coords) => {
      if (cancelled || !coords || recentlyMapDriven()) return;
      webRef.current?.injectJavaScript(
        `panTo(${coords.lat}, ${coords.lng}, ${geocodeZoom || 13}); true;`
      );
    });
    return () => {
      cancelled = true;
    };
  }, [geocodeQuery, geocodeZoom]);

  // Foydalanuvchi taklif ro'yxatidan manzil tanlaganda — xarita shu joyga o'tadi va pin darhol qo'yiladi.
  useEffect(() => {
    if (!focusPoint) return;
    const { lat: fLat, lng: fLng, zoom } = focusPoint;
    webRef.current?.injectJavaScript(
      `goTo(${fLat}, ${fLng}, ${zoom || 18}, 'search'); dropPin(${fLat}, ${fLng}); true;`
    );
  }, [focusPoint]);

  // Faqat ko'rinishni suradi, pin qo'ymaydi — viloyat/tuman tanlanganda
  // ishlatiladi (aniq zaxira koordinatalar bilan). Primitivlar orqali —
  // obyekt bo'lsa har renderda yangi reference hosil bo'lib, effekt
  // keraksiz qayta ishga tushib ketardi.
  useEffect(() => {
    if (panLat == null || panLng == null || recentlyMapDriven()) return;
    const js = `panToSafe(${panLat}, ${panLng}, ${panZoom || 10}); true;`;
    webRef.current?.injectJavaScript(js);
  }, [panLat, panLng, panZoom]);

  return (
    <>
      <View style={[styles.wrap, fill ? { flex: 1 } : { height }, { borderRadius }]}>
        <WebView
          ref={webRef}
          style={styles.map}
          source={{ html: mapHtml, baseUrl: MAP_BASE_URL }}
          injectedJavaScriptBeforeContentLoaded={themeJs}
          onMessage={makeOnMessage(webRef)}
          onLoadEnd={handleLoadEnd}
          javaScriptEnabled
          originWhitelist={['*']}
          scrollEnabled={false}
        />

        {showTapHint && !lat && (
          <View style={[styles.hintWrap, { bottom: controlsBottom + 42 }]} pointerEvents="none">
            <Text style={styles.tapHint}>{tapHint}</Text>
          </View>
        )}

        <View style={[styles.btnRow, { bottom: controlsBottom }]}>
          {showExpand && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFullscreen(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="expand" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={
              locateRound ? [styles.locateRound, { backgroundColor: locateBg }] : styles.locateBtn
            }
            onPress={() => locate(webRef)}
            activeOpacity={0.85}
            disabled={locating}
            accessibilityRole="button"
            accessibilityLabel={locateLabel}
          >
            {locating ? (
              <ActivityIndicator size="small" color={locateRound ? locateColor : '#fff'} />
            ) : locateRound ? (
              <Ionicons name="navigate-outline" size={26} color={locateColor} />
            ) : (
              <Ionicons name="navigate" size={15} color="#fff" />
            )}
            {!locateRound && !!locateLabel && (
              <Text style={styles.locateTxt}>{locating ? locatingLabel : locateLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={fullscreen} animationType="slide" onRequestClose={() => setFullscreen(false)}>
        <SafeAreaView style={styles.fullWrap} edges={['top', 'bottom']}>
          <WebView
            ref={fullRef}
            style={styles.fullMap}
            source={{ html: buildMapHtml(lat, lng), baseUrl: MAP_BASE_URL }}
            injectedJavaScriptBeforeContentLoaded={themeJs}
            onMessage={makeOnMessage(fullRef)}
            javaScriptEnabled
            originWhitelist={['*']}
          />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setFullscreen(false)}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.locateBtnFull}
            onPress={() => locate(fullRef)}
            activeOpacity={0.85}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="navigate" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: 'hidden', position: 'relative' },
  map: { flex: 1 },
  hintWrap: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHint: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  btnRow: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    left: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.orange,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    elevation: 4,
  },
  locateRound: {
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
  locateTxt: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
  fullWrap: { flex: 1, backgroundColor: '#000' },
  fullMap: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  locateBtnFull: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});

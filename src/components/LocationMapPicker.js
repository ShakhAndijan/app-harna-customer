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

// Yandex Maps JS API v3 (burish/qiyalatish ikki barmoq bilan). Kalit "harna.uz" domeniga bog'lab yaratilgan, lekin WebView xarita
// HTML'ni to'g'ridan-to'g'ri matn sifatida (haqiqiy domensiz) yuklaydi —
// shuning uchun geokoder so'rovlari "scriptError" bilan rad etilishi mumkin.
// `baseUrl` WebView'ga shu domenni "sahifa manbai" sifatida beradi.
const MAP_BASE_URL = 'https://dev.harna.uz/';

const buildMapHtml = (initLat, initLng, opts = {}) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width:100%; height:100%; overflow:hidden; }
    .fab {
      position:absolute; right:12px; width:42px; height:42px; border-radius:14px; background:#fff;
      box-shadow:0 2px 10px rgba(0,0,0,.25); display:flex; align-items:center; justify-content:center;
      z-index:10; font:700 24px/1 -apple-system, Roboto, sans-serif; color:#222; user-select:none;
    }
    #zin { top:50%; margin-top:-48px; }
    #zout { top:50%; margin-top:2px; }
    #t3d { top:${opts.top ?? 12}px; font-size:14px; }
    #t3d.on { background:#e87a45; color:#fff; }
    #compass { top:${(opts.top ?? 12) + 52}px; display:none; }
    @keyframes pdrop { 0% { transform:translateY(-70px) scale(.7); opacity:0; } 55% { transform:translateY(6px) scale(1.04); opacity:1; }
      75% { transform:translateY(-8px); } 100% { transform:translateY(0) scale(1); opacity:1; } }
    @keyframes pring { 0% { transform:scale(.4); opacity:.9; } 100% { transform:scale(3.2); opacity:0; } }
    .pinimg { animation:pdrop .55s cubic-bezier(.3,.7,.4,1); }
    .pring { position:absolute; left:-9px; top:-9px; width:18px; height:18px; border-radius:50%;
      background:rgba(232,122,69,.5); animation:pring 1.8s ease-out infinite; pointer-events:none; }
    .plabel { position:absolute; left:0; bottom:96px; transform:translateX(-50%); background:#fff; color:#222;
      width:max-content; max-width:230px; padding:7px 11px; border-radius:12px; box-shadow:0 3px 12px rgba(0,0,0,.3);
      font:600 13px/1.3 -apple-system, Roboto, sans-serif; text-align:center; pointer-events:none;
      animation:plrise .2s ease-out; }
    .plabel::after { content:''; position:absolute; left:50%; bottom:-5px; margin-left:-5px; width:10px; height:10px;
      background:inherit; transform:rotate(45deg); }
    body.dark .plabel { background:#2a2a2e; color:#f2f2f2; }
    @keyframes plrise { from { opacity:0; margin-bottom:-6px; } to { opacity:1; margin-bottom:0; } }
  </style>
  <script src="https://api-maps.yandex.ru/v3/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU"></script>
</head>
<body>
<div id="map"></div>
<div id="t3d" class="fab" onclick="toggle3d()">3D</div>
<div id="compass" class="fab" onclick="resetNorth()">
  <svg id="needle" width="26" height="26" viewBox="0 0 26 26">
    <path d="M13 2 L18 13 L13 11 L8 13 Z" fill="#e53935"/>
    <path d="M13 24 L18 13 L13 15 L8 13 Z" fill="#9e9e9e"/>
  </svg>
</div>
<div id="zin" class="fab" onclick="zoomBy(1)">+</div>
<div id="zout" class="fab" onclick="zoomBy(-1)">&minus;</div>
<script>
  var map = null;
  var marker = null;
  var queue = [];

  // Belgi (SVG): yumaloq kvadratda odamcha, pastida tayoqcha va halqa. Halqaning markazi — tanlangan nuqta.
  var PIN_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="92" viewBox="0 0 64 92">' +
    '<defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.28"/></filter></defs>' +
    '<g filter="url(#s)">' +
    '<circle cx="32" cy="32" r="28" fill="#ffffff"/>' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a06b"/><stop offset="1" stop-color="#e0622a"/></linearGradient></defs>' +
    '<clipPath id="c"><circle cx="32" cy="32" r="24"/></clipPath><circle cx="32" cy="32" r="24" fill="url(#g)"/>' +
    '<circle cx="32" cy="25" r="8.5" fill="#ffffff"/>' +
    '<path d="M15.5 50 C15.5 40.5 22.5 36.5 32 36.5 C41.5 36.5 48.5 40.5 48.5 50 C48.5 54 46 56 32 56 C18 56 15.5 54 15.5 50 Z" fill="#ffffff" clip-path="url(#c)"/>' +
    '<rect x="30.5" y="60" width="3" height="16" rx="1.5" fill="#2b2b2b"/>' +
    '<circle cx="32" cy="80" r="7" fill="#ffffff" stroke="#2b2b2b" stroke-width="3.5"/>' +
    '</g></svg>';
  var PIN_HREF = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PIN_SVG);

  // Geokodlash (manzil matnini topish) shu WebView ichida emas, React Native tomonida
  // (native fetch, CORS cheklovisiz) amalga oshiriladi.
  function post(lat, lng, source) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      lat: lat.toFixed(6), lng: lng.toFixed(6), source: source || 'user'
    }));
  }

  // Xarita Yandex modullari yuklangach yaratiladi. Shundan oldin kelgan buyruqlar yo'qolmasligi uchun
  // navbatga qo'yiladi va xarita yaratilgach tartib bilan bajariladi.
  function whenMap(fn) {
    if (map) fn();
    else queue.push(fn);
  }

  // Yandex JS API v3: koordinatalar [lng, lat] tartibida.
  var pinLat = null, pinLng = null, pinImg = null, labelEl = null, pinWrap = null;
  var areaKm = ${opts.radiusKm > 0 ? Number(opts.radiusKm) : 0};
  var labelText = ${JSON.stringify(opts.label || '')};
  var areaFeature = null, schemeLayer = null, is3d = false;
  var darkNow = ${opts.dark ? 'true' : 'false'};
  if (darkNow) document.body.className = 'dark';

  // Ish hududi: pin atrofida radius (km) bo'yicha shaffof doira.
  function updateArea() {
    if (!map) return;
    if (areaFeature) { map.removeChild(areaFeature); areaFeature = null; }
    if (!(areaKm > 0) || pinLat == null) return;
    var ring = [];
    var dLat = areaKm / 111.32;
    var dLon = areaKm / (111.32 * Math.cos(pinLat * Math.PI / 180));
    for (var i = 0; i <= 64; i++) {
      var a = (i / 64) * 2 * Math.PI;
      ring.push([pinLng + dLon * Math.cos(a), pinLat + dLat * Math.sin(a)]);
    }
    areaFeature = new ymaps3.YMapFeature({
      geometry: { type: 'Polygon', coordinates: [ring] },
      style: { fill: 'rgba(232,122,69,0.16)', stroke: [{ color: '#e87a45', width: 2, dash: [6, 4] }] }
    });
    map.addChild(areaFeature);
    // Doira butunlay ko'rinishi uchun kerak bo'lsa xarita uzoqlashtiriladi (yaqinlashtirilmaydi).
    var px = Math.min(window.innerWidth, window.innerHeight) || 360;
    var fitZ = Math.log2((156543.03 * Math.cos(pinLat * Math.PI / 180) * px) / (areaKm * 1000 * 2 * 1.2));
    if (map.zoom > fitZ) map.setLocation({ center: [pinLng, pinLat], zoom: Math.max(3, fitZ), duration: 400 });
  }

  function setRadius(km) {
    areaKm = Number(km) || 0;
    whenMap(updateArea);
  }

  // Pin ustidagi manzil yozuvi.
  function renderLabel() {
    if (!pinWrap) return;
    if (labelEl) { labelEl.remove(); labelEl = null; }
    if (!labelText) return;
    labelEl = document.createElement('div');
    labelEl.className = 'plabel';
    labelEl.textContent = labelText;
    pinWrap.appendChild(labelEl);
  }

  function setLabel(t) {
    labelText = t || '';
    renderLabel();
  }

  function setTheme(dark) {
    darkNow = !!dark;
    document.body.className = darkNow ? 'dark' : '';
    if (!map) return;
    if (schemeLayer) map.removeChild(schemeLayer);
    schemeLayer = new ymaps3.YMapDefaultSchemeLayer({ theme: darkNow ? 'dark' : 'light' });
    map.addChild(schemeLayer);
  }

  // 3D rejim: xarita qiyalanadi, binolar hajmli ko'rinadi.
  function toggle3d() {
    if (!map) return;
    is3d = !is3d;
    document.getElementById('t3d').className = is3d ? 'fab on' : 'fab';
    if (is3d) {
      map.setLocation({ zoom: Math.max(map.zoom, 17), duration: 500 });
      map.setCamera({ tilt: 0.9, duration: 500 });
    } else {
      map.setCamera({ tilt: 0, azimuth: 0, duration: 400 });
    }
  }

  function setPlacemark(lat, lng) {
    pinLat = lat; pinLng = lng;
    if (marker) {
      marker.update({ coordinates: [lng, lat] });
      // Pin har safar yangi joyga "tushgandek" animatsiya qiladi.
      if (pinImg) { pinImg.classList.remove('pinimg'); void pinImg.offsetWidth; pinImg.classList.add('pinimg'); }
      updateArea();
      return;
    }
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:0;height:0;';
    var ring = document.createElement('div');
    ring.className = 'pring';
    wrap.appendChild(ring);
    var img = document.createElement('img');
    img.src = PIN_HREF;
    img.className = 'pinimg';
    img.style.cssText = 'position:absolute;left:-32px;top:-80px;width:64px;height:92px;pointer-events:none;';
    wrap.appendChild(img);
    pinImg = img;
    pinWrap = wrap;
    marker = new ymaps3.YMapMarker({ coordinates: [lng, lat], zIndex: 100 }, wrap);
    map.addChild(marker);
    renderLabel();
    updateArea();
  }

  // Pin faqat manzil (ko'cha/uy) matni haqiqatan topilib, formaga yozilgach ko'rsatiladi —
  // shuning uchun bu RN tomonidan aniq chaqiriladi.
  function dropPin(lat, lng) {
    whenMap(function () { setPlacemark(lat, lng); });
  }

  function goTo(lat, lng, zoom, source) {
    whenMap(function () {
      map.setLocation({ center: [lng, lat], zoom: zoom || 18, duration: 300 });
      post(lat, lng, source);
    });
  }

  function goToSafe(lat, lng, zoom) {
    goTo(lat, lng, zoom);
  }

  // Faqat ko'rinishni suradi — pin qo'ymaydi.
  function panTo(lat, lng, zoom) {
    whenMap(function () { map.setLocation({ center: [lng, lat], zoom: zoom || 10, duration: 300 }); });
  }

  function panToSafe(lat, lng, zoom) {
    panTo(lat, lng, zoom);
  }

  function zoomBy(d) {
    if (!map) return;
    map.setLocation({ zoom: Math.max(2, Math.min(21, map.zoom + d)), duration: 200 });
  }

  // Xarita burilgan bo'lsa shimol tomonga qaytaradi.
  function resetNorth() {
    if (!map) return;
    map.setCamera({ azimuth: 0, tilt: 0, duration: 300 });
  }

  function onCamera(camera) {
    var az = (camera && camera.azimuth) || 0;
    var tl = (camera && camera.tilt) || 0;
    var box = document.getElementById('compass');
    box.style.display = (Math.abs(az) > 0.02 || Math.abs(tl) > 0.02) ? 'flex' : 'none';
    document.getElementById('needle').style.transform = 'rotate(' + (-az) + 'rad)';
  }

  (async function () {
    if (!window.ymaps3) return;
    await ymaps3.ready;
    var m = ymaps3;
    var hasInit = ${initLat && initLng ? 'true' : 'false'};
    map = new m.YMap(document.getElementById('map'), {
      location: {
        center: hasInit ? [${initLng || 0}, ${initLat || 0}] : [69.2401, 41.2995],
        zoom: hasInit ? 17 : 12
      },
      // Ikki barmoq bilan burish (pinchRotate) va qiyalatish yoqilgan.
      behaviors: ['drag', 'scrollZoom', 'pinchZoom', 'dblClick', 'pinchRotate', 'mouseRotate', 'mouseTilt', 'oneFingerZoom', 'magnifier']
    });
    schemeLayer = new m.YMapDefaultSchemeLayer({ theme: darkNow ? 'dark' : 'light' });
    map.addChild(schemeLayer);
    map.addChild(new m.YMapDefaultFeaturesLayer({}));
    map.addChild(new m.YMapListener({
      layer: 'any',
      onClick: function (object, event) {
        var c = event && event.coordinates;
        if (c) post(c[1], c[0]);
      },
      onUpdate: function (p) { onCamera(p.camera); }
    }));

    if (hasInit) setPlacemark(${initLat || 0}, ${initLng || 0});

    var pending = queue;
    queue = [];
    pending.forEach(function (fn) { fn(); });
  })();
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
export { reverseGeocodeAddress };

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
  // Qorong'i xarita; ish radiusi (km) — pin atrofida doira; pinLabel — pin ustidagi manzil yozuvi;
  // controlsTop — o'ng tepadagi tugmalar uchun yuqori masofa (status bar ostida qolmasligi uchun).
  // `dark` berilmasa ilova mavzusiga (qorong'i/yorug') qarab tanlanadi.
  dark: darkProp,
  radiusKm = 0,
  pinLabel = '',
  controlsTop = 12,
}) {
  const webRef = useRef(null);
  const fullRef = useRef(null);
  const { theme } = useTheme();
  const dark = darkProp ?? !!theme?.isDark;
  const [locating, setLocating] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // HTML faqat bir marta quriladi (boshlang'ich nuqta bilan). `lat/lng` o'zgarganda qayta qurilsa WebView
  // butun xaritani (Yandex skripti bilan) qayta yuklardi: bu paytda xarita standart markazda (Toshkent)
  // ko'rinib, joylashuv "boshqa joyda" chiqardi. Keyingi nuqtalar `goTo`/`dropPin` orqali yuboriladi.
  const [mapHtml] = useState(() =>
    buildMapHtml(lat, lng, { dark, radiusKm, label: pinLabel, top: controlsTop })
  );

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

  // Mavzu, radius va manzil yozuvi o'zgarganda ochiq xaritalarga yuboriladi.
  useEffect(() => {
    const js = `setTheme(${dark ? 'true' : 'false'}); setRadius(${Number(radiusKm) || 0}); setLabel(${JSON.stringify(pinLabel || '')}); true;`;
    webRef.current?.injectJavaScript(js);
    fullRef.current?.injectJavaScript(js);
  }, [dark, radiusKm, pinLabel]);

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
            source={{
              html: buildMapHtml(lat, lng, { dark, radiusKm, label: pinLabel, top: 12 }),
              baseUrl: MAP_BASE_URL,
            }}
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

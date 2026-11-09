import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { YANDEX_MAPS_API_KEY } from '../../constants/config';

// Yandex API kaliti "harna.uz" domeniga bog'langan (LocationMapPicker bilan bir xil sabab).
const MAP_BASE_URL = 'https://dev.harna.uz/';

const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .pin { transform:translate(-50%,-50%); padding:8px; cursor:pointer; }
    .dot { width:18px; height:18px; border-radius:50%; background:#ff931e; border:3px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.45); }
    .dot { transition:transform .2s ease, background .2s ease; }
    .dot.sel { background:#ed4543; transform:scale(1.3); animation:selpulse 1.5s ease-out infinite; }
    .dot.drop { animation:drop .55s cubic-bezier(.3,1.6,.5,1) backwards; }
    @keyframes drop { 0% { transform:translateY(-28px) scale(.4); opacity:0; } 55% { opacity:1; } 100% { transform:none; opacity:1; } }
    @keyframes selpulse { 0% { box-shadow:0 0 0 0 rgba(237,69,67,.55), 0 1px 4px rgba(0,0,0,.45); } 100% { box-shadow:0 0 0 15px rgba(237,69,67,0), 0 1px 4px rgba(0,0,0,.45); } }
    .me { position:relative; transform:translate(-50%,-50%); width:18px; height:18px; }
    .me .pulse { position:absolute; left:0; top:0; width:100%; height:100%; border-radius:50%; background:rgba(30,152,255,.5); animation:pulse 2s ease-out infinite; }
    .me .core { position:absolute; left:0; top:0; width:100%; height:100%; border-radius:50%; background:#1e98ff; border:3px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.4); }
    .me .arrow { position:absolute; left:0; top:0; width:100%; height:100%; display:none; }
    .me .arrow:before { content:''; position:absolute; left:50%; top:-14px; margin-left:-7px; border:7px solid transparent; border-bottom:11px solid #1e98ff; border-top:0; }
    @keyframes pulse { 0% { transform:scale(1); opacity:.8; } 100% { transform:scale(3.6); opacity:0; } }
    .nrt { width:1px; height:1px; pointer-events:none; }
    .pop { transform:translate(-50%,calc(-100% - 22px)); width:210px; cursor:pointer; animation:popin .18s ease-out; }
    .pop .card { background:#fff; color:#1a1a1a; border-radius:14px; padding:10px 12px; box-shadow:0 4px 16px rgba(0,0,0,.28); font-family:sans-serif; }
    .pop .tail { width:14px; height:14px; background:#fff; transform:rotate(45deg); margin:-7px auto 0; box-shadow:3px 3px 6px rgba(0,0,0,.15); }
    .pop .nm { font-weight:700; font-size:14px; line-height:1.25; }
    .pop .rl { font-size:12px; color:#777; margin-top:2px; }
    .pop .mt { display:flex; gap:10px; align-items:center; margin-top:6px; font-size:13px; }
    .pop .rt { color:#e8890c; font-weight:700; }
    .pop .pr { font-weight:600; }
    .pop .go { margin-top:8px; background:#ff931e; color:#fff; text-align:center; font-weight:700; font-size:13px; border-radius:9px; padding:7px 0; }
    body.dark .pop .card { background:#232733; color:#f2f2f2; }
    body.dark .pop .tail { background:#232733; }
    body.dark .pop .rl { color:#9aa0ad; }
    @keyframes popin { from { opacity:0; margin-top:8px; } to { opacity:1; margin-top:0; } }
    .bubble { transform:translate(-50%,-50%); background:#ff931e; color:#fff; font:700 13px sans-serif; border-radius:16px; padding:5px 11px; border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.4); cursor:pointer; white-space:nowrap; }
    .cl { transform:translate(-50%,-50%); width:38px; height:38px; border-radius:50%; background:#ff931e; color:#fff; font:700 14px sans-serif; border:3px solid #fff; box-shadow:0 1px 5px rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; cursor:pointer; }
  </style>
  <script src="https://api-maps.yandex.ru/v3/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU"></script>
</head>
<body>
<div id="map"></div>
<script>
  var map = null;
  var ready = false;
  var pending = null;
  var C = null;          // ymaps3 asosiy sinflari
  var Clust = null;      // @yandex/ymaps3-clusterer (yuklanmasa null — klastersiz chiziladi)
  var els = {};          // id -> nuqta elementi (tanlanganda rangi o'zgaradi)
  var selectedId = null;
  var clusterer = null;
  var plain = [];        // klasterlovchi paket yo'q bo'lganda oddiy belgilar
  var bubbles = [];      // viloyat/tuman bo'yicha ustalar soni (uzoqlashtirilganda)
  var meMarker = null;
  var meEl = null;       // "men" belgisi (pulsatsiyali nuqta + yo'nalish strelkasi)
  var arrowEl = null;
  var northMarker = null; // shimol tomonni ekranda aniqlash uchun ko'rinmas belgi
  var northEl = null;
  var meLL = null;
  var heading = null;    // qurilma yo'nalishi (gradus, shimoldan soat yo'nalishida)
  var pinData = {};      // id -> { id, lat, lon, name, role, rating, price }
  var popup = null;      // tanlangan mutaxassis kartochkasi
  var seen = {};         // allaqachon "tushib kelgan" nuqtalar (animatsiya faqat birinchi chiqishda)
  var areaFeature = null; // tanlangan mutaxassisning ish hududi doirasi
  var isDark = !!window.__DARK;
  var OPEN_LABEL = window.__OPEN_LABEL || 'Open';
  var curZoom = 11;
  var lastZoomSent = null;
  var zoomTimer = null;

  function send(msg) {
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  function sid(id) { return id == null ? null : String(id); }

  function box(cls, text, title) {
    var d = document.createElement('div');
    d.className = cls;
    if (text != null) d.textContent = text;
    if (title) d.title = title;
    return d;
  }

  function pinEl(id) {
    var wrap = box('pin');
    var cls = 'dot' + (id === selectedId ? ' sel' : '');
    if (!seen[id]) { seen[id] = true; cls += ' drop'; }
    var dot = box(cls);
    wrap.appendChild(dot);
    els[id] = dot;
    return wrap;
  }

  // Belgi bosilgach xarita bosilishi ham ishlab, tanlovni darhol bekor qilib yubormasligi uchun vaqt belgilanadi.
  var markerAt = 0;
  function mk(lon, lat, el, onClick) {
    var props = { coordinates: [lon, lat] };
    if (onClick) props.onClick = function () { markerAt = Date.now(); onClick(); };
    return new C.YMapMarker(props, el);
  }

  // Belgi bosilganda: tanlanadi va kamera ravon uchib shu nuqtaga keladi (kartochka ko'rinib turishi uchun).
  function pinTap(id) {
    var p = pinData[id];
    if (!p) return;
    send({ id: p.id });
    map.setLocation({ center: [p.lon, p.lat], zoom: Math.max(curZoom, 12), duration: 500 });
  }

  function hidePopup() {
    if (popup) { map.removeChild(popup); popup = null; }
  }

  // Xarita ustidagi mini-kartochka: ism, kasb, reyting, narx va "Ko'rish" tugmasi.
  function showPopup(id) {
    hidePopup();
    var p = pinData[id];
    if (!p) return;
    var wrap = box('pop');
    var card = box('card');
    card.appendChild(box('nm', p.name));
    if (p.role) card.appendChild(box('rl', p.role));
    var meta = box('mt');
    if (p.rating) meta.appendChild(box('rt', '★ ' + p.rating));
    if (p.price) meta.appendChild(box('pr', p.price));
    if (meta.childNodes.length) card.appendChild(meta);
    card.appendChild(box('go', OPEN_LABEL));
    wrap.appendChild(card);
    wrap.appendChild(box('tail'));
    popup = new C.YMapMarker({
      coordinates: [p.lon, p.lat],
      zIndex: 2000,
      onClick: function () { markerAt = Date.now(); send({ open: p.id }); }
    }, wrap);
    map.addChild(popup);
  }

  // Qurilma yo'nalishi strelkasi: shimol ekranda qayerda ekanini (xarita burilgan bo'lishi mumkin) ko'rinmas
  // belgidan o'lchab, strelka burchagi = qurilma yo'nalishi + shimolning ekrandagi burchagi.
  function placeNorth() {
    if (!meLL || !northMarker) return;
    var metersPerPx = 156543 * Math.cos(meLL[1] * Math.PI / 180) / Math.pow(2, curZoom);
    var dLat = (40 * metersPerPx) / 111000;
    northMarker.update({ coordinates: [meLL[0], meLL[1] + dLat] });
  }

  function updateArrow() {
    if (!arrowEl) return;
    if (heading == null || !meEl || !northEl) { arrowEl.style.display = 'none'; return; }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!meEl || !northEl || heading == null) return;
        var a = meEl.getBoundingClientRect();
        var b = northEl.getBoundingClientRect();
        if (!b.width && !b.height && !b.left && !b.top) return;
        var dx = b.left - (a.left + a.width / 2);
        var dy = b.top - (a.top + a.height / 2);
        if (Math.abs(dx) + Math.abs(dy) < 5) return;
        var north = Math.atan2(dx, -dy) * 180 / Math.PI;
        arrowEl.style.display = 'block';
        arrowEl.style.transform = 'rotate(' + (heading + north) + 'deg)';
      });
    });
  }

  function setHeading(deg) {
    heading = deg == null ? null : deg;
    updateArrow();
  }

  // Ish hududi: a = { lat, lon, km } — shaffof doira (ko'pburchak) chiziladi va kamera unga moslanadi; null — olib tashlanadi.
  function setWorkArea(a) {
    if (areaFeature) { map.removeChild(areaFeature); areaFeature = null; }
    if (!a || !ready) return;
    var ring = [];
    var dLat = (a.km * 1000) / 110540;
    var dLon = (a.km * 1000) / (111320 * Math.cos(a.lat * Math.PI / 180));
    for (var i = 0; i <= 64; i++) {
      var ang = (2 * Math.PI * i) / 64;
      ring.push([a.lon + dLon * Math.sin(ang), a.lat + dLat * Math.cos(ang)]);
    }
    areaFeature = new C.YMapFeature({
      geometry: { type: 'Polygon', coordinates: [ring] },
      style: { fill: 'rgba(255,147,30,0.16)', stroke: [{ color: '#ff931e', width: 2 }] }
    });
    map.addChild(areaFeature);
    fitPoints(ring);
  }

  function setTheme(dark) {
    isDark = !!dark;
    document.body.className = isDark ? 'dark' : '';
    if (map) map.update({ theme: isDark ? 'dark' : 'light' });
  }

  // Berilgan nuqtalarni (kengaytirib) ko'rinishga sig'diradi; hammasi bir joyda bo'lsa shu joyga yaqinlashadi.
  function fitPoints(pts) {
    var minX = 180, maxX = -180, minY = 90, maxY = -90;
    pts.forEach(function (p) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    });
    if (maxX - minX < 1e-6 && maxY - minY < 1e-6) {
      map.setLocation({ center: [minX, minY], zoom: Math.min(curZoom + 2, 19), duration: 500 });
      return;
    }
    var dx = (maxX - minX) * 0.25, dy = (maxY - minY) * 0.25;
    map.setLocation({ bounds: [[minX - dx, maxY + dy], [maxX + dx, minY - dy]], duration: 500 });
  }

  // Tanlangan viloyat/tuman markazi: koordinata bo'lsa o'sha joyga, bo'lmasa nomi bo'yicha qidirib, topilmasa zaxira nuqtaga.
  function focusArea(a) {
    function fallback() { map.setLocation({ center: [a.fallback.lon, a.fallback.lat], zoom: a.fallback.zoom, duration: 500 }); }
    if (a.lat != null) { map.setLocation({ center: [a.lon, a.lat], zoom: a.zoom, duration: 500 }); return; }
    try {
      ymaps3.search({ text: a.query, limit: 1 }).then(function (res) {
        var f = res && res[0];
        if (f && f.geometry) map.setLocation({ center: f.geometry.coordinates, zoom: 11, duration: 500 });
        else fallback();
      }, fallback);
    } catch (e) { fallback(); }
  }

  function clearPins() {
    if (clusterer) { map.removeChild(clusterer); clusterer = null; }
    plain.forEach(function (m) { map.removeChild(m); });
    plain = [];
    els = {};
  }

  // data: { pins: [{id, lat, lon}], clusters: [{name, count, lat, lon, zoom}] | null, me: {lat, lon} | null, area: {...} | null, fit: boolean }
  function setData(data) {
    if (!ready) { pending = data; return; }
    clearPins();
    bubbles.forEach(function (m) { map.removeChild(m); });
    bubbles = [];
    pinData = {};
    if (data.fit) seen = {};
    data.pins.forEach(function (p) { pinData[sid(p.id)] = p; });

    if (data.clusters) {
      // Uzoqdan ko'rinishda alohida ustalar o'rniga hudud bo'yicha soni; bossa o'sha hududga yaqinlashadi.
      data.clusters.forEach(function (c) {
        var el = box('bubble', String(c.count), c.name);
        var m = mk(c.lon, c.lat, el, function () {
          map.setLocation({ center: [c.lon, c.lat], zoom: c.zoom, duration: 500 });
        });
        map.addChild(m);
        bubbles.push(m);
      });
    } else if (Clust) {
      // Yaqin nuqtalar raqamli klasterga birlashadi; klasterni bossa yaqinlashadi.
      var features = data.pins.map(function (p) {
        return { type: 'Feature', id: sid(p.id), geometry: { type: 'Point', coordinates: [p.lon, p.lat] } };
      });
      clusterer = new Clust.YMapClusterer({
        method: Clust.clusterByGrid({ gridSize: 72 }),
        features: features,
        marker: function (f) {
          var id = f.id;
          return mk(f.geometry.coordinates[0], f.geometry.coordinates[1], pinEl(id), function () {
            pinTap(id);
          });
        },
        cluster: function (coordinates, feats) {
          return mk(coordinates[0], coordinates[1], box('cl', String(feats.length)), function () {
            fitPoints(feats.map(function (x) { return x.geometry.coordinates; }));
          });
        }
      });
      map.addChild(clusterer);
    } else {
      data.pins.forEach(function (p) {
        var id = sid(p.id);
        var m = mk(p.lon, p.lat, pinEl(id), function () { pinTap(id); });
        map.addChild(m);
        plain.push(m);
      });
    }

    if (meMarker) { map.removeChild(meMarker); meMarker = null; }
    if (northMarker) { map.removeChild(northMarker); northMarker = null; }
    meEl = null; arrowEl = null; northEl = null; meLL = null;
    if (data.me) {
      // Pulsatsiyali ko'k nuqta + (ruxsat bo'lsa) yo'nalish strelkasi.
      meEl = box('me');
      meEl.appendChild(box('pulse'));
      meEl.appendChild(box('core'));
      arrowEl = box('arrow');
      meEl.appendChild(arrowEl);
      meMarker = mk(data.me.lon, data.me.lat, meEl);
      map.addChild(meMarker);
      meLL = [data.me.lon, data.me.lat];
      northEl = box('nrt');
      northMarker = mk(meLL[0], meLL[1], northEl);
      map.addChild(northMarker);
      placeNorth();
      updateArrow();
    }

    if (!data.fit) return;
    if (data.clusters) return;
    if (data.area) {
      focusArea(data.area);
    } else if (data.pins.length > 1) {
      fitPoints(data.pins.map(function (p) { return [p.lon, p.lat]; }));
    } else if (data.pins.length === 1) {
      map.setLocation({ center: [data.pins[0].lon, data.pins[0].lat], zoom: 14, duration: 500 });
    } else if (data.me) {
      map.setLocation({ center: [data.me.lon, data.me.lat], zoom: 12, duration: 500 });
    }
  }

  function select(id) {
    var prev = selectedId;
    selectedId = sid(id);
    if (prev != null && els[prev]) els[prev].className = 'dot';
    if (selectedId != null && els[selectedId]) els[selectedId].className = 'dot sel';
    if (selectedId != null) showPopup(selectedId);
    else hidePopup();
  }

  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]);
  }

  async function init() {
    document.body.className = isDark ? 'dark' : '';
    await ymaps3.ready;
    C = ymaps3;
    ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', [
      '@yandex/ymaps3-clusterer@0.0',
      '@yandex/ymaps3-default-ui-theme@0.0'
    ]);
    // Ikki barmoq bilan burish (pinchRotate) va yaqinlashtirish (pinchZoom) yoqilgan.
    map = new C.YMap(
      document.getElementById('map'),
      {
        location: { center: [69.2401, 41.2995], zoom: 11 },
        // Ikki barmoq: yaqinlashtirish, burish va yuqoriga/pastga surib qiyalatish (3D binolar qiyalatganda ko'rinadi).
        behaviors: ['drag', 'pinchZoom', 'pinchRotate', 'panTilt', 'scrollZoom', 'dblClick', 'mouseTilt', 'mouseRotate'],
        theme: isDark ? 'dark' : 'light'
      },
      [new C.YMapDefaultSchemeLayer({}), new C.YMapDefaultFeaturesLayer({})]
    );
    map.addChild(new C.YMapListener({
      layer: 'any',
      onClick: function () {
        if (Date.now() - markerAt < 400) return;
        send({ id: null });
      },
      onUpdate: function (e) {
        curZoom = e.location.zoom;
        if (meMarker) { placeNorth(); updateArrow(); }
        clearTimeout(zoomTimer);
        zoomTimer = setTimeout(function () {
          var z = Math.round(curZoom);
          if (z !== lastZoomSent) { lastZoomSent = z; send({ zoom: z }); }
        }, 250);
      }
    }));
    try { Clust = await withTimeout(ymaps3.import('@yandex/ymaps3-clusterer'), 6000); } catch (e) { Clust = null; }
    ready = true;
    if (pending) { setData(pending); pending = null; }
    lastZoomSent = Math.round(curZoom);
    send({ ready: true, zoom: lastZoomSent });
    // Zoom va kompas (shimolga qaytarish) tugmalari; yuklanmasa xarita baribir ishlaydi.
    try {
      var ui = await withTimeout(ymaps3.import('@yandex/ymaps3-default-ui-theme'), 8000);
      map.addChild(new C.YMapControls({ position: 'right' }, [new ui.YMapZoomControl({}), new (ui.YMapRotateTiltControl || ui.YMapRotateControl)({})]));
    } catch (e) {}
  }
  init();
</script>
</body>
</html>`;

// Ustalar xaritasi: koordinatasi bor ustalar nuqta bo'lib chiqadi (yaqinlari klasterga birlashadi), nuqta bosilsa `onSelect(id)`,
// xaritaning bo'sh joyi bosilsa `onSelect(null)`. `me` — foydalanuvchi joylashuvi (ko'k nuqta).
// `fitKey` o'zgarganda xarita nuqtalarga moslab qayta markazlanadi (filtr/tartib o'zgarganda);
// "yana yuklash" kabi qo'shimcha nuqtalar kelganda ko'rinish o'zgarmaydi.
// `area` (tanlangan viloyat/tuman) berilsa, xarita nuqtalar bo'lmasa ham o'sha hududga markazlanadi:
// { lat, lon, zoom } yoki koordinatasiz bo'lsa { query, fallback: { lat, lon, zoom } }.
// `clusters` ([{ name, count, lat, lon, zoom }]) berilsa nuqtalar o'rniga hudud bo'yicha ustalar soni chiziladi;
// `onZoom(n)` — xarita masshtabi o'zgarganda chaqiriladi.
// `workArea` ({ lat, lon, km } | null) — tanlangan mutaxassisning ish hududi: shaffof doira chiziladi.
export default function WorkersMap({
  pins,
  clusters,
  workArea,
  me,
  showHeading = false,
  dark = false,
  openLabel,
  onOpen,
  area,
  selectedId,
  onSelect,
  onZoom,
  fitKey,
  style,
}) {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const lastFit = useRef(null);
  // Boshlang'ich mavzu va tugma yozuvi sahifa yuklanishidan oldin beriladi (HTML qayta yuklanmaydi).
  const [initJs] = useState(
    () =>
      `window.__DARK=${dark ? 'true' : 'false'};window.__OPEN_LABEL=${JSON.stringify(openLabel ?? '')};true;`
  );

  // Ish hududi doirasi: primitivlar orqali — obyekt har renderda yangi bo'lib, doira qayta chizilib ketmasligi uchun.
  const areaLat = workArea?.lat ?? null;
  const areaLon = workArea?.lon ?? null;
  const areaKm = workArea?.km ?? null;
  useEffect(() => {
    if (!ready) return;
    const payload =
      areaLat != null && areaLon != null && areaKm > 0
        ? JSON.stringify({ lat: areaLat, lon: areaLon, km: areaKm })
        : 'null';
    webRef.current?.injectJavaScript(`setWorkArea(${payload}); true;`);
  }, [ready, areaLat, areaLon, areaKm]);

  // Ilova mavzusi o'zgarsa xarita ham almashadi.
  useEffect(() => {
    if (!ready) return;
    webRef.current?.injectJavaScript(`setTheme(${dark ? 'true' : 'false'}); true;`);
  }, [ready, dark]);

  // Qurilma yo'nalishi (kompas): faqat joylashuvga ruxsat berilgan va "men" nuqtasi GPS'dan olingan bo'lsa.
  const hasMe = !!me;
  useEffect(() => {
    if (!ready || !hasMe || !showHeading) return;
    let cancelled = false;
    let sub = null;
    let last = null;
    const web = webRef.current;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted || cancelled) return;
        const s = await Location.watchHeadingAsync((h) => {
          const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (deg == null || deg < 0) return;
          // Kichik tebranishlar har safar xaritaga yuborilmasligi uchun 4° dan kam o'zgarish o'tkazib yuboriladi.
          if (last != null && Math.abs(deg - last) < 4) return;
          last = deg;
          web?.injectJavaScript(`setHeading(${Math.round(deg)}); true;`);
        });
        if (cancelled) s.remove();
        else sub = s;
      } catch {}
    })();
    return () => {
      cancelled = true;
      sub?.remove();
      web?.injectJavaScript('setHeading(null); true;');
    };
  }, [ready, hasMe, showHeading]);

  useEffect(() => {
    if (!ready) return;
    const fit = lastFit.current !== fitKey;
    lastFit.current = fitKey;
    const payload = JSON.stringify({
      pins,
      clusters: clusters ?? null,
      me: me ?? null,
      area: area ?? null,
      fit,
    });
    webRef.current?.injectJavaScript(`setData(${payload}); true;`);
    // Nuqtalar qayta chizilgach tanlangan nuqta rangi ham qayta qo'llanadi.
    webRef.current?.injectJavaScript(`select(${selectedId ?? 'null'}); true;`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tanlov alohida effektda
  }, [ready, pins, clusters, me, area, fitKey]);

  useEffect(() => {
    if (!ready) return;
    webRef.current?.injectJavaScript(`select(${selectedId ?? 'null'}); true;`);
  }, [ready, selectedId]);

  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.ready) setReady(true);
      if (msg.zoom != null) onZoom?.(msg.zoom);
      if ('id' in msg) onSelect?.(msg.id);
      if ('open' in msg) onOpen?.(msg.open);
    } catch {}
  };

  return (
    <View style={[s.wrap, style]}>
      <WebView
        ref={webRef}
        style={s.map}
        source={{ html: HTML, baseUrl: MAP_BASE_URL }}
        injectedJavaScriptBeforeContentLoaded={initJs}
        onMessage={onMessage}
        javaScriptEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  map: { flex: 1, backgroundColor: 'transparent' },
});

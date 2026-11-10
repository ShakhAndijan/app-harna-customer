import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { YANDEX_MAPS_API_KEY } from '../../constants/config';
import { forwardGeocode } from '../../utils/addressSearch';

// Yandex Maps JS API v3. Kalit "harna.uz" domeniga bog'langan (LocationMapPicker bilan bir xil sabab).
const MAP_BASE_URL = 'https://dev.harna.uz/';

const HTML = `
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
    #compass { top:12px; display:none; }
    #t3d { top:50%; margin-top:52px; font-size:14px; }
    #t3d.on { background:#e87a45; color:#fff; }
    .pin { position:relative; width:20px; height:20px; border-radius:10px; background:#e87a45; border:3px solid #fff;
      box-shadow:0 1px 5px rgba(0,0,0,.4); transform:translate(-10px,-10px); transition:all .15s; }
    .pin.sel { width:26px; height:26px; border-radius:13px; background:#e53935; transform:translate(-13px,-13px); }
    .me { position:relative; width:18px; height:18px; border-radius:9px; background:#1e88e5; border:3px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.35); transform:translate(-9px,-9px); }
    .me::after { content:''; position:absolute; left:-3px; top:-3px; width:18px; height:18px; border-radius:50%;
      background:rgba(30,136,229,.45); animation:pulse 2s ease-out infinite; pointer-events:none; }
    @keyframes pulse { 0% { transform:scale(1); opacity:.9; } 100% { transform:scale(3.6); opacity:0; } }
    @keyframes pop { 0% { transform:translate(-13px,-13px) scale(.6); } 60% { transform:translate(-13px,-13px) scale(1.25); } 100% { transform:translate(-13px,-13px) scale(1); } }
    .pin.sel { animation:pop .28s ease-out; }
    .pin.sel::after { content:''; position:absolute; left:-3px; top:-3px; width:26px; height:26px; border-radius:50%;
      background:rgba(229,57,53,.4); animation:ring 1.6s ease-out infinite; pointer-events:none; }
    @keyframes ring { 0% { transform:scale(1); opacity:.9; } 100% { transform:scale(2.8); opacity:0; } }
    @keyframes drop { 0% { transform:translate(-10px,-46px) scale(.5); opacity:0; } 55% { transform:translate(-10px,-6px) scale(1.1); opacity:1; }
      75% { transform:translate(-10px,-14px) scale(.95); } 100% { transform:translate(-10px,-10px) scale(1); opacity:1; } }
    .pin.drop { animation:drop .5s cubic-bezier(.3,.7,.4,1) backwards; }
    .pin.sel.drop { animation:pop .28s ease-out; }
    .pop { position:relative; width:0; height:0; }
    .pop .box { position:absolute; left:0; bottom:22px; transform:translateX(-50%); background:#fff; color:#222;
      border-radius:12px; padding:7px 11px; box-shadow:0 3px 12px rgba(0,0,0,.3); white-space:nowrap;
      font:600 13px/1.25 -apple-system, Roboto, sans-serif; animation:rise .18s ease-out; }
    .pop .box::after { content:''; position:absolute; left:50%; bottom:-6px; margin-left:-6px; width:12px; height:12px;
      background:inherit; transform:rotate(45deg); border-radius:0 0 3px 0; }
    .pop .sub { font-weight:500; font-size:12px; color:#777; margin-top:2px; }
    body.dark .pop .box { background:#2a2a2e; color:#f2f2f2; }
    body.dark .pop .sub { color:#aaa; }
    @keyframes rise { from { opacity:0; margin-bottom:-6px; } to { opacity:1; margin-bottom:0; } }
    .clu { min-width:34px; height:34px; padding:0 9px; border-radius:17px; background:#e87a45; color:#fff;
      border:3px solid #fff; box-shadow:0 1px 6px rgba(0,0,0,.4); display:flex; align-items:center;
      justify-content:center; font:800 14px/1 -apple-system, Roboto, sans-serif; transform:translate(-50%,-50%); }
  </style>
  <script src="https://api-maps.yandex.ru/v3/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU"></script>
</head>
<body>
<div id="map"></div>
<div id="compass" class="fab" onclick="resetNorth()">
  <svg id="needle" width="26" height="26" viewBox="0 0 26 26">
    <path d="M13 2 L18 13 L13 11 L8 13 Z" fill="#e53935"/>
    <path d="M13 24 L18 13 L13 15 L8 13 Z" fill="#9e9e9e"/>
  </svg>
</div>
<div id="zin" class="fab" onclick="zoomBy(1)">+</div>
<div id="zout" class="fab" onclick="zoomBy(-1)">&minus;</div>
<div id="t3d" class="fab" onclick="toggle3d()">3D</div>
<script>
  var map = null;
  var ready = false;
  var pending = null;
  var pinEls = {};
  var selectedId = null;
  var meMarker = null;
  var clusterer = null;
  var bubbles = []; // viloyat/tuman bo'yicha ustalar soni (uzoqlashtirilganda)
  var zoomTimer = null;
  var lastTap = 0;
  var Clu = null;
  var pinData = {};
  var curPins = [];
  var selMarker = null;
  var popup = null;
  var schemeLayer = null;
  var seen = {};
  var areaFeature = null;
  var is3d = false;

  function send(msg) {
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  function zoomBy(d) {
    if (!map) return;
    map.setLocation({ zoom: Math.max(2, Math.min(21, map.zoom + d)), duration: 200 });
  }

  function resetNorth() {
    if (!map) return;
    map.setCamera({ azimuth: 0, tilt: 0, duration: 300 });
  }

  function onCamera(camera) {
    var az = (camera && camera.azimuth) || 0;
    var tl = (camera && camera.tilt) || 0;
    document.getElementById('compass').style.display =
      (Math.abs(az) > 0.02 || Math.abs(tl) > 0.02) ? 'flex' : 'none';
    document.getElementById('needle').style.transform = 'rotate(' + (-az) + 'rad)';
  }

  function styleEl(el, id) {
    el.className = (id === selectedId ? 'pin sel' : 'pin') + (el._d ? ' drop' : '');
  }

  function makePin(f) {
    var id = f.properties.pid;
    var el = document.createElement('div');
    if (!seen[id]) { seen[id] = 1; el._d = true; el.style.animationDelay = Math.round(Math.random() * 220) + 'ms'; }
    styleEl(el, id);
    pinEls[id] = el;
    return new ymaps3.YMapMarker({
      coordinates: f.geometry.coordinates,
      onClick: function () { lastTap = Date.now(); send({ id: id }); }
    }, el);
  }

  function makeCluster(coordinates, features) {
    var el = document.createElement('div');
    el.className = 'clu';
    el.textContent = String(features.length);
    return new ymaps3.YMapMarker({
      coordinates: coordinates,
      onClick: function () {
        lastTap = Date.now();
        map.setLocation({ center: coordinates, zoom: Math.min(21, map.zoom + 2), duration: 300 });
      }
    }, el);
  }

  // Tanlangan viloyat/tuman markazi: {lat, lon, zoom}.
  function focusArea(a) {
    map.setLocation({ center: [a.lon, a.lat], zoom: a.zoom, duration: 300 });
  }

  function fitPins(pins) {
    var minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    pins.forEach(function (p) {
      minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
      minLon = Math.min(minLon, p.lon); maxLon = Math.max(maxLon, p.lon);
    });
    var dLat = Math.max((maxLat - minLat) * 0.15, 0.002);
    var dLon = Math.max((maxLon - minLon) * 0.15, 0.002);
    map.setLocation({
      bounds: [[minLon - dLon, minLat - dLat], [maxLon + dLon, maxLat + dLat]],
      duration: 300
    });
  }

  // data: { pins: [{id, lat, lon}], clusters: [{name, count, lat, lon, zoom}] | null, me: {lat, lon} | null, area: {lat, lon, zoom} | null, fit: boolean }
  // Yaqin nuqtalar raqamli klasterga birlashadi; klasterni bossa yaqinlashadi.
  // Tanlangan usta klasterdan chiqarilib, alohida (ko'rinib turadigan) nuqta bo'ladi.
  function renderPins() {
    if (clusterer) { map.removeChild(clusterer); clusterer = null; }
    if (selMarker) { map.removeChild(selMarker); selMarker = null; }
    pinEls = {};
    var features = [];
    curPins.forEach(function (p) {
      if (p.id === selectedId) return;
      features.push({
        type: 'Feature',
        id: String(p.id),
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        properties: { pid: p.id }
      });
    });
    clusterer = new Clu.YMapClusterer({
      method: Clu.clusterByGrid({ gridSize: 72 }),
      features: features,
      marker: makePin,
      cluster: makeCluster
    });
    map.addChild(clusterer);
    var sp = selectedId != null ? pinData[selectedId] : null;
    if (sp) {
      selMarker = makePin({ geometry: { coordinates: [sp.lon, sp.lat] }, properties: { pid: sp.id } });
      map.addChild(selMarker);
    }
  }

  function setData(data) {
    if (!ready) { pending = data; return; }
    if (selMarker) { map.removeChild(selMarker); selMarker = null; }
    if (clusterer) { map.removeChild(clusterer); clusterer = null; }
    bubbles.forEach(function (b) { map.removeChild(b); });
    bubbles = [];
    pinEls = {};
    pinData = {};
    if (data.fit) seen = {};
    data.pins.forEach(function (p) { pinData[p.id] = p; });
    if (meMarker) { map.removeChild(meMarker); meMarker = null; }

    if (data.clusters) {
      // Uzoqdan ko'rinishda alohida ustalar o'rniga hudud bo'yicha soni; bossa o'sha hududga yaqinlashadi.
      data.clusters.forEach(function (c) {
        var el = document.createElement('div');
        el.className = 'clu';
        el.textContent = String(c.count);
        var mk = new ymaps3.YMapMarker({
          coordinates: [c.lon, c.lat],
          onClick: function () {
            lastTap = Date.now();
            map.setLocation({ center: [c.lon, c.lat], zoom: c.zoom, duration: 300 });
          }
        }, el);
        map.addChild(mk);
        bubbles.push(mk);
      });
    } else {
      curPins = data.pins;
      renderPins();
    }

    if (data.me) {
      var me = document.createElement('div');
      me.className = 'me';
      meMarker = new ymaps3.YMapMarker({ coordinates: [data.me.lon, data.me.lat] }, me);
      map.addChild(meMarker);
    }

    if (!data.fit) return;
    if (data.clusters) return;
    if (data.area) {
      focusArea(data.area);
    } else if (data.pins.length > 1) {
      fitPins(data.pins);
    } else if (data.pins.length === 1) {
      map.setLocation({ center: [data.pins[0].lon, data.pins[0].lat], zoom: 14, duration: 300 });
    } else if (data.me) {
      map.setLocation({ center: [data.me.lon, data.me.lat], zoom: 12, duration: 300 });
    }
  }

  // Qorong'i/yorug' xarita uslubi.
  function setTheme(dark) {
    document.body.className = dark ? 'dark' : '';
    if (!map) return;
    if (schemeLayer) map.removeChild(schemeLayer);
    schemeLayer = new ymaps3.YMapDefaultSchemeLayer({ theme: dark ? 'dark' : 'light' });
    map.addChild(schemeLayer);
  }

  function hidePopup() {
    if (popup) { map.removeChild(popup); popup = null; }
  }

  function showPopup(p) {
    hidePopup();
    var wrap = document.createElement('div');
    wrap.className = 'pop';
    var box = document.createElement('div');
    box.className = 'box';
    var t = document.createElement('div');
    t.textContent = p.title || '';
    box.appendChild(t);
    if (p.sub) {
      var sb = document.createElement('div');
      sb.className = 'sub';
      sb.textContent = p.sub;
      box.appendChild(sb);
    }
    wrap.appendChild(box);
    popup = new ymaps3.YMapMarker({ coordinates: [p.lon, p.lat], zIndex: 2000 }, wrap);
    map.addChild(popup);
  }

  // Ustaning ish hududi (radius, km) — tanlangan nuqta atrofida shaffof doira.
  function hideArea() {
    if (areaFeature) { map.removeChild(areaFeature); areaFeature = null; }
  }

  function showArea(p) {
    hideArea();
    if (!p || !(p.radiusKm > 0)) return;
    var ring = [];
    var dLat = p.radiusKm / 111.32;
    var dLon = p.radiusKm / (111.32 * Math.cos(p.lat * Math.PI / 180));
    for (var i = 0; i <= 64; i++) {
      var a = (i / 64) * 2 * Math.PI;
      ring.push([p.lon + dLon * Math.cos(a), p.lat + dLat * Math.sin(a)]);
    }
    areaFeature = new ymaps3.YMapFeature({
      geometry: { type: 'Polygon', coordinates: [ring] },
      style: { fill: 'rgba(232,122,69,0.16)', stroke: [{ color: '#e87a45', width: 2, dash: [6, 4] }] }
    });
    map.addChild(areaFeature);
  }

  // 3D rejim: xarita qiyalanadi va binolar hajmli ko'rinadi (yaqinlashganda yaqqol).
  function toggle3d() {
    if (!map) return;
    is3d = !is3d;
    document.getElementById('t3d').className = is3d ? 'fab on' : 'fab';
    if (is3d) {
      map.setLocation({ zoom: Math.max(map.zoom, 16), duration: 500 });
      map.setCamera({ tilt: 0.9, duration: 500 });
    } else {
      map.setCamera({ tilt: 0, azimuth: 0, duration: 400 });
    }
  }

  function select(id) {
    selectedId = id;
    Object.keys(pinEls).forEach(function (k) {
      styleEl(pinEls[k], isNaN(Number(k)) ? k : Number(k));
    });
    var p = id != null ? pinData[id] : null;
    if (!map || !ready) return;
    if (!bubbles.length && clusterer) renderPins();
    if (p && p.title) showPopup(p); else hidePopup();
    showArea(p);
    // Tanlangan usta tomon kamera silliq suriladi (masshtab kamida 13 bo'ladi).
    if (p) {
      // Doira sig'ishi uchun radiusga qarab masshtab tanlanadi (juda kichik bo'lib ketmaydi).
      var z = p.radiusKm > 0 ? Math.max(9, Math.min(15, Math.round(15 - Math.log2(p.radiusKm * 2 + 1)))) : 13;
      map.setLocation({ center: [p.lon, p.lat], zoom: p.radiusKm > 0 ? z : Math.max(map.zoom, 13), duration: 450 });
    }
  }

  (async function () {
    if (!window.ymaps3) return;
    await ymaps3.ready;
    Clu = await ymaps3.import('@yandex/ymaps3-clusterer@0.0.1');
    var m = ymaps3;
    map = new m.YMap(document.getElementById('map'), {
      location: { center: [69.2401, 41.2995], zoom: 11 },
      // Ikki barmoq bilan burish (pinchRotate) va qiyalatish yoqilgan.
      behaviors: ['drag', 'scrollZoom', 'pinchZoom', 'dblClick', 'pinchRotate', 'mouseRotate', 'mouseTilt', 'oneFingerZoom', 'magnifier']
    });
    schemeLayer = new m.YMapDefaultSchemeLayer({ theme: document.body.className === 'dark' ? 'dark' : 'light' });
    map.addChild(schemeLayer);
    map.addChild(new m.YMapDefaultFeaturesLayer({}));
    map.addChild(new m.YMapListener({
      layer: 'any',
      onClick: function () {
        if (Date.now() - lastTap < 350) return;
        send({ id: null });
      },
      onUpdate: function (p) {
        onCamera(p.camera);
        if (p.mapInAction) return;
        clearTimeout(zoomTimer);
        zoomTimer = setTimeout(function () { send({ zoom: Math.round(map.zoom) }); }, 250);
      }
    }));
    ready = true;
    if (pending) { setData(pending); pending = null; }
    send({ ready: true, zoom: Math.round(map.zoom) });
  })();
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
// `onZoom(n)` — xarita masshtabi o'zgarganda chaqiriladi. `dark` — qorong'i xarita uslubi.
// Nuqtadagi ixtiyoriy `title`/`sub` maydonlari tanlanganda nuqta ustida mini-popup bo'lib chiqadi.
export default function WorkersMap({
  pins,
  clusters,
  me,
  area,
  selectedId,
  onSelect,
  onZoom,
  fitKey,
  dark,
  style,
}) {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const lastFit = useRef(null);
  // Koordinatasiz hudud (faqat nomi bor) — nomi bo'yicha geokodlanadi; topilgunga qadar zaxira nuqta ishlatiladi.
  const [geo, setGeo] = useState(null);
  const areaQuery = area && area.lat == null ? area.query : null;
  useEffect(() => {
    if (!areaQuery) return;
    let cancelled = false;
    forwardGeocode(areaQuery).then((c) => {
      if (!cancelled && c) setGeo({ query: areaQuery, lat: c.lat, lon: c.lng });
    });
    return () => {
      cancelled = true;
    };
  }, [areaQuery]);
  const effArea = !area
    ? null
    : area.lat != null
      ? { lat: area.lat, lon: area.lon, zoom: area.zoom }
      : geo && geo.query === area.query
        ? { lat: geo.lat, lon: geo.lon, zoom: area.fallback.zoom }
        : { lat: area.fallback.lat, lon: area.fallback.lon, zoom: area.fallback.zoom };

  useEffect(() => {
    if (!ready) return;
    const fit = lastFit.current !== fitKey;
    lastFit.current = fitKey;
    const payload = JSON.stringify({
      pins,
      clusters: clusters ?? null,
      me: me ?? null,
      area: effArea,
      fit,
    });
    webRef.current?.injectJavaScript(`setData(${payload}); true;`);
    // Nuqtalar qayta chizilgach tanlangan nuqta rangi ham qayta qo'llanadi.
    webRef.current?.injectJavaScript(`select(${selectedId ?? 'null'}); true;`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fit faqat fitKey o'zgarganda; effArea quyida
  }, [ready, pins, clusters, me, effArea?.lat, effArea?.lon, effArea?.zoom, fitKey]);

  useEffect(() => {
    if (!ready) return;
    webRef.current?.injectJavaScript(`setTheme(${dark ? 'true' : 'false'}); true;`);
  }, [ready, dark]);

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
    } catch {}
  };

  return (
    <View style={[s.wrap, style]}>
      <WebView
        ref={webRef}
        style={s.map}
        source={{ html: HTML, baseUrl: MAP_BASE_URL }}
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

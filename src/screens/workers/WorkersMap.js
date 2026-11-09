import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
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
    .dot.sel { background:#ed4543; transform:scale(1.3); }
    .me { transform:translate(-50%,-50%); width:18px; height:18px; border-radius:50%; background:#1e98ff; border:3px solid #fff; box-shadow:0 0 0 6px rgba(30,152,255,.25); }
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
    var dot = box('dot' + (id === selectedId ? ' sel' : ''));
    wrap.appendChild(dot);
    els[id] = dot;
    return wrap;
  }

  function mk(lon, lat, el, onClick) {
    return new C.YMapMarker({ coordinates: [lon, lat], onClick: onClick }, el);
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
      map.setLocation({ center: [minX, minY], zoom: Math.min(curZoom + 2, 19), duration: 300 });
      return;
    }
    var dx = (maxX - minX) * 0.25, dy = (maxY - minY) * 0.25;
    map.setLocation({ bounds: [[minX - dx, maxY + dy], [maxX + dx, minY - dy]], duration: 300 });
  }

  // Tanlangan viloyat/tuman markazi: koordinata bo'lsa o'sha joyga, bo'lmasa nomi bo'yicha qidirib, topilmasa zaxira nuqtaga.
  function focusArea(a) {
    function fallback() { map.setLocation({ center: [a.fallback.lon, a.fallback.lat], zoom: a.fallback.zoom }); }
    if (a.lat != null) { map.setLocation({ center: [a.lon, a.lat], zoom: a.zoom }); return; }
    try {
      ymaps3.search({ text: a.query, limit: 1 }).then(function (res) {
        var f = res && res[0];
        if (f && f.geometry) map.setLocation({ center: f.geometry.coordinates, zoom: 11 });
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

    if (data.clusters) {
      // Uzoqdan ko'rinishda alohida ustalar o'rniga hudud bo'yicha soni; bossa o'sha hududga yaqinlashadi.
      data.clusters.forEach(function (c) {
        var el = box('bubble', String(c.count), c.name);
        var m = mk(c.lon, c.lat, el, function () {
          map.setLocation({ center: [c.lon, c.lat], zoom: c.zoom, duration: 300 });
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
            send({ id: Number(id) });
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
        var m = mk(p.lon, p.lat, pinEl(id), function () { send({ id: p.id }); });
        map.addChild(m);
        plain.push(m);
      });
    }

    if (meMarker) { map.removeChild(meMarker); meMarker = null; }
    if (data.me) {
      meMarker = mk(data.me.lon, data.me.lat, box('me'));
      map.addChild(meMarker);
    }

    if (!data.fit) return;
    if (data.clusters) return;
    if (data.area) {
      focusArea(data.area);
    } else if (data.pins.length > 1) {
      fitPoints(data.pins.map(function (p) { return [p.lon, p.lat]; }));
    } else if (data.pins.length === 1) {
      map.setLocation({ center: [data.pins[0].lon, data.pins[0].lat], zoom: 14 });
    } else if (data.me) {
      map.setLocation({ center: [data.me.lon, data.me.lat], zoom: 12 });
    }
  }

  function select(id) {
    var prev = selectedId;
    selectedId = sid(id);
    if (prev != null && els[prev]) els[prev].className = 'dot';
    if (selectedId != null && els[selectedId]) els[selectedId].className = 'dot sel';
  }

  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]);
  }

  async function init() {
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
        behaviors: ['drag', 'pinchZoom', 'pinchRotate', 'scrollZoom', 'dblClick']
      },
      [new C.YMapDefaultSchemeLayer({}), new C.YMapDefaultFeaturesLayer({})]
    );
    map.addChild(new C.YMapListener({
      layer: 'any',
      onClick: function () { send({ id: null }); },
      onUpdate: function (e) {
        curZoom = e.location.zoom;
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
      map.addChild(new C.YMapControls({ position: 'right' }, [new ui.YMapZoomControl({}), new ui.YMapRotateControl({})]));
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
export default function WorkersMap({
  pins,
  clusters,
  me,
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

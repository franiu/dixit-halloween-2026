/* =========================================================================
   UPIORNY SPACER — logika aplikacji
   Parametry testowe w URL: ?t=15:50 (symulowany czas) &speed=10
                            &lat=39.947&lng=-75.152 (symulowana pozycja)
                            &reset=1 (wyczyść postęp)
   ========================================================================= */
(function () {
  'use strict';
  const D = window.SPOOKY;
  const A = window.SpookyAudio;
  const $ = (s) => document.querySelector(s);
  const qs = new URLSearchParams(location.search);

  // ---------------- Konfiguracja z URL ----------------
  function parseLL(v) {
    if (!v) return null;
    const [a, b] = v.split(',').map(Number);
    return isFinite(a) && isFinite(b) ? [a, b] : null;
  }
  [['dinner', 'dinnerName'], ['garage', 'garageName']].forEach(([k, nk]) => {
    const ll = parseLL(qs.get(k));
    if (ll) { D.places[k].lat = ll[0]; D.places[k].lng = ll[1]; D.places[k].placeholder = false; }
    if (qs.get(nk)) { D.places[k].name = qs.get(nk); D.places[k].addr = qs.get(nk + 'Addr') || D.places[k].addr; }
  });

  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const S = Object.fromEntries(Object.entries(D.schedule).map(([k, v]) => [k, toMin(v)]));
  const stopById = Object.fromEntries(D.stops.map((s) => [s.id, s]));
  // numeracja na mapie
  D.walkOrder.forEach((id, i) => { stopById[id].num = i + 1; });
  D.nightOrder.forEach((id, i) => { if (!stopById[id].isPlace) stopById[id].num = 'N' + (i + 1); });

  // ---------------- Stan ----------------
  const KEY = 'upiorny-spacer-2026';
  const defaultState = () => ({
    visited: {}, skipped: {}, quiz: {}, ritual: {}, bingo: {}, souls: 0,
    arrivedDinner: false, scares: 0, sound: true, scaresOn: true, eggs: {}, manual: null, entered: false
  });
  let st = defaultState();
  try {
    if (qs.get('reset')) localStorage.removeItem(KEY);
    const raw = localStorage.getItem(KEY);
    if (raw) st = Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  // ---------------- Czas ----------------
  const simT = qs.get('t') ? toMin(qs.get('t')) : null;
  const simSpeed = Number(qs.get('speed') || 1);
  const t0 = Date.now();
  const fmtParts = new Intl.DateTimeFormat('en-US', { timeZone: D.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  function nowMin() {
    if (simT !== null) return simT + ((Date.now() - t0) / 60000) * simSpeed;
    const p = {}; fmtParts.formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
    return (Number(p.hour) % 24) * 60 + Number(p.minute) + Number(p.second) / 60;
  }
  const hhmm = (m) => { m = ((Math.floor(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function fmtDur(min) {
    const neg = min < 0; min = Math.abs(min);
    const totalS = Math.floor(min * 60);
    const h = Math.floor(totalS / 3600), m = Math.floor((totalS % 3600) / 60), s = totalS % 60;
    const core = h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
    return (neg ? '−' : '') + core;
  }

  // ---------------- Geo ----------------
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  function dist(a, b) {
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function bearing(a, b) {
    const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }
  const WALK = 1.3;   // m/s — spacer grupy
  const DETOUR = 1.2; // ulice ≠ linia prosta
  const walkMin = (m) => (m * DETOUR) / WALK / 60;
  const fmtDist = (m) => (m == null ? '—' : m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);

  let me = null; // {lat,lng,acc}
  let heading = null;
  const simLL = parseLL(qs.get('lat') && qs.get('lng') ? qs.get('lat') + ',' + qs.get('lng') : null);
  if (simLL) me = { lat: simLL[0], lng: simLL[1], acc: 5 };

  // ---------------- Fazy i cel ----------------
  const isDone = (id) => st.visited[id] || st.skipped[id];
  function phase(m = nowMin()) {
    if (m >= S.showEnd) return 'home';
    if (m >= S.show) return 'show';
    if (m >= S.leaveDinner) return 'night';
    if (m >= S.dinner || st.arrivedDinner) return 'dinner';
    if (m < S.meet && !st.visited.wash) return 'approach';
    return 'walk';
  }
  // przystanki przed ostatnim odwiedzonym uznajemy za minięte (nie zawracamy grupy)
  function remaining(order) {
    let last = -1; order.forEach((id, i) => { if (st.visited[id]) last = i; });
    return order.slice(last + 1).map((id) => stopById[id]).filter((s) => !isDone(s.id));
  }
  function target() {
    const ph = phase();
    if (st.manual) {
      const m = stopById[st.manual] || D.places[st.manual];
      if (m && !(stopById[st.manual] && isDone(st.manual))) return m;
      st.manual = null;
    }
    if (ph === 'approach' || ph === 'walk') return remaining(D.walkOrder)[0] || D.places.dinner;
    if (ph === 'dinner') return st.arrivedDinner ? null : D.places.dinner;
    if (ph === 'night') return remaining(D.nightOrder)[0] || stopById.theatre;
    if (ph === 'show') return st.visited.theatre ? null : stopById.theatre;
    return D.places.garage;
  }
  function origin() {
    if (me) return me;
    const all = D.walkOrder.concat(D.nightOrder).filter((id) => st.visited[id]);
    if (all.length) return stopById[all[all.length - 1]];
    return phase() === 'home' ? stopById.theatre : D.places.garage;
  }
  // Plan: od pozycji przez cel i pozostałe przystanki do punktu docelowego fazy
  function planInfo() {
    const ph = phase(), m = nowMin();
    let chain = [], deadline = null, finish = null, label = '';
    const tgt = target();
    if (ph === 'approach') { chain = [stopById.wash]; deadline = S.meet; label = 'Spotkanie na Washington Sq'; }
    else if (ph === 'walk') { chain = remaining(D.walkOrder); finish = D.places.dinner; deadline = S.dinner; label = 'Do kolacji'; }
    else if (ph === 'dinner') {
      if (!st.arrivedDinner) { chain = []; finish = D.places.dinner; deadline = S.dinner; label = 'Kolacja — już czekają!'; }
      else { deadline = S.leaveDinner; label = 'Wyjście do teatru za'; }
    } else if (ph === 'night') { chain = remaining(D.nightOrder).filter((s) => !s.isPlace); finish = stopById.theatre; deadline = S.show; label = 'Kurtyna w górę za'; }
    else if (ph === 'show') { deadline = S.showEnd; label = st.visited.theatre ? 'Spektakl trwa · koniec ok.' : 'Spektakl już trwa!'; if (!st.visited.theatre) finish = stopById.theatre; }
    else { label = 'Powrót na parking'; finish = D.places.garage; }
    // jeśli cel ręczny — wstaw na początek
    if (tgt && !chain.includes(tgt) && tgt !== finish) chain = [tgt].concat(chain);
    let pos = origin(), meters = 0, dwell = 0;
    chain.forEach((s) => { meters += dist(pos, s); pos = s; dwell += s.dwell || 0; });
    if (finish) meters += dist(pos, finish);
    const eta = walkMin(meters) + dwell;
    const margin = ph === 'night' || ph === 'show' ? 10 : 2; // do teatru warto być 10 min wcześniej
    const buffer = deadline != null && (chain.length || finish) ? deadline - m - eta - margin : null;
    return { ph, chain, finish, deadline, label, meters, eta, buffer, m };
  }

  // ---------------- Mapa ----------------
  const map = L.map('map', { zoomControl: false, attributionControl: true }).setView([39.9455, -75.1495], 16);
  // Kafelki bez klucza API: OpenStreetMap (przyciemnione CSS-em), awaryjnie CARTO.
  const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const TILES = {
    osm: () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, className: 'tiles-osm', attribution: OSM_ATTR
    }),
    carto: () => L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20, subdomains: 'abcd', attribution: OSM_ATTR + ' &copy; <a href="https://carto.com/attributions">CARTO</a>'
    })
  };
  const tileOrder = qs.get('tiles') === 'carto' ? ['carto', 'osm'] : ['osm', 'carto'];
  let tileIdx = 0, tileErrors = 0, tileLoads = 0, tileLayer = null;
  function useTiles(i) {
    if (tileLayer) map.removeLayer(tileLayer);
    tileIdx = i; tileErrors = 0; tileLoads = 0;
    tileLayer = TILES[tileOrder[i]]().addTo(map);
    tileLayer.on('tileload', () => { tileLoads++; });
    tileLayer.on('tileerror', () => {
      tileErrors++;
      if (tileErrors >= 4 && tileLoads === 0 && tileIdx + 1 < tileOrder.length) useTiles(tileIdx + 1);
    });
  }
  useTiles(0);

  const markers = {};
  function mkIcon(s, cls) {
    const n = s.num != null ? `<span class="n">${s.num}</span>` : '';
    const size = cls.includes('bonus') ? 28 : 34;
    return L.divIcon({ className: '', html: `<div class="mk ${cls}">${s.emoji}${n}</div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
  }
  function markerClass(s) {
    const c = [];
    if (s.id in D.places) c.push('place');
    else if (s.isPlace) c.push('place');
    else if (s.phase === 'bonus') c.push('bonus');
    else if (s.phase === 'night') c.push('night');
    if (st.visited[s.id] || (s.id === 'dinner' && st.arrivedDinner)) c.push('done');
    if (st.skipped[s.id]) c.push('skipped');
    const t = target();
    if (t && t.id === s.id) c.push('target');
    return c.join(' ');
  }
  function popupHtml(s) {
    const isStop = !!stopById[s.id];
    return `<div class="pop"><b>${s.emoji} ${s.name}</b><div class="pop-sub">${s.sub || s.addr || ''}</div><div class="row">
      ${isStop ? `<button class="btn primary" data-story="${s.id}">📜 Czytaj</button>` : ''}
      <button class="btn" data-go="${s.id}">🎯 Prowadź tu</button></div></div>`;
  }
  function addMarker(s) {
    const mk = L.marker([s.lat, s.lng], { icon: mkIcon(s, markerClass(s)), zIndexOffset: s.phase === 'bonus' ? 0 : 100 }).addTo(map);
    mk.bindPopup(() => popupHtml(s), { closeButton: false });
    markers[s.id] = mk;
  }
  D.stops.forEach(addMarker);
  ['garage', 'dinner'].forEach((k) => addMarker(D.places[k]));
  function refreshMarkers() {
    D.stops.concat([D.places.garage, D.places.dinner]).forEach((s) => markers[s.id] && markers[s.id].setIcon(mkIcon(s, markerClass(s))));
  }
  map.on('popupopen', (e) => {
    const el = e.popup.getElement();
    el.querySelectorAll('[data-story]').forEach((b) => b.addEventListener('click', () => { map.closePopup(); openStory(b.dataset.story); }));
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { map.closePopup(); setManual(b.dataset.go); }));
  });

  // Trasy
  const ll = (s) => [s.lat, s.lng];
  const walkLine = [D.places.garage].concat(D.walkOrder.map((id) => stopById[id]), [D.places.dinner]).map(ll);
  const nightLine = [D.places.dinner].concat(D.nightOrder.map((id) => stopById[id])).map(ll);
  const homeLine = [stopById.theatre, D.places.garage].map(ll);
  L.polyline(walkLine, { color: '#ff7a1a', weight: 9, opacity: 0.15 }).addTo(map);
  L.polyline(walkLine, { color: '#ffb35c', weight: 3, opacity: 0.9, dashArray: '2 10', lineCap: 'round', className: 'route-flow route-glow' }).addTo(map);
  L.polyline(nightLine, { color: '#6aa7ff', weight: 3, opacity: 0.75, dashArray: '2 10', lineCap: 'round', className: 'route-flow' }).addTo(map);
  L.polyline(homeLine, { color: '#a77bff', weight: 2, opacity: 0.4, dashArray: '1 8' }).addTo(map);
  const tgtLine = L.polyline([], { color: '#8dffb0', weight: 2, opacity: 0.8, dashArray: '6 8' }).addTo(map);

  // Ja
  let meMarker = null, accCircle = null, follow = false;
  function meIcon() {
    const cone = heading != null ? `<div class="me-cone" style="transform: rotate(${heading}deg)"></div>` : '';
    return L.divIcon({ className: '', html: `<div class="me">${cone}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
  }
  function drawMe() {
    if (!me) return;
    if (!meMarker) {
      meMarker = L.marker([me.lat, me.lng], { icon: meIcon(), zIndexOffset: 1000, interactive: false }).addTo(map);
      accCircle = L.circle([me.lat, me.lng], { radius: me.acc || 20, color: '#8dffb0', weight: 1, opacity: 0.3, fillOpacity: 0.05, interactive: false }).addTo(map);
    } else {
      meMarker.setLatLng([me.lat, me.lng]);
      accCircle.setLatLng([me.lat, me.lng]).setRadius(Math.min(me.acc || 20, 150));
    }
    if (follow) map.panTo([me.lat, me.lng], { animate: true });
  }
  let lastConeHeading = null;
  function updateCone() {
    if (!meMarker || heading == null) return;
    if (lastConeHeading != null && Math.abs(heading - lastConeHeading) < 4) return;
    lastConeHeading = heading;
    meMarker.setIcon(meIcon());
  }

  // Dopasuj widok do trasy przed kolacją
  map.fitBounds(L.latLngBounds(walkLine.concat([ll(stopById.theatre)])), { paddingTopLeft: [20, 110], paddingBottomRight: [20, 210] });

  // ---------------- Geolokalizacja i kompas ----------------
  let geoWatch = null;
  function startGeo() {
    if (simLL || !navigator.geolocation || geoWatch != null) return;
    geoWatch = navigator.geolocation.watchPosition((p) => {
      const first = !me;
      me = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
      if (p.coords.heading != null && !isNaN(p.coords.heading) && p.coords.speed > 0.6 && !compassLive) heading = p.coords.heading;
      drawMe(); checkArrivals(); render();
      if (first && dist(me, stopById.wash) < 5000) { follow = true; $('#locBtn').classList.add('follow'); map.setView([me.lat, me.lng], 17); }
    }, (err) => {
      toast(err.code === 1 ? '📍 Bez lokalizacji nie pokażę odległości. Włącz ją w ustawieniach przeglądarki.' : '📍 Szukam sygnału GPS…');
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  }
  let compassLive = false;
  function onOrient(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (e.absolute && typeof e.alpha === 'number') h = 360 - e.alpha;
    if (h == null || isNaN(h)) return;
    const so = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    heading = (h + so + 360) % 360; compassLive = true;
    renderArrow(); updateCone();
  }
  let compassOn = false, shakeOn = false;
  function startCompass() {
    if (compassOn) return; compassOn = true;
    if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', onOrient);
    else window.addEventListener('deviceorientation', onOrient);
  }
  function requestSensors() {
    const ps = [];
    try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) ps.push(DeviceOrientationEvent.requestPermission().catch(() => 'denied')); } catch (e) {}
    try { if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) ps.push(DeviceMotionEvent.requestPermission().catch(() => 'denied')); } catch (e) {}
    Promise.all(ps).then(() => { startCompass(); startShake(); });
  }

  // ---------------- Przybycie ----------------
  const GRAVES = ['stpeters', 'oldpine', 'stmarys', 'mikveh', 'hospital'];
  function checkArrivals() {
    if (!me || (me.acc && me.acc > 120)) return;
    D.stops.forEach((s) => {
      if (st.visited[s.id]) return;
      if (s.id === 'theatre' && nowMin() < S.dinner) return; // parking obok teatru — nie zaliczaj za wcześnie
      if (dist(me, s) <= (s.radius || 50) + Math.min(me.acc || 0, 30)) arrive(s.id, true);
    });
    const dn = D.places.dinner;
    if (!st.arrivedDinner && !dn.placeholder && nowMin() > S.dinner - 40 && dist(me, dn) < 60) arriveDinner(true);
  }
  function arrive(id, auto) {
    const s = stopById[id]; if (!s || st.visited[id]) return;
    st.visited[id] = Date.now(); delete st.skipped[id];
    if (st.manual === id) st.manual = null;
    addSouls(10, false);
    save();
    A.play('chime'); vibrate([60, 40, 120]);
    if (id === 'theatre') { setTimeout(() => A.play('addams'), 600); }
    else if (id === 'kosciuszko') { setTimeout(() => A.play('drum'), 500); }
    toast(`<b>Pieczęć zdobyta!</b> ${s.emoji} ${s.name} · +10 dusz<br><button class="btn primary" data-story="${id}">📜 Posłuchaj historii</button>`, 7000);
    if (st.scaresOn && GRAVES.includes(id) && st.scares < 2 && Math.random() < 0.4 && !(phase() === 'show')) setTimeout(() => jumpScare(), 2500 + Math.random() * 4000);
    refreshMarkers(); render();
  }
  function arriveDinner(auto) {
    st.arrivedDinner = true; st.manual = null; save();
    A.play('bell', 196); vibrate([80, 60, 80]);
    toast('🍽️ <b>Smacznego!</b> Opowiedzcie przy stole historię z Księgi 📖', 6000);
    refreshMarkers(); render();
  }
  function setManual(id) {
    if (id === 'dinner' && st.arrivedDinner) return;
    st.manual = id; save(); A.play('pop'); refreshMarkers(); render();
    const t = stopById[id] || D.places[id];
    toast(`🎯 Prowadzę do: <b>${t.name}</b>`);
  }

  // ---------------- Render ----------------
  let lastPlanKey = '';
  function renderArrow() {
    const t = target(); const o = origin();
    const arrow = $('#arrow'), hint = $('#compassHint');
    if (!t) { arrow.style.transform = 'rotate(0deg)'; return; }
    const b = bearing(o, t);
    const rot = heading != null ? b - heading : b;
    arrow.style.transform = `rotate(${rot}deg)`;
    hint.textContent = heading != null ? (compassLive ? 'kompas' : 'GPS') : 'N↑';
    hint.classList.toggle('live', heading != null);
  }
  function render() {
    const P = planInfo();
    const t = target();
    document.body.classList.toggle('night', P.m >= S.sunset);
    // HUD
    $('#clock').textContent = hhmm(P.m);
    $('#phaseLabel').textContent = P.label;
    if (P.deadline != null) $('#countdown').textContent = P.ph === 'show' && st.visited.theatre ? hhmm(P.deadline) : fmtDur(P.deadline - P.m);
    else $('#countdown').textContent = '🦇';
    // Status
    const pill = $('#status'); let cls = '', txt = '';
    pill.onclick = null;
    if (P.buffer != null && (P.ph === 'walk' || P.ph === 'approach' || P.ph === 'night' || (P.ph === 'dinner' && !st.arrivedDinner) || (P.ph === 'show' && !st.visited.theatre))) {
      const b = Math.round(P.buffer);
      const optLeft = P.chain.filter((s) => s.optional && !isDone(s.id));
      if (b >= 6) {
        cls = 'ok'; txt = `🟢 Zapas ${b} min · dojście ~${Math.round(P.eta)} min`;
        const bonus = suggestBonus(P);
        if (b >= 14 && bonus) { cls = 'info'; txt = `🦇 Zapas ${b} min — zahaczcie o: ${bonus.emoji} ${bonus.name} ›`; pill.onclick = () => setManual(bonus.id); }
      } else if (b >= 0) { cls = 'warn'; txt = `🟡 Na styk — ${b} min zapasu`; if (optLeft.length) { txt += ' · ✂️ skrócić?'; pill.onclick = trimRoute; } }
      else { cls = 'late'; txt = `🔴 Spóźnienie ~${-b} min`; if (optLeft.length) { txt += ' — dotknij, by skrócić trasę ✂️'; pill.onclick = trimRoute; } else txt += ' — szybszym krokiem!'; }
    } else if (P.ph === 'dinner' && st.arrivedDinner) {
      cls = 'info'; txt = '🍷 Przy stole · wyjście ' + hhmm(S.leaveDinner) + ' · 🕯️ opowieść przy stole ›'; pill.onclick = tableTale;
    } else if (P.ph === 'show' && st.visited.theatre) {
      cls = 'info'; txt = '🤫 Wyciszcie telefony. Morticia patrzy.';
    } else if (P.ph === 'home') { cls = 'info'; txt = '🚗 Dobranoc! Sprawdźcie, czy nikt nie idzie za wami…'; }
    pill.className = 'status-pill ' + (txt ? 'show ' + cls : '');
    pill.textContent = txt;

    // Karta
    const card = $('#card'), o = origin();
    const kicker = $('#cKicker'), name = $('#cName'), sub = $('#cSub'), dEl = $('#cDist'), eEl = $('#cEta');
    const storyBtn = $('#storyBtn'), navBtn = $('#navBtn'), hereBtn = $('#hereBtn'), skipBtn = $('#skipBtn');
    $('#compass').classList.toggle('arrived', !t);
    if (t) {
      const d = dist(o, t);
      const isStop = !!stopById[t.id] && !(t.id in D.places);
      kicker.textContent = st.manual ? '🎯 Wybrany cel' : t.id === 'dinner' ? (P.ph === 'dinner' ? '🏃 Już czas!' : 'Finał spaceru') : t.id === 'garage' ? 'Ostatnia prosta' : t.id === 'theatre' ? '🎭 Spektakl o 19:00' : (t.phase === 'night' ? 'Nocna trasa' : 'Następny przystanek') + (t.num ? ` · ${t.num}` : '');
      name.textContent = `${t.emoji} ${t.name}`;
      sub.textContent = (t.placeholder ? '⚠️ ' : '') + (t.sub || t.addr || '');
      dEl.textContent = fmtDist(d);
      eEl.textContent = `~${Math.max(1, Math.round(walkMin(d)))} min pieszo` + (me ? '' : ' (szac.)');
      storyBtn.style.display = isStop ? '' : 'none';
      storyBtn.onclick = () => openStory(t.id);
      navBtn.style.display = '';
      navBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&travelmode=walking`;
      hereBtn.style.display = '';
      hereBtn.textContent = '✋ Jesteśmy!';
      hereBtn.onclick = () => { if (t.id === 'dinner') arriveDinner(false); else if (t.id === 'garage') { st.manual = null; save(); A.play('creak'); toast('🚗 Koniec. Albo… początek? Dobranoc! 🖤'); confetti('🦇'); } else arrive(t.id, false); };
      skipBtn.style.display = isStop && !t.isPlace ? '' : 'none';
      skipBtn.onclick = () => { st.skipped[t.id] = 1; if (st.manual === t.id) st.manual = null; save(); A.play('pop'); toast(`⏭ Pominięto: ${t.name}. Duchy zapamiętają.`); refreshMarkers(); render(); };
      tgtLine.setLatLngs([[o.lat, o.lng], [t.lat, t.lng]]);
    } else {
      tgtLine.setLatLngs([]);
      skipBtn.style.display = 'none';
      if (P.ph === 'dinner') {
        kicker.textContent = 'Smacznego 🍷';
        name.textContent = '🍽️ Przy stole';
        sub.textContent = `O ${hhmm(S.leaveDinner)} nocny spacer do teatru (${fmtDist(dist(D.places.dinner, stopById.theatre))})`;
        dEl.textContent = fmtDur(S.leaveDinner - P.m); eEl.textContent = 'do wyjścia';
        storyBtn.style.display = ''; storyBtn.textContent = '🕯️ Opowieść'; storyBtn.onclick = tableTale;
        navBtn.style.display = 'none';
        hereBtn.style.display = ''; hereBtn.textContent = '🎃 Bingo'; hereBtn.onclick = openBingo;
      } else if (P.ph === 'show') {
        kicker.textContent = 'The Addams Family';
        name.textContent = '🎭 Spektakl';
        sub.textContent = 'Wyciszcie telefony. Wrócę po przedstawieniu.';
        dEl.textContent = hhmm(S.showEnd); eEl.textContent = 'koniec ok.';
        storyBtn.style.display = ''; storyBtn.textContent = '📜 O teatrze'; storyBtn.onclick = () => openStory('theatre');
        navBtn.style.display = 'none'; hereBtn.style.display = 'none';
      }
    }
    if (t) storyBtn.textContent = '📜 Opowieść';
    // ambient wyciszony w teatrze
    if (P.ph === 'show' && st.visited.theatre) A.stopAmbient();
    // badge
    $('#soulBadge').textContent = st.souls;
    // markery przy zmianie celu
    const key = (t && t.id) + '|' + P.ph;
    if (key !== lastPlanKey) { lastPlanKey = key; refreshMarkers(); }
    renderArrow();
    document.documentElement.style.setProperty('--card-h', card.offsetHeight + 'px');
  }
  function suggestBonus(P) {
    if (P.ph !== 'walk' && P.ph !== 'night') return null;
    const o = origin();
    const cands = D.stops.filter((s) => s.phase === 'bonus' && !isDone(s.id)).map((s) => ({ s, d: dist(o, s) })).filter((x) => x.d < 350).sort((a, b) => a.d - b.d);
    return cands.length ? cands[0].s : null;
  }
  function trimRoute() {
    const P = planInfo();
    const opts = P.chain.filter((s) => s.optional && !isDone(s.id));
    if (!opts.length) return;
    // pomijaj najdalsze opcjonalne aż zapas będzie dodatni
    opts.sort((a, b) => dist(origin(), b) - dist(origin(), a));
    const skipped = [];
    for (const s of opts) { st.skipped[s.id] = 1; skipped.push(s.name); if (planInfo().buffer >= 3) break; }
    save(); A.play('creak');
    toast('✂️ Pominięto: ' + skipped.join(', ') + '. Duchy wybaczą… może.');
    refreshMarkers(); render();
  }

  // ---------------- Arkusze ----------------
  function openSheet(html, onMount) {
    $('#sheetBody').innerHTML = html;
    $('#sheetWrap').classList.remove('hidden');
    $('#sheet').scrollTop = 0;
    if (onMount) onMount($('#sheetBody'));
  }
  function closeSheet() { $('#sheetWrap').classList.add('hidden'); render(); }
  document.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeSheet));

  function openStory(id) {
    const s = stopById[id]; if (!s) return;
    A.play('creak');
    const got = !!st.visited[id];
    const q = s.quiz, qa = st.quiz[id];
    const html = `
      <div class="s-hero"><div class="s-emoji">${s.emoji}</div>
        <h2 class="s-title">${s.name}</h2><div class="s-sub">${s.sub}</div>
        <span class="chip">⏳ ${s.era}</span> ${got ? '<span class="chip seal">✔ pieczęć zdobyta</span>' : ''}
      </div>
      <div class="s-text">${s.story.map((p) => `<p>${p}</p>`).join('')}</div>
      <div class="box dark"><h4>🩸 Mroczna strona</h4><p class="blur-reveal ${st.eggs['dark_' + id] ? 'revealed' : ''}" data-reveal="dark_${id}">${s.dark}</p>
        ${st.eggs['dark_' + id] ? '' : '<div class="reveal-hint">Dotknij, jeśli masz odwagę…</div>'}</div>
      <div class="box legend"><h4>👻 Legenda</h4><p>${s.legend}</p></div>
      ${s.bonusFact ? `<div class="box fact"><h4>🌙 A przy okazji</h4><p>${s.bonusFact}</p></div>` : ''}
      ${s.ritual ? `<button class="btn ecto ritual" id="ritualBtn">${s.ritual.label}</button>` : ''}
      ${q ? `<div class="box quiz"><h4>🔮 Pytanie od ducha</h4><div class="q">${q.q}</div><div class="opts">
        ${q.a.map((a, i) => `<button class="opt ${qa != null ? (i === q.ok ? 'right' : i === qa ? 'wrong' : '') : ''}" data-i="${i}" ${qa != null ? 'disabled' : ''}>${a}</button>`).join('')}
        </div><div class="why" id="why">${qa != null ? (qa === q.ok ? '✅ ' : '💀 ') + q.why : ''}</div></div>` : ''}
      <div class="links">${(s.links || []).map((l) => `<a href="${l.u}" target="_blank" rel="noopener">↗ ${l.t}</a>`).join('')}</div>
      <div class="s-actions">
        ${got ? '' : `<button class="btn primary" id="claimBtn">✋ Jesteśmy tutaj</button>`}
        <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=walking">🧭 Trasa</a>
      </div>
      ${got ? '' : '<div class="claim-note">Pieczęć odblokuje się sama, gdy podejdziecie bliżej (lub dotknijcie — system honorowy 👻).</div>'}`;
    openSheet(html, (root) => {
      root.querySelectorAll('[data-reveal]').forEach((el) => el.addEventListener('click', () => {
        if (el.classList.contains('revealed')) return;
        el.classList.add('revealed'); st.eggs[el.dataset.reveal] = 1; save();
        const h = el.parentElement.querySelector('.reveal-hint'); if (h) h.remove();
        A.play('heartbeat', 2); vibrate([30, 80, 30]);
      }));
      const rb = root.querySelector('#ritualBtn');
      if (rb) rb.addEventListener('click', () => doRitual(s, rb));
      root.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => answer(s, Number(b.dataset.i), root)));
      const cb = root.querySelector('#claimBtn');
      if (cb) cb.addEventListener('click', () => { arrive(id, false); openStory(id); });
    });
  }
  function doRitual(s, btn) {
    const r = s.ritual;
    A.play(r.fx);
    const fxEmoji = { candle: '🕯️', balloon: '🎈', lightning: '⚡', bell: '🔔', ghost: '👻', drum: '⚔️', duel: '💥', hooves: '🐎', heartbeat: '🫀', flash: '📸', stone: '🪨', scream: '😱', snap: '🫰' }[r.fx] || '✨';
    if (r.fx === 'lightning' || r.fx === 'flash') flash();
    if (r.fx === 'snap') A.play('addams');
    if (r.fx === 'duel') setTimeout(() => { A.play('pop'); flash(); }, 900);
    floatFx(fxEmoji);
    vibrate(r.fx === 'heartbeat' ? [80, 120, 80, 500, 80, 120, 80] : [40]);
    if (!st.ritual[s.id]) { st.ritual[s.id] = 1; addSouls(2); save(); }
    btn.textContent = r.done;
  }
  function answer(s, i, root) {
    if (st.quiz[s.id] != null) return;
    st.quiz[s.id] = i; const ok = i === s.quiz.ok;
    addSouls(ok ? 5 : 1); save();
    root.querySelectorAll('.opt').forEach((b, k) => { b.disabled = true; if (k === s.quiz.ok) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
    root.querySelector('#why').innerHTML = (ok ? '✅ Duch kiwa głową. +5 dusz. ' : '💀 Duch chichocze. +1 dusza za odwagę. ') + s.quiz.why;
    if (ok) { A.play('chime'); floatFx('✨'); } else { A.play('ghost'); vibrate([200]); }
  }

  // Plan
  function openPlan() {
    const now = nowMin(); const t = target();
    const row = (time, emoji, label, sub, cls, id) => `<li class="${cls || ''}" ${id ? `data-go="${id}"` : ''}><span class="t">${time}</span><span class="dot"></span><span class="lbl">${emoji} <b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span></li>`;
    const stCls = (s) => (st.visited[s.id] ? 'done' : st.skipped[s.id] ? 'skipped' : t && t.id === s.id ? 'current' : '');
    // szacowane godziny trasy spacerowej
    let clock = S.meet, pos = stopById.wash;
    const walkRows = D.walkOrder.map((id, i) => {
      const s = stopById[id];
      if (i > 0) clock += walkMin(dist(pos, s));
      const r = row(i === 0 ? hhmm(S.meet) : '~' + hhmm(clock), s.emoji, s.name + (s.optional ? '<span class="opt-tag">opcjonalny</span>' : ''), s.sub, stCls(s) + (i === 0 ? ' milestone' : ''), s.id);
      clock += s.dwell; pos = s; return r;
    }).join('');
    const nightRows = D.nightOrder.filter((id) => !stopById[id].isPlace).map((id) => { const s = stopById[id]; return row('', s.emoji, s.name + '<span class="opt-tag">opcjonalny</span>', s.sub, stCls(s), s.id); }).join('');
    const bonusRows = D.stops.filter((s) => s.phase === 'bonus').map((s) => row('', s.emoji, s.name, s.sub, stCls(s), s.id)).join('');
    const html = `<div class="s-hero"><div class="s-emoji">🕰️</div><h2 class="s-title">Plan nocy</h2><div class="s-sub">Teraz ${hhmm(now)} · dotknij punktu, by do niego prowadzić</div></div>
      <ul class="plan">
        ${row(hhmm(S.start), '🚗', D.places.garage.name, D.places.garage.addr, 'milestone', 'garage')}
        <h3>Spacer: Washington Sq → Society Hill → South St</h3>
        ${walkRows}
        ${row(hhmm(S.dinner), '🍽️', D.places.dinner.name, D.places.dinner.addr, 'milestone ' + (st.arrivedDinner ? 'done' : t && t.id === 'dinner' ? 'current' : ''), 'dinner')}
        ${row(hhmm(S.sunset), '🌅', 'Zachód słońca', 'Od teraz duchy mają pierwszeństwo', 'milestone')}
        <h3>Nocna trasa do teatru (${hhmm(S.leaveDinner)})</h3>
        ${nightRows}
        ${row(hhmm(S.show), '🎭', 'The Addams Family', 'Walnut Street Theatre, 825 Walnut St', 'milestone ' + stCls(stopById.theatre), 'theatre')}
        ${row('~' + hhmm(S.showEnd), '🚗', 'Powrót na parking', D.places.garage.addr, 'milestone', 'garage')}
        <h3>Bonusy — gdy jest zapas</h3>
        ${bonusRows}
      </ul>
      ${Object.keys(st.skipped).length ? '<button class="btn ghostly" id="unskip" style="width:100%;margin-top:14px">↩︎ Przywróć pominięte przystanki</button>' : ''}`;
    openSheet(html, (root) => {
      root.querySelectorAll('[data-go]').forEach((li) => li.addEventListener('click', () => {
        const id = li.dataset.go;
        if (stopById[id] && st.skipped[id]) { delete st.skipped[id]; save(); }
        closeSheet(); setManual(id);
        const s = stopById[id] || D.places[id]; map.flyTo([s.lat, s.lng], 17, { duration: 0.8 }); follow = false; $('#locBtn').classList.remove('follow');
      }));
      const u = root.querySelector('#unskip');
      if (u) u.addEventListener('click', () => { st.skipped = {}; save(); refreshMarkers(); openPlan(); });
    });
  }

  // Księga dusz
  const RANKS = [[0, 'Zabłąkana dusza'], [30, 'Uczeń grabarza'], [70, 'Łowca duchów'], [120, 'Medium z Society Hill'], [180, 'Kuzyn Itt'], [240, 'Członek rodziny Addamsów']];
  function rankOf(n) { let r = RANKS[0], next = null; RANKS.forEach((x, i) => { if (n >= x[0]) { r = x; next = RANKS[i + 1] || null; } }); return { r, next }; }
  function openBook() {
    const { r, next } = rankOf(st.souls);
    const seals = D.stops.map((s) => `<div class="seal ${st.visited[s.id] ? 'got' : ''}" data-story="${s.id}">${s.emoji}<small>${s.name}</small></div>`).join('');
    const html = `<div class="s-hero"><div class="s-emoji">📖</div><h2 class="s-title">Księga dusz</h2></div>
      <div class="rank"><div class="souls">${st.souls} 👻</div><div class="title">${r[1]}</div>
        <div class="next">${next ? `Do rangi „${next[1]}”: ${next[0] - st.souls} dusz` : 'Ranga maksymalna. Wednesday byłaby… obojętna. To komplement.'}</div></div>
      <h3 style="font-size:12px;letter-spacing:.16em;color:var(--violet);text-transform:uppercase">Pieczęcie (${Object.keys(st.visited).filter((k) => stopById[k]).length}/${D.stops.length})</h3>
      <div class="seals">${seals}</div>
      <button class="btn primary" id="taleBtn" style="width:100%;margin-top:30px">🕯️ Opowieść przy stole</button>
      <div class="settings">
        <label class="toggle">🔊 Dźwięki i nastrój <input type="checkbox" id="setSound" ${st.sound ? 'checked' : ''}></label>
        <label class="toggle">😱 Straszaki (jump scare) <input type="checkbox" id="setScares" ${st.scaresOn ? 'checked' : ''}></label>
        <button class="btn ghostly" id="resetBtn">🗑️ Wyczyść postęp na tym telefonie</button>
      </div>
      <div class="credits">Sekrety: dynia lubi być klikana · potrząśnij telefonem · wypatruj Rączki · nie patrzcie na zegar o pełnej godzinie 13 minut…<br>
        Mapa © OpenStreetMap, © CARTO. Historie: NPS, Wikipedia, Philadelphia Society for the Preservation of Landmarks i miejskie legendy (te ostatnie — z przymrużeniem oka 😉).</div>`;
    openSheet(html, (root) => {
      root.querySelectorAll('[data-story]').forEach((el) => el.addEventListener('click', () => openStory(el.dataset.story)));
      root.querySelector('#taleBtn').addEventListener('click', tableTale);
      root.querySelector('#setSound').addEventListener('change', (e) => setSound(e.target.checked));
      root.querySelector('#setScares').addEventListener('change', (e) => { st.scaresOn = e.target.checked; save(); });
      root.querySelector('#resetBtn').addEventListener('click', () => {
        if (!confirm('Na pewno? Duchy zapomną o was.')) return;
        const keep = { sound: st.sound, scaresOn: st.scaresOn, entered: true };
        st = Object.assign(defaultState(), keep); save(); refreshMarkers(); closeSheet();
      });
    });
  }
  let taleIdx = Math.floor(Math.random() * D.tableTales.length);
  function tableTale() {
    taleIdx = (taleIdx + 1) % D.tableTales.length;
    A.play('bell', 165);
    openSheet(`<div class="s-hero"><div class="s-emoji">🕯️</div><h2 class="s-title">Opowieść przy stole</h2><div class="s-sub">Czytajcie na głos. Szeptem.</div></div>
      <div class="s-text"><p>${D.tableTales[taleIdx]}</p></div>
      <button class="btn primary" id="nextTale" style="width:100%">🕯️ Następna</button>`, (root) => {
      root.querySelector('#nextTale').addEventListener('click', tableTale);
    });
  }

  // Bingo
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function openBingo() {
    const html = `<div class="s-hero"><div class="s-emoji">🕸️</div><h2 class="s-title">Upiorne bingo</h2>
      <div class="s-sub">Society Hill na Halloween to festiwal przesady. Wypatrujcie dekoracji i zaznaczajcie!</div></div>
      <div class="bingo" id="bingoGrid"></div><div class="claim-note" id="bingoNote"></div>`;
    openSheet(html, (root) => drawBingo(root));
  }
  function drawBingo(root) {
    const lines = LINES.filter((l) => l.every((i) => st.bingo[i]));
    const inLine = new Set(lines.flat());
    root.querySelector('#bingoGrid').innerHTML = D.bingo.map((b, i) => `<button class="bcell ${st.bingo[i] ? 'on' : ''} ${inLine.has(i) ? 'line' : ''}" data-i="${i}"><span>${b.e}</span>${b.t}</button>`).join('');
    root.querySelector('#bingoNote').textContent = lines.length ? `🎉 Linii: ${lines.length}! ${lines.length >= 8 ? 'PEŁNE BINGO — jesteście legendą Society Hill.' : ''}` : 'Każde pole +2 dusze, każda linia +10.';
    root.querySelectorAll('.bcell').forEach((c) => c.addEventListener('click', () => {
      const i = Number(c.dataset.i);
      const before = LINES.filter((l) => l.every((k) => st.bingo[k])).length;
      st.bingo[i] = !st.bingo[i];
      if (st.bingo[i]) { addSouls(2); A.play('pop'); } else { addSouls(-2); }
      const after = LINES.filter((l) => l.every((k) => st.bingo[k])).length;
      if (after > before) { addSouls(10 * (after - before)); A.play('addams'); confetti('🎃'); vibrate([50, 50, 50, 50, 200]); }
      if (after < before) addSouls(-10 * (before - after));
      save(); drawBingo(root);
    }));
  }

  // ---------------- Efekty ----------------
  let toastTimer = null;
  function toast(html, ms = 4000) {
    const el = $('#toast'); el.innerHTML = html; el.classList.add('show');
    el.querySelectorAll('[data-story]').forEach((b) => b.addEventListener('click', () => { el.classList.remove('show'); openStory(b.dataset.story); }));
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }
  function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
  function addSouls(n, bump = true) {
    st.souls = Math.max(0, st.souls + n);
    const b = $('#soulBadge'); b.textContent = st.souls;
    if (bump && n > 0) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  }
  function floatFx(e) {
    const el = document.createElement('div'); el.className = 'float-fx'; el.textContent = e;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2500);
  }
  function flash() { const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  function confetti(e) {
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('div'); c.className = 'confetti';
      c.textContent = Array.isArray(e) ? e[i % e.length] : (i % 3 ? e : '🦇');
      c.style.left = Math.random() * 100 + 'vw'; c.style.animationDuration = 2 + Math.random() * 2.5 + 's'; c.style.animationDelay = Math.random() * 0.8 + 's';
      document.body.appendChild(c); setTimeout(() => c.remove(), 5500);
    }
  }
  const GHOST_SVG = `<svg viewBox="0 0 200 200"><defs><radialGradient id="gg" cx="50%" cy="40%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#d9e6ff"/><stop offset="1" stop-color="#8aa0c8"/></radialGradient></defs>
    <path d="M100 14c-44 0-70 34-70 78v86l16-14 16 16 16-16 22 18 22-18 16 16 16-16 16 14V92c0-44-26-78-70-78z" fill="url(#gg)"/>
    <ellipse cx="72" cy="86" rx="16" ry="24" fill="#05020a"/><ellipse cx="128" cy="86" rx="16" ry="24" fill="#05020a"/>
    <ellipse cx="100" cy="140" rx="20" ry="28" fill="#05020a"/><circle cx="74" cy="80" r="4" fill="#e0243f"/><circle cx="130" cy="80" r="4" fill="#e0243f"/></svg>`;
  function jumpScare() {
    if (!st.scaresOn || document.hidden) return;
    st.scares++; save();
    const el = $('#scare'); el.innerHTML = GHOST_SVG; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    A.play('scream'); vibrate([300, 50, 300]);
    setTimeout(() => { el.classList.remove('on'); toast('😱 Spokojnie. To tylko Leah sprawdza, czy uważacie. +5 dusz'); addSouls(5); save(); }, 1700);
  }

  // Nietoperze
  function bats(n = 4) {
    const box = $('#bats');
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div'); b.className = 'bat'; b.textContent = '🦇';
      b.style.top = 15 + Math.random() * 55 + 'vh';
      b.style.fontSize = 14 + Math.random() * 16 + 'px';
      b.style.animationDuration = 5 + Math.random() * 4 + 's'; b.style.animationDelay = Math.random() * 1.2 + 's';
      box.appendChild(b); setTimeout(() => b.remove(), 11000);
    }
  }
  // Rączka
  function thingWalk() {
    if (!$('#sheetWrap').classList.contains('hidden') || (phase() === 'show' && st.visited.theatre)) return;
    const t = $('#thing'); t.classList.remove('walk'); void t.offsetWidth; t.classList.add('walk');
    setTimeout(() => t.classList.remove('walk'), 9200);
  }
  $('#thing').addEventListener('click', () => {
    const t = $('#thing'); t.classList.remove('walk');
    A.play('snap', 2); addSouls(3); save(); floatFx('✋');
    const lines = ['Rączka macha do was. +3 dusze.', 'Rączka przybija piątkę. +3 dusze.', 'Rączka mówi (na migi): „Kolacja!”. +3 dusze.', 'Złapana! Rączka jest pod wrażeniem. +3 dusze.'];
    toast('✋ ' + lines[Math.floor(Math.random() * lines.length)]);
    st.eggs.thing = (st.eggs.thing || 0) + 1; save();
  });

  // Easter egg: dynia ×5 → tryb Wednesday
  let pumpkinTaps = 0, pumpkinTimer = null;
  $('#logo').addEventListener('click', () => {
    pumpkinTaps++; A.play('pop');
    clearTimeout(pumpkinTimer); pumpkinTimer = setTimeout(() => { pumpkinTaps = 0; }, 1500);
    if (pumpkinTaps >= 5) {
      pumpkinTaps = 0;
      const on = document.body.classList.toggle('wednesday');
      A.play('addams');
      if (on) {
        toast('🖤 <b>Tryb Wednesday.</b> „Nie uśmiecham się. To jest moja radosna twarz.”' + (st.eggs.wed ? '' : ' +5 dusz'), 5000);
        if (!st.eggs.wed) { st.eggs.wed = 1; addSouls(5); save(); }
      } else toast('🎃 Kolory wróciły. Wednesday jest rozczarowana.');
    }
  });

  // Potrząśnij → duch
  let lastShake = 0;
  function startShake() {
    if (shakeOn) return; shakeOn = true;
    let lx = null, ly = null, lz = null;
    window.addEventListener('devicemotion', (e) => {
      const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
      if (lx != null) {
        const d = Math.abs(a.x - lx) + Math.abs(a.y - ly) + Math.abs(a.z - lz);
        if (d > 38 && Date.now() - lastShake > 8000) {
          lastShake = Date.now();
          A.play('ghost'); floatFx('👻'); vibrate([100, 50, 100]);
          toast('👻 Obudziliście ducha potrząsaniem. ' + (st.eggs.shake ? 'Znowu?!' : '+5 dusz'));
          if (!st.eggs.shake) { st.eggs.shake = 1; addSouls(5); save(); }
        }
      }
      lx = a.x; ly = a.y; lz = a.z;
    });
  }

  // Dźwięk
  function setSound(v) {
    st.sound = v; save(); A.setEnabled(v);
    $('#soundBtn').textContent = v ? '🔊' : '🔇';
    if (v && !(phase() === 'show' && st.visited.theatre)) A.startAmbient(); else A.stopAmbient();
  }
  $('#soundBtn').addEventListener('click', () => { A.init(); setSound(!st.sound); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) A.stopAmbient();
    else if (st.sound && st.entered && !(phase() === 'show' && st.visited.theatre)) A.startAmbient();
  });

  // Przyciski
  $('#locBtn').addEventListener('click', () => {
    startGeo();
    if (me) { follow = !follow; $('#locBtn').classList.toggle('follow', follow); if (follow) map.flyTo([me.lat, me.lng], 17, { duration: 0.6 }); }
    else toast('📍 Szukam was… (zezwól na lokalizację)');
  });
  map.on('dragstart', () => { follow = false; $('#locBtn').classList.remove('follow'); });
  $('#planBtn').addEventListener('click', openPlan);
  $('#bookBtn').addEventListener('click', openBook);
  $('#bingoBtn').addEventListener('click', openBingo);

  // Intro
  function enter(quiet) {
    A.init();
    st.entered = true;
    if (quiet) { st.sound = false; st.scaresOn = false; }
    save();
    A.setEnabled(st.sound); $('#soundBtn').textContent = st.sound ? '🔊' : '🔇';
    if (st.sound) { A.startAmbient(); A.play('bell', 147); }
    requestSensors(); startGeo();
    $('#intro').classList.add('gone');
    setTimeout(() => bats(6), 600);
    render();
  }
  $('#enterBtn').addEventListener('click', () => enter(false));
  $('#quietBtn').addEventListener('click', () => enter(true));
  const ph = [D.places.garage, D.places.dinner].filter((p) => p.placeholder);
  if (ph.length) {
    const w = $('#placeholderWarn'); w.classList.remove('hidden');
    w.textContent = '⚠️ Brak dokładnego adresu: ' + ph.map((p) => p.name.toLowerCase()).join(' i ') + '. Pozycje na mapie są orientacyjne.';
  }
  if (st.entered && qs.get('intro') !== '1') {
    // powracający gość: od razu mapa, dźwięk po pierwszym dotyku
    $('#intro').classList.add('gone');
    $('#soundBtn').textContent = st.sound ? '🔊' : '🔇';
    A.setEnabled(st.sound);
    const resume = () => { A.init(); if (st.sound) A.startAmbient(); requestSensors(); document.removeEventListener('click', resume, true); };
    document.addEventListener('click', resume, true);
    startGeo(); startCompass();
  }

  // ---------------- Pętla ----------------
  let lastMinute = -1, sunsetShown = false;
  setInterval(() => {
    render();
    const m = nowMin(), mi = Math.floor(m);
    if (mi !== lastMinute) {
      lastMinute = mi;
      if (mi % 60 === 13 && st.entered) { A.play('creak'); bats(3); }
      if (!sunsetShown && mi === S.sunset && st.entered) { sunsetShown = true; A.play('thunder'); flash(); toast('🌅 Słońce zaszło. Teraz zaczyna się prawdziwa zabawa…', 6000); }
      if (mi === S.leaveDinner - 10 && st.arrivedDinner) { A.play('bell', 196); toast('⏰ Za 10 min wychodzimy — rachunek! 🎭', 8000); vibrate([200, 100, 200]); }
      if (mi === S.show - 15 && !st.visited.theatre) { A.play('bell', 220); toast('🎭 Kurtyna za 15 minut!', 8000); vibrate([200, 100, 200]); }
    }
  }, 1000);
  setInterval(() => { if (st.entered && Math.random() < 0.5) bats(2 + Math.floor(Math.random() * 3)); }, 40000);
  (function scheduleThing() { setTimeout(() => { if (st.entered) thingWalk(); scheduleThing(); }, (150 + Math.random() * 200) * 1000); })();
  setTimeout(() => { if (st.entered) thingWalk(); }, 45000);

  if (simLL) { drawMe(); checkArrivals(); }
  render();
  window.addEventListener('resize', render);
  // debug
  window.__spooky = { st: () => st, planInfo, target, arrive, jumpScare, thingWalk, setMe: (lat, lng) => { me = { lat, lng, acc: 5 }; drawMe(); checkArrivals(); render(); } };
})();

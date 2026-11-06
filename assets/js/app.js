(function () {
  'use strict';

  /* =========================================================
     Utilidades de formato (los datos del cliente no se tocan:
     solo se les da formato al mostrarlos)
     ========================================================= */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function limpio(v) {
    if (v == null) return '';
    return String(v).replace(/\s+/g, ' ').trim();
  }
  function miles(n) {
    var neg = n < 0, s = String(Math.abs(n)).split('.');
    var ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + ent + (s[1] ? ',' + s[1] : '');
  }
  // Precio: número tal cual; textos tipo "40,000,000" o "900,000.00" se leen como número.
  function precioNum(v) {
    if (typeof v === 'number') return v;
    var s = limpio(v);
    if (!s || !/^[\d.,\s]+$/.test(s)) return null;
    s = s.replace(/\s/g, '');
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');          // 40,000,000 / 900,000.00
    else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); // 3.500.000,00
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  function moneda(m) {
    var s = slug(m) + ' ' + String(m || '');
    if (/eur|€/i.test(s)) return 'EUR';
    if (/usd|dolar|dollar|us\$/i.test(s)) return 'USD';
    return limpio(m);
  }
  function precioTxt(a) {
    if (a.precio == null) return 'Precio a consultar';
    var n = Math.round(a.precio * 100) / 100;
    if (a.moneda === 'USD') return 'US$ ' + miles(n);
    if (a.moneda === 'EUR') return miles(n) + ' €';
    return miles(n) + (a.moneda ? ' ' + a.moneda : '');
  }
  function categoriaTxt(v) {
    var s = limpio(v);
    if (!s || /^(n\/?a|no especificad[ao]|-|—)$/i.test(s)) return '';
    if (/^\d$/.test(s)) return s + (s === '1' ? ' estrella' : ' estrellas');
    var m = s.match(/^1900-01-0(\d)/);                    // número convertido en fecha por la hoja de cálculo
    if (m) return m[1] + ' estrellas';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function habInfo(v) {
    if (v == null || limpio(v) === '') return null;
    if (typeof v === 'number') return { label: 'Habitaciones', txt: miles(v) };
    var s = limpio(v);
    if (/^\d+$/.test(s)) return { label: 'Habitaciones', txt: miles(+s) };
    var sup = /terreno|m2|m²|\bha\b|hect/i.test(s) && !/hab|cab|apto|bung/i.test(s);
    return { label: sup ? 'Superficie' : 'Habitaciones', txt: s };
  }
  function habNumerica(v) {
    if (typeof v === 'number') return v;
    var s = limpio(v);
    return /^\d+$/.test(s) ? +s : 0;
  }
  function paisTxt(p) {
    var s = limpio(p);
    if (/^united states|^usa$|^ee\.?uu/i.test(s)) return 'Estados Unidos';
    return s;
  }
  function linkify(t) {
    return esc(t).replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  /* =========================================================
     Tipos de activo (agrupación para filtros y colores)
     ========================================================= */
  var TIPOS = {
    hotel:   { label: 'Hoteles y complejos',   color: '#003F79' },
    obra:    { label: 'En obra / proyecto',    color: '#D50926' },
    reforma: { label: 'Cerrado / para reforma', color: '#B45309' },
    suelo:   { label: 'Suelo y terrenos',      color: '#3F6B0B' },
    otros:   { label: 'Otros activos',         color: '#475569' }
  };
  function tipoKey(tipo, cat) {
    var t = limpio(tipo).toLowerCase();
    if (!t || t === 'otro') t = limpio(cat).toLowerCase();
    if (/terreno|suelo|predio/.test(t)) return 'suelo';
    if (/semiconstruido|proyecto/.test(t)) return 'obra';
    if (/cerrado|reforma|convertible/.test(t)) return 'reforma';
    if (/hotel|resort|apart|villa|complejo|cabañ|boutique/.test(t)) return 'hotel';
    return 'otros';
  }

  var ICO = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  /* =========================================================
     Datos
     ========================================================= */
  var FOTOS = window.FOTOS || { activos: {}, destinos: {}, destino_de: {} };
  var ORDEN_PAIS = ['argentina', 'republica-dominicana', 'espana', 'venezuela', 'estados-unidos', 'grecia', 'mexico', 'chile', 'paraguay'];
  var ANCLA = {               // posición de la burbuja de país en la vista mundial
    'venezuela': [5.8, -64.6], 'republica-dominicana': [19.8, -70.6], 'estados-unidos': [29.6, -83.6],
    'espana': [40.0, -3.7], 'mexico': [24.6, -110.8], 'argentina': [-37.6, -63.2], 'chile': [-30.5, -70.9],
    'paraguay': [-21.8, -56.8], 'grecia': [39.8, 22.0]
  };

  var lista = (window.ACTIVOS || []).map(function (r, i) {
    var ref = limpio(r['Referencia Consultoría']);
    var g = r._geo || {};
    var pais = paisTxt(r['País']);
    var a = {
      i: i, id: slug(ref), ref: ref,
      pais: pais, pk: slug(pais),
      zonaOrig: limpio(r['Ciudad / Zona genérica']),
      zona: g.zona || limpio(r['Ciudad / Zona genérica']),
      region: g.region || '',
      ll: [g.lat, g.lng],
      tipo: limpio(r['Tipo de activo']),
      cat: categoriaTxt(r['Categoría / Estrellas']),
      hab: habInfo(r['Habitaciones (rango orientativo)']),
      habN: habNumerica(r['Habitaciones (rango orientativo)']),
      precio: precioNum(r['Precio']),
      moneda: moneda(r['Moneda']),
      operacion: limpio(r['Tipo de operación']),
      estado: limpio(r['Estado comercial']),
      obs: limpio(r['Observaciones']),
      num: parseInt(ref.replace(/\D/g, ''), 10) || 0
    };
    a.tk = tipoKey(r['Tipo de activo'], r['Categoría / Estrellas']);
    a.titulo = (a.tipo && !/^otros?$/i.test(a.tipo)) ? a.tipo : (a.cat || a.tipo || 'Activo hotelero');
    a.fotos = (FOTOS.activos && FOTOS.activos[ref]) || [];
    var dk = FOTOS.destino_de && FOTOS.destino_de[ref];
    a.dest = dk && FOTOS.destinos[dk] ? FOTOS.destinos[dk].fotos : [];
    return a;
  }).sort(function (x, y) {
    return (ORDEN_PAIS.indexOf(x.pk) - ORDEN_PAIS.indexOf(y.pk)) || x.ref.localeCompare(y.ref, 'es', { numeric: true });
  });
  var byId = {};
  lista.forEach(function (a) { byId[a.id] = a; });

  var PAISES = [];
  lista.forEach(function (a) { if (PAISES.indexOf(a.pk) < 0) PAISES.push(a.pk); });
  var paisNombre = {};
  lista.forEach(function (a) { paisNombre[a.pk] = a.pais; });

  // Resumen honesto: solo se suman las habitaciones que vienen como número
  (function resumen() {
    var hab = lista.reduce(function (s, a) { return s + a.habN; }, 0);
    $('#st-activos').textContent = lista.length;
    $('#st-paises').textContent = PAISES.length;
    if (hab > 0) $('#st-hab').textContent = '+' + miles(hab);
    else $('#st-hab-box').hidden = true;
  })();

  /* =========================================================
     Fotos y placeholders
     ========================================================= */
  function placeholder(a, size) {
    return '<div class="ph ' + (size || '') + '">' + ICO.hotel + '<strong>' + esc(a.zona) + '</strong><span>' + esc(a.pais) + '</span></div>';
  }
  window.__imgFail = function (img) {
    var a = byId[img.getAttribute('data-id')];
    var size = img.getAttribute('data-size') || '';
    var wrap = document.createElement('div');
    wrap.innerHTML = placeholder(a, size);
    img.replaceWith(wrap.firstChild);
  };
  function img(src, a, alt, size, eager) {
    return '<img ' + (eager ? '' : 'loading="lazy" ') + 'decoding="async" src="' + esc(src) + '" alt="' + esc(alt) +
      '" data-id="' + a.id + '" data-size="' + (size || '') + '" onerror="__imgFail(this)">';
  }
  function portada(a, size, eager) {
    var src = a.fotos[0] || a.dest[0];
    return src ? img(src, a, a.titulo + ' · ' + a.zona, size, eager) : placeholder(a, size);
  }

  /* =========================================================
     Filtros
     ========================================================= */
  var filtro = { pais: '', region: '', tipo: '' };
  function pasa(a, ignorar) {
    return (ignorar === 'pais' || !filtro.pais || a.pk === filtro.pais) &&
      (ignorar === 'region' || !filtro.region || a.region === filtro.region) &&
      (ignorar === 'tipo' || !filtro.tipo || a.tk === filtro.tipo);
  }
  function filtrados() { return lista.filter(function (a) { return pasa(a); }); }

  function chip(g, k, label, n, color) {
    var on = filtro[g] === k;
    return '<button type="button" class="chip" data-g="' + g + '" data-k="' + esc(k) + '" aria-pressed="' + on + '"' + (n === 0 && !on ? ' disabled' : '') + '>' +
      (color ? '<span class="dot" style="background:' + color + '"></span>' : '') + esc(label) +
      (n != null ? '<span class="n">' + n + '</span>' : '') + '</button>';
  }
  function renderFiltros() {
    var cuenta = function (g, test) { return lista.filter(function (a) { return pasa(a, g) && test(a); }).length; };
    var cp = function (test) { return lista.filter(function (a) { return (!filtro.tipo || a.tk === filtro.tipo) && test(a); }).length; };
    var h = chip('pais', '', 'Todos', cp(function () { return true; }));
    PAISES.forEach(function (p) { h += chip('pais', p, paisNombre[p], cp(function (a) { return a.pk === p; })); });
    $('#f-pais').innerHTML = h;

    var g = $('#g-region');
    if (filtro.pais) {
      var regs = [];
      lista.forEach(function (a) { if (a.pk === filtro.pais && regs.indexOf(a.region) < 0) regs.push(a.region); });
      if (regs.length > 1) {
        var rh = chip('region', '', 'Todas', cuenta('region', function (a) { return a.pk === filtro.pais; }));
        regs.forEach(function (r) { rh += chip('region', r, r, cuenta('region', function (a) { return a.region === r; })); });
        $('#f-region').innerHTML = rh;
      } else {
        $('#f-region').innerHTML = '<p class="hint">' + esc(paisNombre[filtro.pais]) + ': una sola zona (' + esc(regs[0]) + ').</p>';
      }
    } else {
      $('#f-region').innerHTML = '<p class="hint">Elige un país para ver sus zonas.</p>';
    }
    g.hidden = false;

    var th = chip('tipo', '', 'Todos', cuenta('tipo', function () { return true; }));
    Object.keys(TIPOS).forEach(function (k) {
      th += chip('tipo', k, TIPOS[k].label, cuenta('tipo', function (a) { return a.tk === k; }), TIPOS[k].color);
    });
    $('#f-tipo').innerHTML = th;

    var extra = (filtro.region ? 1 : 0) + (filtro.tipo ? 1 : 0);
    $('#f-badge').hidden = !extra;
    $('#f-badge').textContent = extra;
    $('#f-ok-n').textContent = filtrados().length;
    $('#reset').hidden = !filtro.pais && !filtro.region && !filtro.tipo;
  }

  /* =========================================================
     Mapa
     ========================================================= */
  var Z_PAIS = 5;                      // por debajo: una burbuja por país
  var isMobile = function () { return window.matchMedia('(max-width: 820px)').matches; };
  var MUNDO = L.latLngBounds([[-41, -114], [48, 25]]);

  var map = L.map('map', {
    zoomControl: false, zoomSnap: 0.25, zoomDelta: 1, wheelPxPerZoomLevel: 90,
    minZoom: 1, maxZoom: 18, worldCopyJump: false,
    maxBounds: [[-72, -200], [84, 200]], maxBoundsViscosity: 0.8, tap: true
  });
  map.setView([15, -45], 2);
  L.control.zoom({ position: 'topright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(map);
  var ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
  L.tileLayer(ESRI + 'World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16, maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap'
  }).addTo(map);
  L.tileLayer(ESRI + 'World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16, maxZoom: 19, pane: 'shadowPane'
  }).addTo(map);

  function headerH() { return $('.topbar').getBoundingClientRect().bottom; }
  function trayH() { var t = $('#tray'); return t.hidden ? 0 : t.getBoundingClientRect().height + 12; }
  function pads(extra) {
    extra = extra || 0;
    var top = headerH() + 80 + extra, bottom = (trayOpen ? trayH() + 50 : 90) + extra, side = (isMobile() ? 20 : 60) + extra;
    return { paddingTopLeft: [side, top], paddingBottomRight: [side, bottom] };
  }
  function vistaMundo(animate) {
    var o = pads(); o.animate = !!animate; o.duration = 1.0;
    if (animate) map.flyToBounds(MUNDO, o); else map.fitBounds(MUNDO, o);
  }

  // --- Marcadores individuales y clúster por zona
  function pinIcon(a, active) {
    var c = TIPOS[a.tk].color;
    return L.divIcon({
      className: '',
      html: '<div class="pin' + (active ? ' active' : '') + '"><svg viewBox="0 0 30 38"><path d="M15 37C15 37 28.5 24 28.5 14.2A13.5 13.5 0 1 0 1.5 14.2C1.5 24 15 37 15 37Z" fill="' + c + '" stroke="#fff" stroke-width="2.4"/><circle cx="15" cy="14" r="5" fill="#fff"/></svg></div>',
      iconSize: [30, 38], iconAnchor: [15, 37], popupAnchor: [0, -34]
    });
  }
  var cluster = L.markerClusterGroup({
    showCoverageOnHover: false, zoomToBoundsOnClick: false, maxClusterRadius: 52, spiderfyOnMaxZoom: true, spiderfyDistanceMultiplier: 1.6,
    iconCreateFunction: function (c) {
      var n = c.getChildCount(), s = n > 9 ? 50 : 44;
      return L.divIcon({ html: '<div class="cluster" style="width:' + s + 'px;height:' + s + 'px">' + n + '</div>', className: '', iconSize: [s, s] });
    }
  });

  function popupHTML(a) {
    var hab = a.hab ? '<div><small>' + a.hab.label + '</small><b title="' + esc(a.hab.txt) + '">' + esc(a.hab.txt) + '</b></div>' : '';
    return '<div class="pop-img">' + portada(a, 'sm', true) + '</div>' +
      '<div class="pop-body"><span class="pop-ref">' + esc(a.ref) + '</span>' +
      '<h4>' + esc(a.titulo) + '</h4>' +
      '<p class="pop-z">' + esc(a.zona) + ' · ' + esc(a.pais) + '</p>' +
      '<div class="pop-facts">' + hab + '<div><small>Precio</small><b title="' + esc(precioTxt(a)) + '">' + esc(precioTxt(a)) + '</b></div></div>' +
      '<button class="btn btn-red" type="button" data-ficha="' + a.id + '">Ver ficha completa</button></div>';
  }

  var markers = {}, activeId = null;
  lista.forEach(function (a) {
    var m = L.marker(a.ll, { icon: pinIcon(a), title: a.ref + ' · ' + a.titulo, riseOnHover: true, keyboard: true });
    m.bindPopup(function () { return popupHTML(a); }, { className: 'rp-pop', maxWidth: 260, minWidth: 236, closeButton: true, autoPan: false });
    m.on('click', function () { setActive(a.id); });
    m.on('popupopen', function () { panPopup(m); });
    m._rp = a;
    markers[a.id] = m;
  });

  function panPopup(m) {
    // Asegura que el popup quede visible entre la cabecera y la bandeja
    setTimeout(function () {
      var p = m.getPopup(), el = p && p.getElement();
      if (!el) return;
      var r = el.getBoundingClientRect();
      var top = headerH() + 56, bottom = window.innerHeight - (trayOpen ? trayH() : 16) - 8;
      var dx = 0, dy = 0;
      if (r.top < top) dy = r.top - top;
      else if (r.bottom > bottom) dy = Math.min(r.bottom - bottom, r.top - top);
      if (r.left < 10) dx = r.left - 10; else if (r.right > window.innerWidth - 10) dx = r.right - (window.innerWidth - 10);
      if (dx || dy) map.panBy([dx, dy], { animate: true, duration: .35 });
    }, 30);
  }

  // --- Burbujas por país (vista lejana)
  var paisLayer = L.layerGroup();
  function renderPaises() {
    paisLayer.clearLayers();
    var mob = isMobile();
    PAISES.forEach(function (p) {
      var items = lista.filter(function (a) { return a.pk === p && pasa(a, 'pais'); });
      if (!items.length || (filtro.pais && filtro.pais !== p)) return;
      var n = items.length;
      var s = Math.round((mob ? 26 : 40) + Math.min(n, 25) * (mob ? .4 : .7));
      var icon = L.divIcon({
        className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2],
        html: '<div class="country"><div class="bub" style="width:' + s + 'px;height:' + s + 'px;font-size:' + (s > 44 ? 17 : s < 32 ? 13 : 15) + 'px">' + n + '</div><span class="lbl">' + esc(paisNombre[p]) + '</span></div>'
      });
      var ll = ANCLA[p] || items[0].ll;
      var mk = L.marker(ll, { icon: icon, title: paisNombre[p] + ': ' + n + (n === 1 ? ' activo' : ' activos'), keyboard: true, riseOnHover: true });
      mk.on('click', function () { selectPais(p, true); });
      paisLayer.addLayer(mk);
    });
  }

  var modo = null;
  function syncModo() {
    var z = map.getZoom();
    var nuevo = z < Z_PAIS ? 'pais' : 'zona';
    map.getContainer().classList.toggle('zoom-lo', z < 3);
    if (nuevo === modo) return;
    modo = nuevo;
    if (modo === 'pais') { map.removeLayer(cluster); map.addLayer(paisLayer); }
    else { map.removeLayer(paisLayer); map.addLayer(cluster); }
  }
  map.on('zoomend', syncModo);

  function setActive(id) {
    if (activeId && markers[activeId]) markers[activeId].setIcon(pinIcon(byId[activeId], false));
    activeId = id;
    $$('.mini.active').forEach(function (c) { c.classList.remove('active'); });
    if (!id) return;
    markers[id].setIcon(pinIcon(byId[id], true));
    var mini = $('#mini-' + id);
    if (mini) { mini.classList.add('active'); mini.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' }); }
  }
  map.on('popupclose', function () { setActive(null); });

  function irA(id) {
    var a = byId[id], m = markers[id];
    map.closePopup();
    var abrir = function () { cluster.zoomToShowLayer(m, function () { m.openPopup(); setActive(id); }); };
    if (map.getZoom() < Z_PAIS || !map.getBounds().contains(a.ll)) {
      map.flyTo(a.ll, Math.max(map.getZoom(), 11), { duration: 1.0 });
      map.once('moveend', function () { syncModo(); abrir(); });
    } else abrir();
  }

  function encuadrar(items) {
    var pts = items.map(function (a) { return a.ll; });
    if (!pts.length) return;
    var o = pads(); o.maxZoom = 10; o.duration = 1.0;
    if (pts.length === 1) map.flyTo(pts[0], 10, { duration: 1.0 });
    else map.flyToBounds(L.latLngBounds(pts).pad(0.05), o);
  }

  /* =========================================================
     Bandeja de resultados
     ========================================================= */
  var trayOpen = false;
  function enVista() {
    var vis = filtrados();
    if (map.getZoom() < Z_PAIS) return vis;
    var b = map.getBounds();
    return vis.filter(function (a) { return b.contains(a.ll); });
  }
  function miniHTML(a) {
    return '<div class="mini' + (a.id === activeId ? ' active' : '') + '" id="mini-' + a.id + '" data-go="' + a.id + '" role="button" tabindex="0" aria-label="' + esc(a.ref + ', ' + a.titulo + ', ' + a.zona) + '">' +
      '<div class="mini-img">' + portada(a, 'sm') + '</div>' +
      '<div class="mini-body"><span class="mini-ref">' + esc(a.ref) + '</span>' +
      '<span class="mini-t">' + esc(a.titulo) + (a.hab && a.hab.label === 'Habitaciones' && /^\d[\d.]*$/.test(a.hab.txt) ? ' · ' + a.hab.txt + ' hab.' : '') + '</span>' +
      '<span class="mini-z">' + esc(a.zona) + ', ' + esc(a.pais) + '</span>' +
      '<span class="mini-p">' + esc(precioTxt(a)) + '</span></div></div>';
  }
  function renderTray() {
    var items = enVista();
    $('#lista-n').textContent = items.length;
    if (!trayOpen) return;
    var t;
    if (filtro.region) t = filtro.region + ' · ' + paisNombre[filtro.pais];
    else if (filtro.pais) t = paisNombre[filtro.pais];
    else t = map.getZoom() < Z_PAIS ? 'Todos los países' : 'En esta vista';
    $('#tray-title').textContent = t;
    $('#tray-count').textContent = items.length === 1 ? '1 activo' : items.length + ' activos';
    var html = items.length ? items.map(miniHTML).join('') :
      '<p class="tray-empty">No hay activos en esta zona del mapa. Aleja el mapa o pulsa el globo para la vista global.</p>';
    var listEl = $('#tray-list');
    var sc = listEl.scrollLeft, prev = listEl.getAttribute('data-k'), key = items.map(function (a) { return a.id; }).join(',');
    if (prev !== key) { listEl.innerHTML = html; listEl.setAttribute('data-k', key); listEl.scrollLeft = 0; }
    else listEl.scrollLeft = sc;
    syncTrayH();
  }
  function syncTrayH() {
    document.documentElement.style.setProperty('--tray-h', (trayOpen ? trayH() : 0) + 'px');
  }
  if (window.ResizeObserver) new ResizeObserver(syncTrayH).observe($('#tray'));
  function openTray() {
    trayOpen = true;
    $('#tray').hidden = false; $('#btn-lista').hidden = true; $('#legend').hidden = true;
    renderTray();
  }
  function closeTray() {
    trayOpen = false;
    $('#tray').hidden = true; $('#btn-lista').hidden = false; $('#legend').hidden = false;
    syncTrayH(); renderTray();
  }
  $('#btn-lista').addEventListener('click', function () {
    openTray();
    if (!filtro.pais && map.getZoom() < Z_PAIS) vistaMundo(true);
  });
  $('#tray-close').addEventListener('click', closeTray);
  var tm;
  map.on('moveend', function () { clearTimeout(tm); tm = setTimeout(renderTray, 80); });
  $('#tray-list').addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) irA(go.getAttribute('data-go'));
  });
  $('#tray-list').addEventListener('keydown', function (e) {
    var go = e.target.closest('[data-go]');
    if (go && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); irA(go.getAttribute('data-go')); }
  });
  cluster.on('clusterclick', function (e) {
    var c = e.layer, b = c.getBounds();
    if (!trayOpen) openTray();
    var o = pads(); o.duration = .9;
    var z = map.getBoundsZoom(b, false, L.point(o.paddingTopLeft).add(o.paddingBottomRight));
    if (b.getNorthEast().equals(b.getSouthWest(), 1e-6) || z > map.getMaxZoom() - 1 || z <= map.getZoom()) {
      if (z <= map.getZoom() && !b.getNorthEast().equals(b.getSouthWest(), 1e-6)) { o.maxZoom = map.getZoom() + 2; map.flyToBounds(b, o); }
      else { map.flyTo(b.getCenter(), Math.max(map.getZoom(), 12), { duration: .9 }); var m0 = c.getAllChildMarkers()[0]; map.once('moveend', function () { var vp = cluster.getVisibleParent(m0); if (vp && vp.spiderfy) vp.spiderfy(); }); }
    } else map.flyToBounds(b, o);
  });

  /* =========================================================
     Aplicar filtros
     ========================================================= */
  function aplicar() {
    var vis = filtrados();
    cluster.clearLayers();
    cluster.addLayers(vis.map(function (a) { return markers[a.id]; }));
    renderPaises();
    if (activeId && !pasa(byId[activeId])) { map.closePopup(); setActive(null); }
    renderFiltros();
    renderTray();
  }
  function selectPais(p, desdeMapa) {
    if (!desdeMapa && filtro.pais === p) p = '';
    filtro.pais = p; filtro.region = '';
    aplicar();
    if (p) { openTray(); encuadrar(filtrados()); }
    else vistaMundo(true);
    var c = $('#f-pais [data-k="' + p + '"]');
    if (c) c.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('.chip');
    if (!c || c.disabled) return;
    var g = c.getAttribute('data-g'), k = c.getAttribute('data-k');
    if (g === 'pais') { selectPais(k); return; }
    filtro[g] = filtro[g] === k ? '' : k;
    aplicar();
    if (g === 'region') { openTray(); encuadrar(filtrados()); }
    else if (filtro.pais) encuadrar(filtrados());
  });
  $('#reset').addEventListener('click', function () {
    filtro.pais = ''; filtro.region = ''; filtro.tipo = '';
    aplicar(); vistaMundo(true);
  });
  $('#btn-world').addEventListener('click', function () { map.closePopup(); vistaMundo(true); });

  // Desplegable de filtros
  var pop = $('#filtros-pop'), fbtn = $('#btn-filtros');
  function togglePop(open) {
    open = open == null ? pop.hidden : open;
    pop.hidden = !open; fbtn.setAttribute('aria-expanded', open);
  }
  fbtn.addEventListener('click', function (e) { e.stopPropagation(); togglePop(); });
  $('#filtros-close').addEventListener('click', function () { togglePop(false); });
  $('#filtros-ok').addEventListener('click', function () { togglePop(false); if (filtrados().length) openTray(); });
  document.addEventListener('click', function (e) {
    if (!pop.hidden && !e.target.closest('#filtros-pop') && !e.target.closest('#btn-filtros')) togglePop(false);
  });
  map.on('movestart', function () { if (!pop.hidden && !isMobile()) togglePop(false); });

  // Leyenda
  $('#legend').innerHTML = Object.keys(TIPOS).map(function (k) {
    return '<div><i style="background:' + TIPOS[k].color + '"></i>' + TIPOS[k].label + '</div>';
  }).join('');

  /* =========================================================
     Ficha completa (modal)
     ========================================================= */
  var ficha = $('#ficha'), fichaBody = $('#ficha-body'), lastFocus = null, fichaId = null;
  function fichaHTML(a) {
    var slides = [], caps = [];
    a.fotos.forEach(function (s) { slides.push(s); caps.push('El activo'); });
    var galDestino = false;
    if (!slides.length && a.dest.length) {
      a.dest.forEach(function (s) { slides.push(s); caps.push('Destino · ' + a.zona); });
      galDestino = true;
    }
    var sl = slides.length ? slides.map(function (s, i) {
      return '<figure class="f-slide">' + img(s, a, a.titulo + ' · foto ' + (i + 1), 'lg', i === 0) + '<figcaption class="f-cap">' + esc(caps[i]) + '</figcaption></figure>';
    }).join('') : '<figure class="f-slide">' + placeholder(a, 'lg') + '</figure>';
    var multi = slides.length > 1;
    var thumbs = multi ? '<div class="f-thumbs" role="tablist" aria-label="Miniaturas">' + slides.map(function (s, i) {
      return '<button type="button" class="f-thumb' + (i ? '' : ' on') + '" data-i="' + i + '" aria-label="Ver foto ' + (i + 1) + '">' + img(s, a, '', 'sm') + '</button>';
    }).join('') + '</div>' : '';

    var datos = [
      ['Tipo de activo', a.tipo], ['Categoría', a.cat],
      [a.hab ? a.hab.label : 'Habitaciones', a.hab ? a.hab.txt : ''],
      ['Tipo de operación', a.operacion], ['Estado comercial', a.estado],
      ['Zona', a.zonaOrig || a.zona], ['País', a.pais],
      ['Moneda', a.moneda === 'USD' ? 'Dólar estadounidense (USD)' : a.moneda === 'EUR' ? 'Euro (EUR)' : a.moneda]
    ].filter(function (d) { return d[1]; });
    var esWide = function (d) { return String(d[1]).length > 26; };
    datos = datos.filter(function (d) { return !esWide(d); }).concat(datos.filter(esWide));
    if (datos.filter(function (d) { return !esWide(d); }).length % 2) datos.forEach(function (d) { if (!esWide(d) && d[0] === 'Moneda') d.wide = 1; });
    var grid = datos.map(function (d) {
      var wide = esWide(d) || d.wide ? ' class="wide"' : '';
      return '<div' + wide + '><dt>' + esc(d[0]) + '</dt><dd>' + esc(d[1]) + '</dd></div>';
    }).join('');

    var dest = '';
    if (!galDestino && (a.dest[0] || a.fotos.length)) {
      dest = '<section class="f-dest"><h3>El destino</h3><figure>' +
        (a.dest[0] ? img(a.dest[0], a, 'Destino: ' + a.zona, 'lg') + '<figcaption>' + esc(a.zona) + ' · ' + esc(a.pais) + '</figcaption>' : placeholder(a, 'lg')) +
        '</figure></section>';
    }

    return '<div class="f-gal">' +
        '<div class="f-main"><div class="f-slides" id="f-slides">' + sl + '</div>' +
        (multi ? '<button type="button" class="f-nav prev" aria-label="Foto anterior" disabled>' + ICO.prev + '</button>' +
          '<button type="button" class="f-nav next" aria-label="Foto siguiente">' + ICO.next + '</button>' +
          '<span class="f-count" id="f-count">1 / ' + slides.length + '</span>' : '') +
        '</div>' + thumbs +
      '</div>' +
      '<div class="f-info">' +
        '<span class="f-ref">' + esc(a.ref) + '</span>' +
        '<h2 id="ficha-title">' + esc(a.titulo) + (a.cat ? ' · ' + esc(a.cat) : '') + '</h2>' +
        '<p class="f-zone">' + ICO.pin + esc(a.zona) + ', ' + esc(a.pais) + '</p>' +
        '<div class="f-price' + (a.precio == null ? ' na' : '') + '"><small>Precio</small><b>' + esc(precioTxt(a)) + '</b></div>' +
        '<dl class="f-grid">' + grid + '</dl>' +
        (a.obs ? '<section class="f-obs"><h3>Observaciones</h3><p>' + linkify(a.obs) + '</p></section>' : '') +
        dest +
        '<div class="f-cta"><button class="btn btn-red" type="button" data-open-form="' + a.id + '">' + ICO.chat + 'Solicitar información</button></div>' +
      '</div>';
  }
  function initGaleria() {
    var box = $('#f-slides', fichaBody);
    if (!box) return;
    var n = box.children.length;
    var prev = $('.f-nav.prev', fichaBody), next = $('.f-nav.next', fichaBody), cnt = $('#f-count', fichaBody);
    var thumbs = $$('.f-thumb', fichaBody);
    function idx() { return Math.round(box.scrollLeft / Math.max(1, box.clientWidth)); }
    function go(i) { box.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * box.clientWidth, behavior: 'smooth' }); }
    function sync() {
      var i = idx();
      if (prev) prev.disabled = i <= 0;
      if (next) next.disabled = i >= n - 1;
      if (cnt) cnt.textContent = (i + 1) + ' / ' + n;
      thumbs.forEach(function (t, k) {
        t.classList.toggle('on', k === i);
        if (k === i) t.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      });
    }
    var tmr;
    box.addEventListener('scroll', function () { clearTimeout(tmr); tmr = setTimeout(sync, 60); }, { passive: true });
    if (prev) prev.addEventListener('click', function () { go(idx() - 1); });
    if (next) next.addEventListener('click', function () { go(idx() + 1); });
    thumbs.forEach(function (t) { t.addEventListener('click', function () { go(+t.getAttribute('data-i')); }); });
    fichaBody._go = function (d) { go(idx() + d); };
  }
  function openFicha(id) {
    var a = byId[id];
    if (!a) return;
    fichaId = id;
    lastFocus = document.activeElement;
    fichaBody.innerHTML = fichaHTML(a);
    fichaBody.scrollTop = 0;
    var info = $('.f-info', fichaBody); if (info) info.scrollTop = 0;
    ficha.hidden = false;
    initGaleria();
    setTimeout(function () { $('.modal-x', ficha).focus({ preventScroll: true }); }, 30);
  }
  function closeFicha() {
    ficha.hidden = true; fichaId = null;
    fichaBody.innerHTML = '';
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var f = e.target.closest('[data-ficha]');
    if (f) { openFicha(f.getAttribute('data-ficha')); return; }
    if (e.target.closest('[data-close-ficha]')) closeFicha();
  });

  /* =========================================================
     Formulario (demostración, no envía nada)
     ========================================================= */
  var modal = $('#modal'), form = $('#lead-form'), ok = $('#lead-ok'), sel = $('#f-activo');
  sel.innerHTML += lista.map(function (a) {
    return '<option value="' + a.id + '">' + esc(a.ref) + ' · ' + esc(a.titulo) + ' · ' + esc(a.zona) + '</option>';
  }).join('');
  var formFocus = null;
  function openForm(id) {
    formFocus = document.activeElement;
    form.hidden = false; ok.hidden = true; form.reset();
    $$('.invalid', form).forEach(function (i) { i.classList.remove('invalid'); });
    sel.value = id || '';
    modal.hidden = false;
    setTimeout(function () { form.nombre.focus({ preventScroll: true }); }, 30);
  }
  function closeForm() {
    modal.hidden = true;
    if (formFocus && document.body.contains(formFocus)) formFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open-form]');
    if (o) { e.stopPropagation(); openForm(o.getAttribute('data-open-form') || ''); return; }
    if (e.target.closest('[data-close]')) closeForm();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = false;
    ['nombre', 'email'].forEach(function (k) {
      var el = form[k], v = el.value.trim();
      var invalid = !v || (k === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      el.classList.toggle('invalid', invalid);
      if (invalid && !bad) { el.focus(); bad = true; }
    });
    if (bad) return;
    form.hidden = true; ok.hidden = false;
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!modal.hidden) closeForm();
      else if (!ficha.hidden) closeFicha();
      else if (!pop.hidden) togglePop(false);
      else map.closePopup();
    } else if (!ficha.hidden && modal.hidden && fichaBody._go && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      fichaBody._go(e.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  /* =========================================================
     Inicio
     ========================================================= */
  function syncHeader() {
    document.documentElement.style.setProperty('--hdr-h', $('.topbar').offsetHeight + 'px');
    syncTrayH();
  }
  syncHeader();
  window.addEventListener('resize', function () { syncHeader(); map.invalidateSize(); renderPaises(); });
  vistaMundo(false);
  renderFiltros();
  aplicar();
  syncModo();
  renderTray();
})();

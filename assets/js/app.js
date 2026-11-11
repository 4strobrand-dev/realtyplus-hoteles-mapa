(function () {
  'use strict';

  /* =========================================================
     Utilidades
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

  /* =========================================================
     Idioma (ES / EN)
     ========================================================= */
  var I18N = window.RP_I18N, T = I18N.ui;
  var LANG = (function () {
    var q = new URLSearchParams(location.search).get('lang');
    if (I18N.idiomas.indexOf(q) >= 0) return q;
    try { var s = localStorage.getItem('rp-lang'); if (I18N.idiomas.indexOf(s) >= 0) return s; } catch (e) {}
    var nav = (navigator.language || 'es').slice(0, 2);
    return I18N.idiomas.indexOf(nav) >= 0 ? nav : 'es';
  })();
  function t(k) { return (T[LANG] && T[LANG][k]) || T.es[k]; }

  function miles(n) {
    var s = (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0).split('.');
    var sep = LANG === 'en' ? ',' : '.', dec = LANG === 'en' ? '.' : ',';
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (s[1] ? dec + s[1] : '');
  }
  function precioTxt(a) {
    if (a.precio == null) return t('consultar');
    if (a.moneda === 'EUR') return LANG === 'en' ? '€' + miles(a.precio) : miles(a.precio) + ' €';
    return 'US$ ' + miles(a.precio);
  }
  function habInfo(a) {
    var s = I18N.texto(a, 'habitaciones', LANG);
    if (!s) return null;
    var sup = /m²|m2|\bha\b|terreno|plot|útiles|usable/i.test(s);
    return { label: sup ? t('sup') : t('habs'), txt: /^\d+$/.test(s) ? miles(+s) : s };
  }

  var COLORS = { hotel: '#003F79', obra: '#D50926', reforma: '#B45309', suelo: '#3F6B0B', otros: '#475569' };
  var ICO = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  /* =========================================================
     Textos fijos de la página
     ========================================================= */
  function aplicarIdioma() {
    var sw = $('.lang-switch');
    if (sw) sw.innerHTML = I18N.idiomas.map(function (l) { return '<button type="button" data-lang="' + l + '">' + l.toUpperCase() + '</button>'; }).join('');
    document.documentElement.lang = LANG;
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    $$('[data-i18n-title]').forEach(function (el) { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); el.setAttribute('aria-label', t(el.getAttribute('data-i18n-title'))); });
    $$('.lang-switch button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === LANG); });
  }
  aplicarIdioma();
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.lang-switch button');
    if (b) {
      var l = b.getAttribute('data-lang');
      if (l === LANG) return;
      try { localStorage.setItem('rp-lang', l); } catch (e) {}
      var u = new URL(location.href); u.searchParams.set('lang', l); location.href = u.toString();
    }
  });

  /* =========================================================
     Carga de datos: Supabase si está configurado; si no, copia local
     ========================================================= */
  var CFG = window.RP_CONFIG || {};
  function cargar() {
    if (CFG.supabaseUrl && CFG.supabaseKey) {
      return fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/activos?select=*&publicado=eq.true&order=orden.asc,referencia.asc', {
        headers: { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + CFG.supabaseKey }
      }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    }
    return fetch('assets/data/activos_publicos.json', { cache: 'no-cache' }).then(function (r) { return r.json(); });
  }
  var loader = $('#loader');
  if (loader) loader.textContent = t('cargando');
  cargar().then(iniciar).catch(function (e) {
    console.error(e);
    if (loader) { loader.textContent = t('errorCarga'); loader.classList.add('err'); }
  });

  /* =========================================================
     Mapa (se monta cuando llegan los datos)
     ========================================================= */
  function iniciar(rows) {
    if (loader) loader.remove();
    var ORDEN_PAIS = ['AR', 'DO', 'ES', 'VE', 'US', 'GR', 'MX', 'CL', 'PY'];
    var ANCLA = {
      VE: [5.8, -64.6], DO: [19.8, -70.6], US: [29.6, -83.6], ES: [40.0, -3.7], MX: [24.6, -110.8],
      AR: [-37.6, -63.2], CL: [-30.5, -70.9], PY: [-21.8, -56.8], GR: [39.8, 22.0]
    };
    var lista = rows.map(function (r, i) {
      var a = {
        i: i, id: slug(r.referencia) || ('a' + i), ref: r.referencia,
        pais: I18N.pais(r.pais, LANG), pk: r.pais,
        zona: r.ciudad, region: r.region || r.ciudad, ll: [r.lat, r.lng],
        tk: I18N.grupo(r.tipo),
        tipo: I18N.cat('tipo', r.tipo, LANG), cat: r.categoria ? I18N.cat('categoria', r.categoria, LANG) : '',
        operacion: r.operacion ? I18N.cat('operacion', r.operacion, LANG) : '', estado: r.estado ? I18N.cat('estado', r.estado, LANG) : '',
        obs: I18N.texto(r, 'descripcion', LANG),
        precio: r.precio == null ? null : +r.precio, moneda: r.moneda
      };
      a.hab = habInfo(r);
      var h = (r.habitaciones || '').match(/^(\d+)$/);
      a.habN = h ? +h[1] : 0;
      a.titulo = a.tipo || 'Hotel';
      return a;
    }).sort(function (x, y) {
      var px = ORDEN_PAIS.indexOf(x.pk), py = ORDEN_PAIS.indexOf(y.pk);
      px = px < 0 ? 99 : px; py = py < 0 ? 99 : py;
      return (px - py) || x.ref.localeCompare(y.ref, 'es', { numeric: true });
    });
    var byId = {};
    lista.forEach(function (a) { byId[a.id] = a; });
    var PAISES = [], paisNombre = {};
    lista.forEach(function (a) { if (PAISES.indexOf(a.pk) < 0) PAISES.push(a.pk); paisNombre[a.pk] = a.pais; });

    (function resumen() {
      var hab = lista.reduce(function (s, a) { return s + a.habN; }, 0);
      $('#st-activos').textContent = lista.length;
      $('#st-paises').textContent = PAISES.length;
      if (hab > 0) $('#st-hab').textContent = '+' + miles(hab);
      else $('#st-hab-box').hidden = true;
    })();

    function placeholder(a, size) {
      return '<div class="ph ' + (size || '') + '" style="--tc:' + COLORS[a.tk] + '">' + ICO.hotel + '<strong>' + esc(a.zona) + '</strong><span>' + esc(a.pais) + '</span></div>';
    }

    /* ---------- Filtros ---------- */
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
      var h = chip('pais', '', t('todos'), cp(function () { return true; }));
      PAISES.forEach(function (p) { h += chip('pais', p, paisNombre[p], cp(function (a) { return a.pk === p; })); });
      $('#f-pais').innerHTML = h;
      if (filtro.pais) {
        var regs = [];
        lista.forEach(function (a) { if (a.pk === filtro.pais && regs.indexOf(a.region) < 0) regs.push(a.region); });
        if (regs.length > 1) {
          var rh = chip('region', '', t('todas'), cuenta('region', function (a) { return a.pk === filtro.pais; }));
          regs.forEach(function (r) { rh += chip('region', r, r, cuenta('region', function (a) { return a.region === r; })); });
          $('#f-region').innerHTML = rh;
        } else {
          $('#f-region').innerHTML = '<p class="hint">' + esc(paisNombre[filtro.pais]) + ': ' + t('unaZona') + ' (' + esc(regs[0]) + ').</p>';
        }
      } else {
        $('#f-region').innerHTML = '<p class="hint">' + t('eligePais') + '</p>';
      }
      var th = chip('tipo', '', t('todos'), cuenta('tipo', function () { return true; }));
      Object.keys(COLORS).forEach(function (k) {
        th += chip('tipo', k, t('grupos')[k], cuenta('tipo', function (a) { return a.tk === k; }), COLORS[k]);
      });
      $('#f-tipo').innerHTML = th;
      var extra = (filtro.region ? 1 : 0) + (filtro.tipo ? 1 : 0);
      $('#f-badge').hidden = !extra;
      $('#f-badge').textContent = extra;
      $('#f-ok-n').textContent = filtrados().length;
      $('#reset').hidden = !filtro.pais && !filtro.region && !filtro.tipo;
    }

    /* ---------- Mapa ---------- */
    var Z_PAIS = 5;
    var isMobile = function () { return window.matchMedia('(max-width: 820px)').matches; };
    var MUNDO = L_.latLngBounds([[-41, -114], [48, 25]]);
    var map = L_.map('map', {
      zoomControl: false, zoomSnap: 0.25, zoomDelta: 1, wheelPxPerZoomLevel: 90, minZoom: 1, maxZoom: 13, worldCopyJump: false,
      maxBounds: [[-72, -200], [84, 200]], maxBoundsViscosity: 0.8, tap: true
    });
    map.setView([15, -45], 2);
    L_.control.zoom({ position: 'topright', zoomInTitle: t('acercar'), zoomOutTitle: t('alejar') }).addTo(map);
    tiles(map);

    function headerH() { return $('.topbar').getBoundingClientRect().bottom; }
    function trayH() { var tr = $('#tray'); return tr.hidden ? 0 : tr.getBoundingClientRect().height + 12; }
    function pads(extra) {
      extra = extra || 0;
      var top = headerH() + 80 + extra, bottom = (trayOpen ? trayH() + 50 : 90) + extra, side = (isMobile() ? 20 : 60) + extra;
      return { paddingTopLeft: [side, top], paddingBottomRight: [side, bottom] };
    }
    function vistaMundo(animate) {
      var o = pads(); o.animate = !!animate; o.duration = 1.0;
      if (animate) map.flyToBounds(MUNDO, o); else map.fitBounds(MUNDO, o);
    }
    function pinIcon(a, active) {
      return L_.divIcon({
        className: '',
        html: '<div class="pin' + (active ? ' active' : '') + '"><svg viewBox="0 0 30 38"><path d="M15 37C15 37 28.5 24 28.5 14.2A13.5 13.5 0 1 0 1.5 14.2C1.5 24 15 37 15 37Z" fill="' + COLORS[a.tk] + '" stroke="#fff" stroke-width="2.4"/><circle cx="15" cy="14" r="5" fill="#fff"/></svg></div>',
        iconSize: [30, 38], iconAnchor: [15, 37], popupAnchor: [0, -34]
      });
    }
    var cluster = L_.markerClusterGroup({
      showCoverageOnHover: false, zoomToBoundsOnClick: false, maxClusterRadius: 52, spiderfyOnMaxZoom: true, spiderfyDistanceMultiplier: 1.6,
      iconCreateFunction: function (c) {
        var n = c.getChildCount(), s = n > 9 ? 50 : 44;
        return L_.divIcon({ html: '<div class="cluster" style="width:' + s + 'px;height:' + s + 'px">' + n + '</div>', className: '', iconSize: [s, s] });
      }
    });
    function popupHTML(a) {
      var hab = a.hab ? '<div><small>' + a.hab.label + '</small><b title="' + esc(a.hab.txt) + '">' + esc(a.hab.txt) + '</b></div>' : '';
      return '<div class="pop-img">' + placeholder(a, 'sm') + '</div>' +
        '<div class="pop-body"><span class="pop-ref">' + esc(a.ref) + '</span>' +
        '<h4>' + esc(a.titulo) + '</h4>' +
        '<p class="pop-z">' + esc(a.zona) + ' · ' + esc(a.pais) + '</p>' +
        '<div class="pop-facts">' + hab + '<div><small>' + t('precio') + '</small><b title="' + esc(precioTxt(a)) + '">' + esc(precioTxt(a)) + '</b></div></div>' +
        '<button class="btn btn-red" type="button" data-ficha="' + a.id + '">' + t('fichaBtn') + '</button></div>';
    }
    var markers = {}, activeId = null;
    lista.forEach(function (a) {
      var m = L_.marker(a.ll, { icon: pinIcon(a), title: a.ref + ' · ' + a.titulo, riseOnHover: true, keyboard: true });
      m.bindPopup(function () { return popupHTML(a); }, { className: 'rp-pop', maxWidth: 260, minWidth: 236, closeButton: true, autoPan: false });
      m.on('click', function () { setActive(a.id); });
      m.on('popupopen', function () { panPopup(m); });
      markers[a.id] = m;
    });
    function panPopup(m) {
      setTimeout(function () {
        var p = m.getPopup(), el = p && p.getElement();
        if (!el) return;
        var r = el.getBoundingClientRect();
        var top = headerH() + 56, bottom = window.innerHeight - (trayOpen ? trayH() : 16) - 8, dx = 0, dy = 0;
        if (r.top < top) dy = r.top - top; else if (r.bottom > bottom) dy = Math.min(r.bottom - bottom, r.top - top);
        if (r.left < 10) dx = r.left - 10; else if (r.right > window.innerWidth - 10) dx = r.right - (window.innerWidth - 10);
        if (dx || dy) map.panBy([dx, dy], { animate: true, duration: .35 });
      }, 30);
    }
    var paisLayer = L_.layerGroup();
    function renderPaises() {
      paisLayer.clearLayers();
      var mob = isMobile();
      PAISES.forEach(function (p) {
        var items = lista.filter(function (a) { return a.pk === p && pasa(a, 'pais'); });
        if (!items.length || (filtro.pais && filtro.pais !== p)) return;
        var n = items.length, s = Math.round((mob ? 26 : 40) + Math.min(n, 25) * (mob ? .4 : .7));
        var icon = L_.divIcon({
          className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2],
          html: '<div class="country"><div class="bub" style="width:' + s + 'px;height:' + s + 'px;font-size:' + (s > 44 ? 17 : s < 32 ? 13 : 15) + 'px">' + n + '</div><span class="lbl">' + esc(paisNombre[p]) + '</span></div>'
        });
        var mk = L_.marker(ANCLA[p] || items[0].ll, { icon: icon, title: paisNombre[p] + ': ' + n + ' ' + (n === 1 ? t('activo') : t('activos')), keyboard: true, riseOnHover: true });
        mk.on('click', function () { selectPais(p, true); });
        paisLayer.addLayer(mk);
      });
    }
    var modo = null;
    function syncModo() {
      var z = map.getZoom(), nuevo = z < Z_PAIS ? 'pais' : 'zona';
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
        map.flyTo(a.ll, Math.max(map.getZoom(), 10), { duration: 1.0 });
        map.once('moveend', function () { syncModo(); abrir(); });
      } else abrir();
    }
    function encuadrar(items) {
      var pts = items.map(function (a) { return a.ll; });
      if (!pts.length) return;
      var o = pads(); o.maxZoom = 10; o.duration = 1.0;
      if (pts.length === 1) map.flyTo(pts[0], 10, { duration: 1.0 });
      else map.flyToBounds(L_.latLngBounds(pts).pad(0.05), o);
    }

    /* ---------- Bandeja ---------- */
    var trayOpen = false;
    function enVista() {
      var vis = filtrados();
      if (map.getZoom() < Z_PAIS) return vis;
      var b = map.getBounds();
      return vis.filter(function (a) { return b.contains(a.ll); });
    }
    function miniHTML(a) {
      return '<div class="mini' + (a.id === activeId ? ' active' : '') + '" id="mini-' + a.id + '" data-go="' + a.id + '" role="button" tabindex="0" aria-label="' + esc(a.ref + ', ' + a.titulo + ', ' + a.zona) + '">' +
        '<div class="mini-img">' + placeholder(a, 'sm') + '</div>' +
        '<div class="mini-body"><span class="mini-ref">' + esc(a.ref) + '</span>' +
        '<span class="mini-t">' + esc(a.titulo) + (a.habN ? ' · ' + miles(a.habN) + ' ' + t('hab') : '') + '</span>' +
        '<span class="mini-z">' + esc(a.zona) + ', ' + esc(a.pais) + '</span>' +
        '<span class="mini-p">' + esc(precioTxt(a)) + '</span></div></div>';
    }
    function renderTray() {
      var items = enVista();
      $('#lista-n').textContent = items.length;
      if (!trayOpen) return;
      var ti;
      if (filtro.region) ti = filtro.region + ' · ' + paisNombre[filtro.pais];
      else if (filtro.pais) ti = paisNombre[filtro.pais];
      else ti = map.getZoom() < Z_PAIS ? t('todosPaises') : t('enVista');
      $('#tray-title').textContent = ti;
      $('#tray-count').textContent = items.length + ' ' + (items.length === 1 ? t('activo') : t('activos'));
      var html = items.length ? items.map(miniHTML).join('') : '<p class="tray-empty">' + t('vacio') + '</p>';
      var listEl = $('#tray-list');
      var sc = listEl.scrollLeft, prev = listEl.getAttribute('data-k'), key = items.map(function (a) { return a.id; }).join(',');
      if (prev !== key) { listEl.innerHTML = html; listEl.setAttribute('data-k', key); listEl.scrollLeft = 0; }
      else listEl.scrollLeft = sc;
      syncTrayH();
    }
    function syncTrayH() { document.documentElement.style.setProperty('--tray-h', (trayOpen ? trayH() : 0) + 'px'); }
    if (window.ResizeObserver) new ResizeObserver(syncTrayH).observe($('#tray'));
    function openTray() { trayOpen = true; $('#tray').hidden = false; $('#btn-lista').hidden = true; $('#legend').hidden = true; renderTray(); }
    function closeTray() { trayOpen = false; $('#tray').hidden = true; $('#btn-lista').hidden = false; $('#legend').hidden = false; syncTrayH(); renderTray(); }
    $('#btn-lista').addEventListener('click', function () { openTray(); if (!filtro.pais && map.getZoom() < Z_PAIS) vistaMundo(true); });
    $('#tray-close').addEventListener('click', closeTray);
    var tm;
    map.on('moveend', function () { clearTimeout(tm); tm = setTimeout(renderTray, 80); });
    $('#tray-list').addEventListener('click', function (e) { var go = e.target.closest('[data-go]'); if (go) irA(go.getAttribute('data-go')); });
    $('#tray-list').addEventListener('keydown', function (e) {
      var go = e.target.closest('[data-go]');
      if (go && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); irA(go.getAttribute('data-go')); }
    });
    cluster.on('clusterclick', function (e) {
      var c = e.layer, b = c.getBounds();
      if (!trayOpen) openTray();
      var o = pads(); o.duration = .9;
      var same = b.getNorthEast().equals(b.getSouthWest(), 1e-6);
      var z = map.getBoundsZoom(b, false, L_.point(o.paddingTopLeft).add(o.paddingBottomRight));
      if (same || z > map.getMaxZoom() - 1 || z <= map.getZoom()) {
        if (!same && z <= map.getZoom()) { o.maxZoom = map.getZoom() + 2; map.flyToBounds(b, o); }
        else { c.spiderfy(); }
      } else map.flyToBounds(b, o);
    });

    /* ---------- Filtros: aplicar ---------- */
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
      if (p) { openTray(); encuadrar(filtrados()); } else vistaMundo(true);
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
      if (g === 'region') { openTray(); encuadrar(filtrados()); } else if (filtro.pais) encuadrar(filtrados());
    });
    $('#reset').addEventListener('click', function () { filtro.pais = ''; filtro.region = ''; filtro.tipo = ''; aplicar(); vistaMundo(true); });
    $('#btn-world').addEventListener('click', function () { map.closePopup(); vistaMundo(true); });
    var pop = $('#filtros-pop'), fbtn = $('#btn-filtros');
    function togglePop(open) { open = open == null ? pop.hidden : open; pop.hidden = !open; fbtn.setAttribute('aria-expanded', open); }
    fbtn.addEventListener('click', function (e) { e.stopPropagation(); togglePop(); });
    $('#filtros-close').addEventListener('click', function () { togglePop(false); });
    $('#filtros-ok').addEventListener('click', function () { togglePop(false); if (filtrados().length) openTray(); });
    document.addEventListener('click', function (e) {
      if (!pop.hidden && !e.target.closest('#filtros-pop') && !e.target.closest('#btn-filtros')) togglePop(false);
    });
    map.on('movestart', function () { if (!pop.hidden && !isMobile()) togglePop(false); });
    $('#legend').innerHTML = Object.keys(COLORS).map(function (k) {
      return '<div><i style="background:' + COLORS[k] + '"></i>' + t('grupos')[k] + '</div>';
    }).join('');

    /* ---------- Ficha (sin fotos: mapa de la ciudad) ---------- */
    var ficha = $('#ficha'), fichaBody = $('#ficha-body'), lastFocus = null, miniMap = null;
    function fichaHTML(a) {
      var datos = [
        [t('tipo'), a.tipo], [t('categoria'), a.cat],
        [a.hab ? a.hab.label : t('habs'), a.hab ? a.hab.txt : ''],
        [t('operacion'), a.operacion], [t('estado'), a.estado],
        [t('ciudad'), a.zona], [t('pais'), a.pais],
        [t('moneda'), a.moneda === 'EUR' ? t('eur') : t('usd')]
      ].filter(function (d) { return d[1]; });
      var wide = function (d) { return String(d[1]).length > 26; };
      datos = datos.filter(function (d) { return !wide(d); }).concat(datos.filter(wide));
      var grid = datos.map(function (d) {
        return '<div' + (wide(d) ? ' class="wide"' : '') + '><dt>' + esc(d[0]) + '</dt><dd>' + esc(d[1]) + '</dd></div>';
      }).join('');
      return '<div class="f-gal f-mapwrap"><div class="f-map" id="f-map"></div>' +
          '<div class="f-mapcap">' + ICO.pin + '<span><b>' + esc(a.zona) + '</b>' + esc(a.pais) + '</span></div>' +
          '<p class="f-mapnote">' + t('ubic') + '</p></div>' +
        '<div class="f-info">' +
          '<span class="f-ref">' + esc(a.ref) + '</span>' +
          '<h2 id="ficha-title">' + esc(a.titulo) + (a.cat ? ' · ' + esc(a.cat) : '') + '</h2>' +
          '<p class="f-zone">' + ICO.pin + esc(a.zona) + ', ' + esc(a.pais) + '</p>' +
          '<div class="f-price' + (a.precio == null ? ' na' : '') + '"><small>' + t('precio') + '</small><b>' + esc(precioTxt(a)) + '</b></div>' +
          '<dl class="f-grid">' + grid + '</dl>' +
          (a.obs ? '<section class="f-obs"><h3>' + t('descripcion') + '</h3><p>' + esc(a.obs) + '</p></section>' : '') +
          '<div class="f-cta"><button class="btn btn-red" type="button" data-open-form="' + a.id + '">' + ICO.chat + t('info') + '</button></div>' +
        '</div>';
    }
    function openFicha(id) {
      var a = byId[id];
      if (!a) return;
      lastFocus = document.activeElement;
      fichaBody.innerHTML = fichaHTML(a);
      fichaBody.scrollTop = 0;
      ficha.hidden = false;
      miniMap = L_.map('f-map', { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false });
      tiles(miniMap);
      miniMap.setView(a.ll, 9);
      L_.circle(a.ll, { radius: 9000, color: COLORS[a.tk], weight: 2, fillColor: COLORS[a.tk], fillOpacity: .18 }).addTo(miniMap);
      setTimeout(function () { miniMap && miniMap.invalidateSize(); $('.modal-x', ficha).focus({ preventScroll: true }); }, 60);
    }
    function closeFicha() {
      ficha.hidden = true;
      if (miniMap) { miniMap.remove(); miniMap = null; }
      fichaBody.innerHTML = '';
      if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }
    document.addEventListener('click', function (e) {
      var f = e.target.closest('[data-ficha]');
      if (f) { openFicha(f.getAttribute('data-ficha')); return; }
      if (e.target.closest('[data-close-ficha]')) closeFicha();
    });

    /* ---------- Formulario (demostración, no envía nada) ---------- */
    var modal = $('#modal'), form = $('#lead-form'), ok = $('#lead-ok'), sel = $('#f-activo');
    sel.innerHTML = '<option value="">' + t('todosActivos') + '</option>' + lista.map(function (a) {
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
    function closeForm() { modal.hidden = true; if (formFocus && document.body.contains(formFocus)) formFocus.focus({ preventScroll: true }); }
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
      if (e.key !== 'Escape') return;
      if (!modal.hidden) closeForm();
      else if (!ficha.hidden) closeFicha();
      else if (!pop.hidden) togglePop(false);
      else map.closePopup();
    });

    /* ---------- Inicio ---------- */
    function syncHeader() { document.documentElement.style.setProperty('--hdr-h', $('.topbar').offsetHeight + 'px'); syncTrayH(); }
    syncHeader();
    window.addEventListener('resize', function () { syncHeader(); map.invalidateSize(); renderPaises(); });
    vistaMundo(false);
    aplicar();
    syncModo();
    renderTray();
  }

  var L_ = window.L;
  function tiles(m) {
    var ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
    L_.tileLayer(ESRI + 'World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxNativeZoom: 16, maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap'
    }).addTo(m);
    L_.tileLayer(ESRI + 'World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 19, pane: 'shadowPane' }).addTo(m);
  }
})();

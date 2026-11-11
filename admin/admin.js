(function () {
  'use strict';
  function $(s, c) { return (c || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var I18N = window.RP_I18N, ORIG = I18N.idiomas[0], OTROS = I18N.idiomas.slice(1);
  var LIBRES = ['descripcion', 'habitaciones'];           // campos de texto libre que se traducen
  var NOMBRE_CAMPO = { descripcion: 'Descripción', habitaciones: 'Habitaciones / superficie' };
  var COLORS = { hotel: '#003F79', obra: '#D50926', reforma: '#B45309', suelo: '#3F6B0B', otros: '#475569' };
  var CFG = window.RP_CONFIG || {};
  if (!CFG.supabaseUrl || !CFG.supabaseKey || !window.supabase) { $('#v-config').hidden = false; return; }
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
  var datos = [], editId = null;

  function toast(msg, err, ms) {
    var el = $('#toast'); el.textContent = msg; el.classList.toggle('err', !!err); el.hidden = false;
    clearTimeout(el._t); el._t = setTimeout(function () { el.hidden = true; }, ms || 3600);
  }
  function nombreIdioma(l) {
    try { var n = new Intl.DisplayNames([ORIG], { type: 'language' }).of(l); return n.charAt(0).toUpperCase() + n.slice(1); } catch (e) { return l.toUpperCase(); }
  }

  /* ---------- Desplegables a partir de los catálogos ---------- */
  (function selects() {
    var C = I18N.catalogos;
    var grupos = I18N.ui[ORIG].grupos, porGrupo = {};
    Object.keys(C.tipo).forEach(function (k) { (porGrupo[C.tipo[k].g] = porGrupo[C.tipo[k].g] || []).push(k); });
    $('#sel-tipo').innerHTML = Object.keys(grupos).map(function (g) {
      return '<optgroup label="' + esc(grupos[g]) + '">' + (porGrupo[g] || []).map(function (k) {
        return '<option value="' + k + '">' + esc(C.tipo[k][ORIG]) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    function simple(id, cat, vacio) {
      $(id).innerHTML = (vacio ? '<option value="">' + vacio + '</option>' : '') + Object.keys(cat).map(function (k) {
        return '<option value="' + k + '">' + esc(cat[k][ORIG]) + '</option>'; }).join('');
    }
    simple('#sel-categoria', C.categoria, '— Sin categoría —');
    simple('#sel-operacion', C.operacion, '— Sin indicar —');
    simple('#sel-estado', C.estado);
    // Países: todos los códigos ISO con su nombre en español (se traducen solos en la web)
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', dn = new Intl.DisplayNames([ORIG], { type: 'region' }), paises = [];
    for (var i = 0; i < 26; i++) for (var j = 0; j < 26; j++) {
      var c = A[i] + A[j], n;
      try { n = dn.of(c); } catch (e) { n = null; }
      if (n && n !== c && !/desconocid|unknown/i.test(n) && ['EU', 'EZ', 'UN', 'QO', 'XA', 'XB', 'ZZ'].indexOf(c) < 0) paises.push([c, n]);
    }
    paises.sort(function (a, b) { return a[1].localeCompare(b[1], ORIG); });
    $('#sel-pais').innerHTML = '<option value="">Elige un país…</option>' + paises.map(function (p) {
      return '<option value="' + p[0] + '">' + esc(p[1]) + '</option>'; }).join('');
    // Campos de traducción por idioma
    $('#tr-campos').innerHTML = OTROS.map(function (l) {
      return '<p class="tr-lang">' + esc(nombreIdioma(l)) + '</p><div class="g2">' + LIBRES.map(function (f) {
        return '<label' + (f === 'descripcion' ? ' class="span2"' : '') + '>' + NOMBRE_CAMPO[f] +
          (f === 'descripcion' ? '<textarea rows="3" data-tr="' + l + '.' + f + '"></textarea>' : '<input data-tr="' + l + '.' + f + '">') + '</label>';
      }).join('') + '</div>';
    }).join('') || '<p class="muted">No hay otros idiomas configurados.</p>';
  })();

  /* ---------- Sesión ---------- */
  function mostrar(logged) { $('#v-login').hidden = logged; $('#v-app').hidden = !logged; if (logged) cargar(); }
  sb.auth.getSession().then(function (r) { mostrar(!!(r.data && r.data.session)); });
  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT') mostrar(false); });
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = $('#login-err'), btn = f.querySelector('button');
    err.hidden = true; btn.disabled = true;
    sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value }).then(function (r) {
      btn.disabled = false;
      if (r.error) { err.textContent = 'Email o contraseña incorrectos.'; err.hidden = false; return; }
      f.reset(); mostrar(true);
    });
  });
  $('#btn-salir').addEventListener('click', function () { sb.auth.signOut(); });

  /* ---------- Listado ---------- */
  function cargar() {
    return sb.from('activos').select('*').order('orden', { ascending: true }).order('referencia', { ascending: true }).then(function (r) {
      if (r.error) { toast('No se pudieron cargar los activos: ' + r.error.message, true); return; }
      datos = r.data || [];
      var paises = [], regiones = [];
      datos.forEach(function (d) { if (paises.indexOf(d.pais) < 0) paises.push(d.pais); if (d.region && regiones.indexOf(d.region) < 0) regiones.push(d.region); });
      paises = paises.map(function (c) { return [c, I18N.pais(c, ORIG)]; }).sort(function (a, b) { return a[1].localeCompare(b[1], ORIG); });
      var sel = $('#f-pais'), v = sel.value;
      sel.innerHTML = '<option value="">Todos los países</option>' + paises.map(function (p) { return '<option value="' + p[0] + '">' + esc(p[1]) + '</option>'; }).join('');
      sel.value = v;
      $('#dl-regiones').innerHTML = regiones.sort().map(function (x) { return '<option value="' + esc(x) + '">'; }).join('');
      pintar();
    });
  }
  function precioTxt(d) {
    if (d.precio == null) return 'A consultar';
    var n = (+d.precio).toLocaleString('es-ES', { maximumFractionDigits: 2 });
    return d.moneda === 'EUR' ? n + ' €' : 'US$ ' + n;
  }
  function faltan(d) {
    return OTROS.some(function (l) { return LIBRES.some(function (f) { return d[f] && !/^\d+$/.test(d[f]) && !(d.traduccion && d.traduccion[l] && d.traduccion[l][f]); }); });
  }
  function pintar() {
    var q = $('#q').value.trim().toLowerCase(), p = $('#f-pais').value;
    var vis = datos.filter(function (d) {
      var txt = [d.referencia, d.ciudad, I18N.pais(d.pais, ORIG), I18N.cat('tipo', d.tipo, ORIG)].join(' ').toLowerCase();
      return (!p || d.pais === p) && (!q || txt.indexOf(q) >= 0);
    });
    $('#count').textContent = vis.length + ' de ' + datos.length + ' activos';
    $('#rows').innerHTML = vis.length ? vis.map(function (d) {
      return '<tr><td class="ref">' + esc(d.referencia) + (faltan(d) ? ' <span class="pill off" title="Faltan traducciones">sin traducir</span>' : '') + '</td>' +
        '<td>' + esc(I18N.pais(d.pais, ORIG)) + '</td><td>' + esc(d.ciudad) + '</td>' +
        '<td><span class="dot" style="background:' + COLORS[I18N.grupo(d.tipo)] + '"></span>' + esc(I18N.cat('tipo', d.tipo, ORIG)) + '</td>' +
        '<td class="num">' + esc(precioTxt(d)) + '</td><td>' + esc(d.estado ? I18N.cat('estado', d.estado, ORIG) : '') + '</td>' +
        '<td><span class="pill' + (d.publicado ? '' : ' off') + '">' + (d.publicado ? 'Visible' : 'Oculto') + '</span></td>' +
        '<td><div class="row-btns"><button class="btn btn-ghost" data-edit="' + d.id + '">Editar</button><button class="btn btn-ghost danger" data-del="' + d.id + '">Eliminar</button></div></td></tr>';
    }).join('') : '<tr><td colspan="8" class="muted">No hay activos con ese filtro.</td></tr>';
  }
  $('#q').addEventListener('input', pintar);
  $('#f-pais').addEventListener('change', pintar);
  $('#rows').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) abrir(ed.getAttribute('data-edit'));
    if (del) borrar(del.getAttribute('data-del'));
  });

  /* ---------- Editor ---------- */
  var form = $('#form'), pick = null, pickMk = null, original = {};
  var CAMPOS = ['referencia', 'orden', 'pais', 'ciudad', 'region', 'lat', 'lng', 'publicado', 'tipo', 'categoria', 'habitaciones',
    'precio', 'moneda', 'operacion', 'estado', 'descripcion'];
  function trInput(l, f) { return form.querySelector('[data-tr="' + l + '.' + f + '"]'); }

  function abrir(id) {
    editId = id || null;
    var d = id ? datos.find(function (x) { return x.id === id; }) :
      { orden: datos.length + 1, tipo: 'hotel_operativo', publicado: true, moneda: 'USD', estado: 'disponible', operacion: 'venta_completa', traduccion: {} };
    form.reset();
    CAMPOS.forEach(function (k) { if (form[k]) form[k].value = d[k] == null ? '' : String(d[k]); });
    OTROS.forEach(function (l) { LIBRES.forEach(function (f) {
      var el = trInput(l, f); el.value = (d.traduccion && d.traduccion[l] && d.traduccion[l][f]) || ''; el.dataset.tocado = '';
    }); });
    original = { descripcion: d.descripcion || '', habitaciones: d.habitaciones || '' };
    form.querySelectorAll('.invalid').forEach(function (i) { i.classList.remove('invalid'); });
    $('#form-err').hidden = true; $('#geo-msg').textContent = ''; $('#tr-msg').textContent = '';
    $('#form-title').textContent = id ? 'Editar ' + d.referencia : 'Nuevo activo';
    $('#btn-borrar').hidden = !id;
    $('#editor').hidden = false;
    $('.drawer-body', form).scrollTop = 0;
    setTimeout(initPick, 30);
  }
  function cerrar() { $('#editor').hidden = true; }
  $('#btn-nuevo').addEventListener('click', function () { abrir(null); });
  $('#editor').addEventListener('click', function (e) { if (e.target.closest('[data-cerrar]')) cerrar(); });
  $('#btn-borrar').addEventListener('click', function () { if (editId) borrar(editId); });
  form.addEventListener('input', function (e) { if (e.target.dataset && e.target.hasAttribute('data-tr')) e.target.dataset.tocado = '1'; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!$('#confirm').hidden) $('#confirm').hidden = true; else if (!$('#editor').hidden) cerrar(); } });

  /* Traduce los campos libres del formulario. forzar=true: retraduce todo lo no editado a mano. */
  function traducirFormulario(forzar) {
    var tareas = [];
    OTROS.forEach(function (l) { LIBRES.forEach(function (f) {
      var es = form[f].value.trim(), el = trInput(l, f);
      if (!es) { if (!el.dataset.tocado) el.value = ''; return; }
      var cambio = es !== original[f];
      if (el.dataset.tocado && !forzar) return;                       // corregida a mano: se respeta
      if (el.value && !cambio && !forzar) return;                      // ya traducida y sin cambios
      tareas.push(I18N.traducir(es, l).then(function (tx) { el.value = tx; }));
    }); });
    if (!tareas.length) return Promise.resolve(0);
    $('#tr-msg').textContent = 'Traduciendo…';
    return Promise.all(tareas).then(function () { $('#tr-msg').textContent = 'Traducido.'; return tareas.length; });
  }
  $('#btn-traducir').addEventListener('click', function () {
    OTROS.forEach(function (l) { LIBRES.forEach(function (f) { trInput(l, f).dataset.tocado = ''; }); });
    traducirFormulario(true).catch(function (e) { $('#tr-msg').textContent = 'El traductor no respondió (' + e.message + '). Inténtalo más tarde o escribe la traducción.'; });
  });

  function initPick() {
    var lat = parseFloat(form.lat.value), lng = parseFloat(form.lng.value), has = !isNaN(lat) && !isNaN(lng);
    if (!pick) {
      pick = L.map('pick-map', { zoomControl: true, maxZoom: 12, minZoom: 1 });
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, attribution: '&copy; Esri' }).addTo(pick);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, pane: 'shadowPane' }).addTo(pick);
      pick.on('click', function (e) { setPunto(e.latlng.lat, e.latlng.lng, false); });
    }
    pick.invalidateSize();
    if (has) { setPunto(lat, lng, true); pick.setView([lat, lng], 8); }
    else { if (pickMk) { pick.removeLayer(pickMk); pickMk = null; } pick.setView([25, -30], 2); }
  }
  function setPunto(lat, lng, keepView) {
    lat = Math.round(lat * 1000) / 1000; lng = Math.round(lng * 1000) / 1000;
    form.lat.value = lat; form.lng.value = lng;
    if (pickMk) pickMk.setLatLng([lat, lng]);
    else pickMk = L.circleMarker([lat, lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#D50926', fillOpacity: 1 }).addTo(pick);
    if (!keepView) pick.panTo([lat, lng]);
  }
  ['lat', 'lng'].forEach(function (k) {
    form[k].addEventListener('change', function () {
      var a = parseFloat(form.lat.value), b = parseFloat(form.lng.value);
      if (!isNaN(a) && !isNaN(b)) { setPunto(a, b, true); pick.setView([a, b], Math.max(pick.getZoom(), 6)); }
    });
  });
  $('#btn-geo').addEventListener('click', function () {
    var paisTxt = form.pais.value ? I18N.pais(form.pais.value, ORIG) : '';
    var q = [form.ciudad.value, paisTxt].filter(Boolean).join(', ');
    if (!form.ciudad.value) { $('#geo-msg').textContent = 'Escribe primero la ciudad y elige el país.'; return; }
    $('#geo-msg').textContent = 'Buscando…';
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=es&q=' + encodeURIComponent(q) +
        (form.pais.value ? '&countrycodes=' + form.pais.value.toLowerCase() : ''))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.length) { $('#geo-msg').textContent = 'No se encontró. Haz clic en el mapa para colocarlo.'; return; }
        setPunto(+res[0].lat, +res[0].lon, true); pick.setView([+res[0].lat, +res[0].lon], 8);
        $('#geo-msg').textContent = 'Punto colocado en ' + res[0].display_name.split(',').slice(0, 2).join(',');
      })
      .catch(function () { $('#geo-msg').textContent = 'Sin conexión con el buscador. Haz clic en el mapa.'; });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = null;
    ['referencia', 'pais', 'ciudad', 'tipo', 'lat', 'lng'].forEach(function (k) {
      var v = form[k].value.trim(), inv = !v || ((k === 'lat' || k === 'lng') && isNaN(parseFloat(v)));
      form[k].classList.toggle('invalid', inv);
      if (inv && !bad) bad = form[k];
    });
    if (bad) { $('#form-err').textContent = bad === form.lat || bad === form.lng ? 'Coloca el punto de la ciudad en el mapa.' : 'Completa los campos obligatorios (*).'; $('#form-err').hidden = false; bad.focus(); return; }
    var btn = $('#btn-guardar'); btn.disabled = true; btn.textContent = 'Traduciendo…';
    var avisoTr = '';
    traducirFormulario(false).catch(function () { avisoTr = ' Ojo: el traductor no respondió; faltan traducciones (usa "Traducir todo" más tarde).'; })
    .then(function () {
      btn.textContent = 'Guardando…';
      var row = {};
      CAMPOS.forEach(function (k) { var v = form[k].value.trim(); row[k] = v === '' ? null : v; });
      row.lat = parseFloat(row.lat); row.lng = parseFloat(row.lng);
      row.orden = row.orden == null ? 0 : parseInt(row.orden, 10);
      row.precio = row.precio == null ? null : parseFloat(row.precio);
      row.publicado = row.publicado !== 'false';
      if (!row.region) row.region = row.ciudad;
      row.tipo_clave = I18N.grupo(row.tipo);
      row.traduccion = {};
      OTROS.forEach(function (l) {
        var o = {};
        LIBRES.forEach(function (f) { var v = trInput(l, f).value.trim(); if (v && row[f]) o[f] = v; });
        row.traduccion[l] = o;
      });
      return editId ? sb.from('activos').update(row).eq('id', editId) : sb.from('activos').insert(row);
    })
    .then(function (r) {
      btn.disabled = false; btn.textContent = 'Guardar';
      if (r.error) {
        $('#form-err').textContent = /duplicate|unique/i.test(r.error.message) ? 'Ya existe un activo con esa referencia.' : 'No se pudo guardar: ' + r.error.message;
        $('#form-err').hidden = false; return;
      }
      cerrar(); toast((editId ? 'Cambios guardados.' : 'Activo creado.') + ' Ya se ve en el mapa.' + avisoTr, !!avisoTr, avisoTr ? 7000 : 3600); cargar();
    });
  });

  /* ---------- Traducir todo (p. ej. al añadir un idioma nuevo) ---------- */
  $('#btn-traducir-todo').addEventListener('click', function () {
    var btn = this, pend = [];
    datos.forEach(function (d) { OTROS.forEach(function (l) { LIBRES.forEach(function (f) {
      if (d[f] && !/^\d+$/.test(d[f]) && !(d.traduccion && d.traduccion[l] && d.traduccion[l][f])) pend.push([d, l, f]);
    }); }); });
    if (!pend.length) { toast('Todo está traducido.'); return; }
    btn.disabled = true;
    var hechos = 0, cambiados = {};
    (function sig(i) {
      if (i >= pend.length) {
        var ids = Object.keys(cambiados);
        Promise.all(ids.map(function (id) { var d = cambiados[id]; return sb.from('activos').update({ traduccion: d.traduccion }).eq('id', id); }))
          .then(function () { btn.disabled = false; btn.textContent = 'Traducir todo'; toast(hechos + ' textos traducidos.'); cargar(); });
        return;
      }
      var d = pend[i][0], l = pend[i][1], f = pend[i][2];
      btn.textContent = 'Traduciendo ' + (i + 1) + '/' + pend.length + '…';
      I18N.traducir(d[f], l).then(function (tx) {
        d.traduccion = d.traduccion || {}; d.traduccion[l] = d.traduccion[l] || {}; d.traduccion[l][f] = tx;
        cambiados[d.id] = d; hechos++; sig(i + 1);
      }).catch(function (e) {
        i = pend.length; toast('El traductor se detuvo (' + e.message + '). Se guarda lo traducido; vuelve a intentarlo más tarde.', true, 7000); sig(i);
      });
    })(0);
  });

  /* ---------- Eliminar ---------- */
  function borrar(id) {
    var d = datos.find(function (x) { return x.id === id; });
    if (!d) return;
    $('#confirm-p').textContent = d.referencia + ' · ' + d.ciudad + ' (' + I18N.pais(d.pais, ORIG) + '). Se quitará del mapa y no se puede deshacer. Si solo quieres ocultarlo, edítalo y marca "No (oculto)".';
    $('#confirm').hidden = false;
    $('#confirm-si').onclick = function () {
      $('#confirm-si').disabled = true;
      sb.from('activos').delete().eq('id', id).then(function (r) {
        $('#confirm-si').disabled = false; $('#confirm').hidden = true;
        if (r.error) { toast('No se pudo eliminar: ' + r.error.message, true); return; }
        cerrar(); toast('Activo eliminado.'); cargar();
      });
    };
  }
  $('#confirm').addEventListener('click', function (e) { if (e.target.closest('[data-no]')) $('#confirm').hidden = true; });
})();

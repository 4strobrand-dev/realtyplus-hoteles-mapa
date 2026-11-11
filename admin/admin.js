(function () {
  'use strict';
  function $(s, c) { return (c || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var COLORS = { hotel: '#003F79', obra: '#D50926', reforma: '#B45309', suelo: '#3F6B0B', otros: '#475569' };
  var CFG = window.RP_CONFIG || {};
  if (!CFG.supabaseUrl || !CFG.supabaseKey || !window.supabase) { $('#v-config').hidden = false; return; }
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);

  var datos = [], editId = null;

  function toast(msg, err) {
    var el = $('#toast'); el.textContent = msg; el.classList.toggle('err', !!err); el.hidden = false;
    clearTimeout(el._t); el._t = setTimeout(function () { el.hidden = true; }, 3200);
  }

  /* ---------- Sesión ---------- */
  function mostrar(logged) { $('#v-login').hidden = logged; $('#v-app').hidden = !logged; if (logged) cargar(); }
  sb.auth.getSession().then(function (r) { mostrar(!!(r.data && r.data.session)); });
  sb.auth.onAuthStateChange(function (ev, s) { if (ev === 'SIGNED_OUT') mostrar(false); });

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
    sb.from('activos').select('*').order('orden', { ascending: true }).order('referencia', { ascending: true }).then(function (r) {
      if (r.error) { toast('No se pudieron cargar los activos: ' + r.error.message, true); return; }
      datos = r.data || [];
      var paises = [];
      datos.forEach(function (d) { if (paises.indexOf(d.pais) < 0) paises.push(d.pais); });
      paises.sort(function (a, b) { return a.localeCompare(b, 'es'); });
      var sel = $('#f-pais'), v = sel.value;
      sel.innerHTML = '<option value="">Todos los países</option>' + paises.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('');
      sel.value = v;
      $('#dl-paises').innerHTML = paises.map(function (p) { return '<option value="' + esc(p) + '">'; }).join('');
      pintar();
    });
  }
  function precioTxt(d) {
    if (d.precio == null) return 'A consultar';
    var n = (+d.precio).toLocaleString('es-ES', { maximumFractionDigits: 2 });
    return d.moneda === 'EUR' ? n + ' €' : 'US$ ' + n;
  }
  function pintar() {
    var q = $('#q').value.trim().toLowerCase(), p = $('#f-pais').value;
    var vis = datos.filter(function (d) {
      return (!p || d.pais === p) && (!q || [d.referencia, d.ciudad, d.pais, d.tipo_es].join(' ').toLowerCase().indexOf(q) >= 0);
    });
    $('#count').textContent = vis.length + ' de ' + datos.length + ' activos';
    $('#rows').innerHTML = vis.length ? vis.map(function (d) {
      return '<tr><td class="ref">' + esc(d.referencia) + '</td><td>' + esc(d.pais) + '</td><td>' + esc(d.ciudad) + '</td>' +
        '<td><span class="dot" style="background:' + (COLORS[d.tipo_clave] || '#475569') + '"></span>' + esc(d.tipo_es) + '</td>' +
        '<td class="num">' + esc(precioTxt(d)) + '</td><td>' + esc(d.estado_es || '') + '</td>' +
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
  var form = $('#form'), pick = null, pickMk = null;
  var CAMPOS = ['referencia', 'orden', 'pais', 'pais_en', 'ciudad', 'region', 'lat', 'lng', 'tipo_clave', 'publicado', 'tipo_es', 'tipo_en',
    'categoria_es', 'categoria_en', 'habitaciones_es', 'habitaciones_en', 'precio', 'moneda', 'operacion_es', 'operacion_en',
    'estado_es', 'estado_en', 'descripcion_es', 'descripcion_en'];

  function abrir(id) {
    editId = id || null;
    var d = id ? datos.find(function (x) { return x.id === id; }) : { orden: datos.length + 1, tipo_clave: 'hotel', publicado: true, moneda: 'USD', estado_es: 'Disponible', estado_en: 'Available' };
    form.reset();
    CAMPOS.forEach(function (k) { if (form[k]) form[k].value = d[k] == null ? '' : String(d[k]); });
    form.querySelectorAll('.invalid').forEach(function (i) { i.classList.remove('invalid'); });
    $('#form-err').hidden = true; $('#geo-msg').textContent = '';
    $('#form-title').textContent = id ? 'Editar ' + d.referencia : 'Nuevo activo';
    $('#btn-borrar').hidden = !id;
    $('#editor').hidden = false;
    setTimeout(initPick, 30);
  }
  function cerrar() { $('#editor').hidden = true; }
  $('#btn-nuevo').addEventListener('click', function () { abrir(null); });
  $('#editor').addEventListener('click', function (e) { if (e.target.closest('[data-cerrar]')) cerrar(); });
  $('#btn-borrar').addEventListener('click', function () { if (editId) borrar(editId); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!$('#confirm').hidden) $('#confirm').hidden = true; else if (!$('#editor').hidden) cerrar(); } });

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
    lat = Math.round(lat * 1000) / 1000; lng = Math.round(lng * 1000) / 1000;   // precisión de ciudad (~100 m)
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
    var q = [form.ciudad.value, form.pais.value].filter(Boolean).join(', ');
    if (!q) { $('#geo-msg').textContent = 'Escribe primero la ciudad y el país.'; return; }
    $('#geo-msg').textContent = 'Buscando…';
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=es&q=' + encodeURIComponent(q))
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
    ['referencia', 'pais', 'ciudad', 'tipo_es', 'lat', 'lng'].forEach(function (k) {
      var v = form[k].value.trim(), inv = !v || ((k === 'lat' || k === 'lng') && isNaN(parseFloat(v)));
      form[k].classList.toggle('invalid', inv);
      if (inv && !bad) bad = form[k];
    });
    if (bad) { $('#form-err').textContent = bad === form.lat || bad === form.lng ? 'Coloca el punto de la ciudad en el mapa.' : 'Completa los campos obligatorios (*).'; $('#form-err').hidden = false; bad.focus(); return; }
    var row = {};
    CAMPOS.forEach(function (k) { var v = form[k].value.trim(); row[k] = v === '' ? null : v; });
    row.lat = parseFloat(row.lat); row.lng = parseFloat(row.lng);
    row.orden = row.orden == null ? 0 : parseInt(row.orden, 10);
    row.precio = row.precio == null ? null : parseFloat(row.precio);
    row.publicado = row.publicado !== 'false';
    if (!row.region) row.region = row.ciudad;
    if (!row.pais_en) row.pais_en = row.pais;
    var btn = $('#btn-guardar'); btn.disabled = true;
    var q = editId ? sb.from('activos').update(row).eq('id', editId) : sb.from('activos').insert(row);
    q.then(function (r) {
      btn.disabled = false;
      if (r.error) {
        $('#form-err').textContent = /duplicate|unique/i.test(r.error.message) ? 'Ya existe un activo con esa referencia.' : 'No se pudo guardar: ' + r.error.message;
        $('#form-err').hidden = false; return;
      }
      cerrar(); toast(editId ? 'Cambios guardados. Ya se ven en el mapa.' : 'Activo creado. Ya aparece en el mapa.'); cargar();
    });
  });

  /* ---------- Eliminar ---------- */
  function borrar(id) {
    var d = datos.find(function (x) { return x.id === id; });
    if (!d) return;
    $('#confirm-p').textContent = d.referencia + ' · ' + d.ciudad + ' (' + d.pais + '). Se quitará del mapa y no se puede deshacer. Si solo quieres ocultarlo, edítalo y marca "No (oculto)".';
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

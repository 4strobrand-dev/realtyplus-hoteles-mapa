/* =========================================================
   Idiomas, textos de la web y catálogos (compartido por el mapa y el panel)

   AÑADIR UN IDIOMA (p. ej. ruso "ru"):
     1. Añadir 'ru' a RP_I18N.idiomas.
     2. Añadir un bloque ru: {...} en RP_I18N.ui y la traducción 'ru' en cada entrada de los catálogos.
     3. En el panel, pulsar "Traducir todo" para traducir descripciones y habitaciones de los activos existentes.
   Los nombres de país se traducen solos (código ISO + Intl.DisplayNames del navegador).
   ========================================================= */
window.RP_I18N = (function () {
  var idiomas = ['es', 'en'];          // el primero es el idioma original de los datos

  var ui = {
    es: {
      activos: 'activos', activo: 'activo', paises: 'países', habitaciones: 'habitaciones', info: 'Solicitar información', infoShort: 'Info',
      filtros: 'Filtros', zona: 'Zona', tipo: 'Tipo de activo', quitar: 'Quitar filtros', ver: 'Ver', todos: 'Todos', todas: 'Todas',
      eligePais: 'Elige un país para ver sus zonas.', unaZona: 'una sola zona', vistaGlobal: 'Vista global', verLista: 'Ver lista',
      todosPaises: 'Todos los países', enVista: 'En esta vista', ocultar: 'Ocultar lista', vacio: 'No hay activos en esta zona del mapa. Aleja el mapa o pulsa el globo para la vista global.',
      precio: 'Precio', consultar: 'Precio a consultar', habs: 'Habitaciones', sup: 'Superficie', fichaBtn: 'Ver ficha completa', hab: 'hab.',
      categoria: 'Categoría', operacion: 'Tipo de operación', estado: 'Estado comercial', ciudad: 'Ciudad', pais: 'País', moneda: 'Moneda',
      usd: 'Dólar estadounidense (USD)', eur: 'Euro (EUR)', descripcion: 'Descripción', ubic: 'Ubicación aproximada: se muestra solo la ciudad.',
      cerrar: 'Cerrar', acercar: 'Acercar', alejar: 'Alejar', formTitle: 'Solicitar información', formSub: 'Te enviaremos el dossier completo del activo.',
      nombre: 'Nombre y apellidos', email: 'Email', tel: 'Teléfono', oficina: 'Oficina / franquicia', interes: 'Activo de interés', todosActivos: 'Todos los activos',
      mensaje: 'Mensaje', msgPh: 'Perfil del comprador, plazos…', enviar: 'Enviar solicitud', okT: '¡Solicitud recibida!', okP: 'Gracias. El equipo Investplus se pondrá en contacto contigo en breve.',
      volver: 'Volver al mapa', cargando: 'Cargando activos…', errorCarga: 'No se pudieron cargar los activos. Inténtalo de nuevo más tarde.',
      grupos: { hotel: 'Hoteles y complejos', obra: 'En obra / proyecto', reforma: 'Cerrado / para reforma', suelo: 'Suelo y terrenos', otros: 'Otros activos' }
    },
    en: {
      activos: 'assets', activo: 'asset', paises: 'countries', habitaciones: 'rooms', info: 'Request information', infoShort: 'Info',
      filtros: 'Filters', zona: 'Area', tipo: 'Asset type', quitar: 'Clear filters', ver: 'Show', todos: 'All', todas: 'All',
      eligePais: 'Choose a country to see its areas.', unaZona: 'single area', vistaGlobal: 'World view', verLista: 'Show list',
      todosPaises: 'All countries', enVista: 'In this view', ocultar: 'Hide list', vacio: 'No assets in this part of the map. Zoom out or tap the globe for the world view.',
      precio: 'Price', consultar: 'Price on request', habs: 'Rooms', sup: 'Area', fichaBtn: 'View full details', hab: 'rooms',
      categoria: 'Category', operacion: 'Transaction', estado: 'Status', ciudad: 'City', pais: 'Country', moneda: 'Currency',
      usd: 'US dollar (USD)', eur: 'Euro (EUR)', descripcion: 'Description', ubic: 'Approximate location: only the city is shown.',
      cerrar: 'Close', acercar: 'Zoom in', alejar: 'Zoom out', formTitle: 'Request information', formSub: 'We will send you the full asset dossier.',
      nombre: 'Full name', email: 'Email', tel: 'Phone', oficina: 'Office / franchise', interes: 'Asset of interest', todosActivos: 'All assets',
      mensaje: 'Message', msgPh: 'Buyer profile, timing…', enviar: 'Send request', okT: 'Request received!', okP: 'Thank you. The Investplus team will contact you shortly.',
      volver: 'Back to the map', cargando: 'Loading assets…', errorCarga: 'Assets could not be loaded. Please try again later.',
      grupos: { hotel: 'Hotels and resorts', obra: 'Under construction / project', reforma: 'Closed / to refurbish', suelo: 'Land and plots', otros: 'Other assets' }
    }
  };

  // Catálogos: clave -> { idioma: texto } ; en "tipo", g = grupo/color del mapa
  var tipo = {
    hotel_operativo:       { g: 'hotel', es: 'Hotel operativo', en: 'Operating hotel' },
    hotel_boutique:        { g: 'hotel', es: 'Hotel boutique', en: 'Boutique hotel' },
    hotel_resort:          { g: 'hotel', es: 'Hotel resort', en: 'Resort hotel' },
    resort_todo_incluido:  { g: 'hotel', es: 'Resort todo incluido', en: 'All-inclusive resort' },
    hotel_frente_mar:      { g: 'hotel', es: 'Hotel frente al mar', en: 'Beachfront hotel' },
    aparthotel:            { g: 'hotel', es: 'Aparthotel', en: 'Aparthotel' },
    hotel_restaurante:     { g: 'hotel', es: 'Hotel y restaurante', en: 'Hotel and restaurant' },
    hotel_plaza_comercial: { g: 'hotel', es: 'Hotel y plaza comercial', en: 'Hotel and shopping plaza' },
    complejo_cabanas:      { g: 'hotel', es: 'Complejo de cabañas', en: 'Cabin complex' },
    villa_turistica:       { g: 'hotel', es: 'Villa turística', en: 'Tourist villa' },
    hotel_semiconstruido:  { g: 'obra', es: 'Hotel semiconstruido', en: 'Partly built hotel' },
    proyecto_hotelero:     { g: 'obra', es: 'Proyecto hotelero', en: 'Hotel project' },
    macro_desarrollo:      { g: 'obra', es: 'Proyecto de macrodesarrollo', en: 'Large-scale development project' },
    hotel_cerrado:         { g: 'reforma', es: 'Hotel cerrado', en: 'Closed hotel' },
    hotel_para_reforma:    { g: 'reforma', es: 'Hotel para reforma', en: 'Hotel for refurbishment' },
    edificio_convertible:  { g: 'reforma', es: 'Edificio convertible', en: 'Building for conversion' },
    suelo_hotelero:        { g: 'suelo', es: 'Suelo hotelero', en: 'Hotel land' },
    terreno:               { g: 'suelo', es: 'Terreno', en: 'Land' },
    terreno_turistico:     { g: 'suelo', es: 'Terreno turístico / residencial', en: 'Tourist / residential land' },
    terreno_playa:         { g: 'suelo', es: 'Terreno de playa', en: 'Beach land' },
    terreno_golf:          { g: 'suelo', es: 'Terreno turístico / campo de golf', en: 'Tourist land / golf course' },
    terreno_ecoturistico:  { g: 'suelo', es: 'Terreno ecoturístico', en: 'Eco-tourism land' },
    terreno_vinedo:        { g: 'suelo', es: 'Terreno / viñedo', en: 'Land / vineyard' },
    plaza_comercial:       { g: 'otros', es: 'Plaza comercial', en: 'Shopping plaza' },
    otro:                  { g: 'otros', es: 'Otro activo', en: 'Other asset' }
  };
  var categoria = {
    estrellas_1: { es: '1 estrella', en: '1-star' }, estrellas_2: { es: '2 estrellas', en: '2-star' },
    estrellas_3: { es: '3 estrellas', en: '3-star' }, estrellas_4: { es: '4 estrellas', en: '4-star' },
    estrellas_5: { es: '5 estrellas', en: '5-star' }, lujo: { es: 'Lujo', en: 'Luxury' },
    boutique_lujo: { es: 'Boutique de lujo', en: 'Luxury boutique' }, rural: { es: 'Rural', en: 'Rural' },
    apartamentos_turisticos: { es: 'Apartamentos turísticos', en: 'Tourist apartments' },
    cabanas_turisticas: { es: 'Cabañas turísticas', en: 'Tourist cabins' }
  };
  var operacion = {
    venta_completa: { es: 'Venta completa', en: 'Full sale' }, venta: { es: 'Venta', en: 'Sale' },
    venta_suelo: { es: 'Venta de suelo', en: 'Land sale' }, venta_participaciones: { es: 'Venta de participaciones', en: 'Sale of shares' },
    venta_fondo_comercio: { es: 'Venta de fondo de comercio', en: 'Business sale (goodwill)' },
    venta_activo_ocupado: { es: 'Venta de activo (ocupado, sin posesión)', en: 'Asset sale (occupied, no possession)' },
    a_negociar: { es: 'A negociar', en: 'Negotiable' }
  };
  var estado = {
    disponible: { es: 'Disponible', en: 'Available' }, nuevo: { es: 'Nuevo', en: 'New' },
    interes_preliminar: { es: 'Interés preliminar', en: 'Preliminary interest' },
    en_negociacion: { es: 'En negociación', en: 'Under negotiation' }, cerrado: { es: 'Cerrado', en: 'Closed' }
  };

  function cat(nombre, clave, lang) {
    var c = { tipo: tipo, categoria: categoria, operacion: operacion, estado: estado }[nombre][clave];
    if (!c) return clave || '';
    return c[lang] || c[idiomas[0]];
  }
  function pais(iso, lang) {
    try { return new Intl.DisplayNames([lang], { type: 'region' }).of(iso) || iso; } catch (e) { return iso; }
  }
  function grupo(t) { return (tipo[t] && tipo[t].g) || 'otros'; }
  // Texto libre: traducción guardada para ese idioma, o el original en español
  function texto(a, campo, lang) {
    var tr = a.traduccion && a.traduccion[lang];
    return (lang !== idiomas[0] && tr && tr[campo]) || a[campo] || '';
  }

  /* Traductor automático gratuito sin registro (MyMemory). Se usa solo desde el panel al guardar;
     las traducciones quedan guardadas en la base de datos. Para cambiar de proveedor (DeepL, Google…)
     basta con reescribir esta función. */
  function traducir(textoOrigen, destino) {
    var t = String(textoOrigen || '').trim();
    if (!t || destino === idiomas[0]) return Promise.resolve(t);
    if (/^[\d\s.,+\-–()/m²ha]*$/i.test(t)) return Promise.resolve(t);         // números / medidas: igual
    var trozos = t.match(/[^.!?]+[.!?]*\s*/g) || [t], bloques = [], cur = '';
    trozos.forEach(function (s) { if ((cur + s).length > 450 && cur) { bloques.push(cur); cur = ''; } cur += s; });
    if (cur) bloques.push(cur);
    return Promise.all(bloques.map(function (b) {
      return fetch('https://api.mymemory.translated.net/get?langpair=' + idiomas[0] + '|' + destino + '&q=' + encodeURIComponent(b.trim()))
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || j.responseStatus != 200 || !j.responseData || !j.responseData.translatedText) throw new Error((j && j.responseDetails) || 'sin respuesta');
          return j.responseData.translatedText;
        });
    })).then(function (partes) { return partes.join(' ').replace(/\s+/g, ' ').trim(); });
  }

  return { idiomas: idiomas, ui: ui, catalogos: { tipo: tipo, categoria: categoria, operacion: operacion, estado: estado },
           cat: cat, pais: pais, grupo: grupo, texto: texto, traducir: traducir };
})();

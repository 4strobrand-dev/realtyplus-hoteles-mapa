/* =========================================================
   Idiomas, textos de la web y catálogos (compartido por el mapa y el panel)

   AÑADIR UN IDIOMA (p. ej. ruso "ru"):
     1. Añadir 'ru' a RP_I18N.idiomas.
     2. Añadir un bloque ru: {...} en RP_I18N.ui y la traducción 'ru' en cada entrada de los catálogos.
     3. En el panel, pulsar "Traducir todo" para traducir descripciones y habitaciones de los activos existentes.
   Los nombres de país se traducen solos (código ISO + Intl.DisplayNames del navegador).
   ========================================================= */
window.RP_I18N = (function () {
  var idiomas = ['es', 'en', 'pt', 'fr', 'it', 'de', 'ru'];          // el primero es el idioma original de los datos

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
    },
    ru: {
      activos: 'объектов', activo: 'объект', paises: 'стран', habitaciones: 'номеров', info: 'Запросить информацию', infoShort: 'Инфо',
      filtros: 'Фильтры', zona: 'Регион', tipo: 'Тип объекта', quitar: 'Сбросить фильтры', ver: 'Показать', todos: 'Все', todas: 'Все',
      eligePais: 'Выберите страну, чтобы увидеть её регионы.', unaZona: 'один регион', vistaGlobal: 'Весь мир', verLista: 'Список',
      todosPaises: 'Все страны', enVista: 'В этой области', ocultar: 'Скрыть список', vacio: 'В этой части карты нет объектов. Уменьшите масштаб или нажмите на глобус.',
      precio: 'Цена', consultar: 'Цена по запросу', habs: 'Номера', sup: 'Площадь', fichaBtn: 'Подробнее', hab: 'ном.',
      categoria: 'Категория', operacion: 'Тип сделки', estado: 'Статус', ciudad: 'Город', pais: 'Страна', moneda: 'Валюта',
      usd: 'Доллар США (USD)', eur: 'Евро (EUR)', descripcion: 'Описание', ubic: 'Примерное расположение: указан только город.',
      cerrar: 'Закрыть', acercar: 'Приблизить', alejar: 'Отдалить', formTitle: 'Запросить информацию', formSub: 'Мы отправим вам полное досье объекта.',
      nombre: 'Имя и фамилия', email: 'Email', tel: 'Телефон', oficina: 'Офис / франшиза', interes: 'Интересующий объект', todosActivos: 'Все объекты',
      mensaje: 'Сообщение', msgPh: 'Профиль покупателя, сроки…', enviar: 'Отправить запрос', okT: 'Запрос получен!', okP: 'Спасибо. Команда Investplus скоро свяжется с вами.',
      volver: 'Вернуться к карте', cargando: 'Загрузка объектов…', errorCarga: 'Не удалось загрузить объекты. Попробуйте позже.',
      grupos: { hotel: 'Отели и комплексы', obra: 'Строящиеся / проекты', reforma: 'Закрытые / под реконструкцию', suelo: 'Земельные участки', otros: 'Другие объекты' }
    },
    pt: { activos: 'ativos', activo: 'ativo', paises: 'países', habitaciones: 'quartos', info: 'Solicitar informações', infoShort: 'Info', filtros: 'Filtros', zona: 'Região', tipo: 'Tipo de ativo', quitar: 'Limpar filtros', ver: 'Ver', todos: 'Todos', todas: 'Todas', eligePais: 'Escolha um país para ver as suas regiões.', unaZona: 'uma única região', vistaGlobal: 'Vista global', verLista: 'Ver lista', todosPaises: 'Todos os países', enVista: 'Nesta vista', ocultar: 'Ocultar lista', vacio: 'Não há ativos nesta zona do mapa. Afaste o mapa ou toque no globo para a vista global.', precio: 'Preço', consultar: 'Preço sob consulta', habs: 'Quartos', sup: 'Área', fichaBtn: 'Ver ficha completa', hab: 'quartos', categoria: 'Categoria', operacion: 'Tipo de operação', estado: 'Situação comercial', ciudad: 'Cidade', pais: 'País', moneda: 'Moeda', usd: 'Dólar americano (USD)', eur: 'Euro (EUR)', descripcion: 'Descrição', ubic: 'Localização aproximada: mostra-se apenas a cidade.', cerrar: 'Fechar', acercar: 'Aproximar', alejar: 'Afastar', formTitle: 'Solicitar informações', formSub: 'Enviaremos o dossiê completo do ativo.', nombre: 'Nome completo', email: 'Email', tel: 'Telefone', oficina: 'Escritório / franquia', interes: 'Ativo de interesse', todosActivos: 'Todos os ativos', mensaje: 'Mensagem', msgPh: 'Perfil do comprador, prazos…', enviar: 'Enviar pedido', okT: 'Pedido recebido!', okP: 'Obrigado. A equipa Investplus entrará em contacto em breve.', volver: 'Voltar ao mapa', cargando: 'A carregar ativos…', errorCarga: 'Não foi possível carregar os ativos. Tente novamente mais tarde.', grupos: { hotel: 'Hotéis e complexos', obra: 'Em obra / projeto', reforma: 'Fechado / para reforma', suelo: 'Terrenos', otros: 'Outros ativos' } },
    fr: { activos: 'actifs', activo: 'actif', paises: 'pays', habitaciones: 'chambres', info: 'Demander des informations', infoShort: 'Info', filtros: 'Filtres', zona: 'Zone', tipo: 'Type d\'actif', quitar: 'Effacer les filtres', ver: 'Voir', todos: 'Tous', todas: 'Toutes', eligePais: 'Choisissez un pays pour voir ses zones.', unaZona: 'une seule zone', vistaGlobal: 'Vue mondiale', verLista: 'Voir la liste', todosPaises: 'Tous les pays', enVista: 'Dans cette vue', ocultar: 'Masquer la liste', vacio: 'Aucun actif dans cette zone de la carte. Dézoomez ou touchez le globe pour la vue mondiale.', precio: 'Prix', consultar: 'Prix sur demande', habs: 'Chambres', sup: 'Surface', fichaBtn: 'Voir la fiche complète', hab: 'ch.', categoria: 'Catégorie', operacion: 'Type d\'opération', estado: 'Statut commercial', ciudad: 'Ville', pais: 'Pays', moneda: 'Devise', usd: 'Dollar américain (USD)', eur: 'Euro (EUR)', descripcion: 'Description', ubic: 'Emplacement approximatif : seule la ville est indiquée.', cerrar: 'Fermer', acercar: 'Zoomer', alejar: 'Dézoomer', formTitle: 'Demander des informations', formSub: 'Nous vous enverrons le dossier complet de l\'actif.', nombre: 'Nom et prénom', email: 'Email', tel: 'Téléphone', oficina: 'Agence / franchise', interes: 'Actif d\'intérêt', todosActivos: 'Tous les actifs', mensaje: 'Message', msgPh: 'Profil de l\'acheteur, délais…', enviar: 'Envoyer la demande', okT: 'Demande reçue !', okP: 'Merci. L\'équipe Investplus vous contactera très bientôt.', volver: 'Retour à la carte', cargando: 'Chargement des actifs…', errorCarga: 'Impossible de charger les actifs. Réessayez plus tard.', grupos: { hotel: 'Hôtels et complexes', obra: 'En construction / projet', reforma: 'Fermé / à rénover', suelo: 'Terrains', otros: 'Autres actifs' } },
    it: { activos: 'asset', activo: 'asset', paises: 'paesi', habitaciones: 'camere', info: 'Richiedi informazioni', infoShort: 'Info', filtros: 'Filtri', zona: 'Zona', tipo: 'Tipo di asset', quitar: 'Rimuovi filtri', ver: 'Vedi', todos: 'Tutti', todas: 'Tutte', eligePais: 'Scegli un paese per vedere le sue zone.', unaZona: 'una sola zona', vistaGlobal: 'Vista globale', verLista: 'Vedi elenco', todosPaises: 'Tutti i paesi', enVista: 'In questa vista', ocultar: 'Nascondi elenco', vacio: 'Nessun asset in questa zona della mappa. Riduci lo zoom o tocca il globo per la vista globale.', precio: 'Prezzo', consultar: 'Prezzo su richiesta', habs: 'Camere', sup: 'Superficie', fichaBtn: 'Vedi scheda completa', hab: 'camere', categoria: 'Categoria', operacion: 'Tipo di operazione', estado: 'Stato commerciale', ciudad: 'Città', pais: 'Paese', moneda: 'Valuta', usd: 'Dollaro statunitense (USD)', eur: 'Euro (EUR)', descripcion: 'Descrizione', ubic: 'Posizione approssimativa: viene mostrata solo la città.', cerrar: 'Chiudi', acercar: 'Ingrandisci', alejar: 'Riduci', formTitle: 'Richiedi informazioni', formSub: 'Ti invieremo il dossier completo dell\'asset.', nombre: 'Nome e cognome', email: 'Email', tel: 'Telefono', oficina: 'Ufficio / franchising', interes: 'Asset di interesse', todosActivos: 'Tutti gli asset', mensaje: 'Messaggio', msgPh: 'Profilo dell\'acquirente, tempistiche…', enviar: 'Invia richiesta', okT: 'Richiesta ricevuta!', okP: 'Grazie. Il team Investplus ti contatterà a breve.', volver: 'Torna alla mappa', cargando: 'Caricamento asset…', errorCarga: 'Impossibile caricare gli asset. Riprova più tardi.', grupos: { hotel: 'Hotel e complessi', obra: 'In costruzione / progetto', reforma: 'Chiuso / da ristrutturare', suelo: 'Terreni', otros: 'Altri asset' } },
    de: { activos: 'Objekte', activo: 'Objekt', paises: 'Länder', habitaciones: 'Zimmer', info: 'Informationen anfordern', infoShort: 'Info', filtros: 'Filter', zona: 'Region', tipo: 'Objektart', quitar: 'Filter zurücksetzen', ver: 'Anzeigen', todos: 'Alle', todas: 'Alle', eligePais: 'Wählen Sie ein Land, um seine Regionen zu sehen.', unaZona: 'nur eine Region', vistaGlobal: 'Weltansicht', verLista: 'Liste anzeigen', todosPaises: 'Alle Länder', enVista: 'In dieser Ansicht', ocultar: 'Liste ausblenden', vacio: 'Keine Objekte in diesem Kartenbereich. Herauszoomen oder auf den Globus tippen.', precio: 'Preis', consultar: 'Preis auf Anfrage', habs: 'Zimmer', sup: 'Fläche', fichaBtn: 'Vollständiges Exposé', hab: 'Zi.', categoria: 'Kategorie', operacion: 'Transaktionsart', estado: 'Status', ciudad: 'Stadt', pais: 'Land', moneda: 'Währung', usd: 'US-Dollar (USD)', eur: 'Euro (EUR)', descripcion: 'Beschreibung', ubic: 'Ungefährer Standort: Es wird nur die Stadt angezeigt.', cerrar: 'Schließen', acercar: 'Vergrößern', alejar: 'Verkleinern', formTitle: 'Informationen anfordern', formSub: 'Wir senden Ihnen das vollständige Exposé des Objekts.', nombre: 'Vor- und Nachname', email: 'E-Mail', tel: 'Telefon', oficina: 'Büro / Franchise', interes: 'Objekt von Interesse', todosActivos: 'Alle Objekte', mensaje: 'Nachricht', msgPh: 'Käuferprofil, Zeitrahmen…', enviar: 'Anfrage senden', okT: 'Anfrage erhalten!', okP: 'Vielen Dank. Das Investplus-Team meldet sich in Kürze bei Ihnen.', volver: 'Zurück zur Karte', cargando: 'Objekte werden geladen…', errorCarga: 'Die Objekte konnten nicht geladen werden. Bitte später erneut versuchen.', grupos: { hotel: 'Hotels und Anlagen', obra: 'Im Bau / Projekt', reforma: 'Geschlossen / zu sanieren', suelo: 'Grundstücke', otros: 'Sonstige Objekte' } }
  };

  // Catálogos: clave -> { idioma: texto } ; en "tipo", g = grupo/color del mapa
  var tipo = {
    hotel_operativo:       { g: 'hotel', es: 'Hotel operativo', en: 'Operating hotel', ru: 'Действующий отель' },
    hotel_boutique:        { g: 'hotel', es: 'Hotel boutique', en: 'Boutique hotel', ru: 'Бутик-отель' },
    hotel_resort:          { g: 'hotel', es: 'Hotel resort', en: 'Resort hotel', ru: 'Курортный отель' },
    resort_todo_incluido:  { g: 'hotel', es: 'Resort todo incluido', en: 'All-inclusive resort', ru: 'Курорт «всё включено»' },
    hotel_frente_mar:      { g: 'hotel', es: 'Hotel frente al mar', en: 'Beachfront hotel', ru: 'Отель на первой линии моря' },
    aparthotel:            { g: 'hotel', es: 'Aparthotel', en: 'Aparthotel', ru: 'Апарт-отель' },
    hotel_restaurante:     { g: 'hotel', es: 'Hotel y restaurante', en: 'Hotel and restaurant', ru: 'Отель с рестораном' },
    hotel_plaza_comercial: { g: 'hotel', es: 'Hotel y plaza comercial', en: 'Hotel and shopping plaza', ru: 'Отель и торговая площадь' },
    complejo_cabanas:      { g: 'hotel', es: 'Complejo de cabañas', en: 'Cabin complex', ru: 'Комплекс коттеджей' },
    villa_turistica:       { g: 'hotel', es: 'Villa turística', en: 'Tourist villa', ru: 'Туристическая вилла' },
    hotel_semiconstruido:  { g: 'obra', es: 'Hotel semiconstruido', en: 'Partly built hotel', ru: 'Недостроенный отель' },
    proyecto_hotelero:     { g: 'obra', es: 'Proyecto hotelero', en: 'Hotel project', ru: 'Гостиничный проект' },
    macro_desarrollo:      { g: 'obra', es: 'Proyecto de macrodesarrollo', en: 'Large-scale development project', ru: 'Крупный девелоперский проект' },
    hotel_cerrado:         { g: 'reforma', es: 'Hotel cerrado', en: 'Closed hotel', ru: 'Закрытый отель' },
    hotel_para_reforma:    { g: 'reforma', es: 'Hotel para reforma', en: 'Hotel for refurbishment', ru: 'Отель под реконструкцию' },
    edificio_convertible:  { g: 'reforma', es: 'Edificio convertible', en: 'Building for conversion', ru: 'Здание под перепрофилирование' },
    suelo_hotelero:        { g: 'suelo', es: 'Suelo hotelero', en: 'Hotel land', ru: 'Участок под отель' },
    terreno:               { g: 'suelo', es: 'Terreno', en: 'Land', ru: 'Земельный участок' },
    terreno_turistico:     { g: 'suelo', es: 'Terreno turístico / residencial', en: 'Tourist / residential land', ru: 'Участок под туризм / жильё' },
    terreno_playa:         { g: 'suelo', es: 'Terreno de playa', en: 'Beach land', ru: 'Участок у пляжа' },
    terreno_golf:          { g: 'suelo', es: 'Terreno turístico / campo de golf', en: 'Tourist land / golf course', ru: 'Участок под туризм / гольф' },
    terreno_ecoturistico:  { g: 'suelo', es: 'Terreno ecoturístico', en: 'Eco-tourism land', ru: 'Участок под экотуризм' },
    terreno_vinedo:        { g: 'suelo', es: 'Terreno / viñedo', en: 'Land / vineyard', ru: 'Участок / виноградник' },
    plaza_comercial:       { g: 'otros', es: 'Plaza comercial', en: 'Shopping plaza', ru: 'Торговая площадь' },
    otro:                  { g: 'otros', es: 'Otro activo', en: 'Other asset', ru: 'Другой объект' }
  };
  var categoria = {
    estrellas_1: { es: '1 estrella', en: '1-star', ru: '1 звезда' }, estrellas_2: { es: '2 estrellas', en: '2-star', ru: '2 звезды' },
    estrellas_3: { es: '3 estrellas', en: '3-star', ru: '3 звезды' }, estrellas_4: { es: '4 estrellas', en: '4-star', ru: '4 звезды' },
    estrellas_5: { es: '5 estrellas', en: '5-star', ru: '5 звёзд' }, lujo: { es: 'Lujo', en: 'Luxury', ru: 'Люкс' },
    boutique_lujo: { es: 'Boutique de lujo', en: 'Luxury boutique', ru: 'Бутик люкс' }, rural: { es: 'Rural', en: 'Rural', ru: 'Сельский' },
    apartamentos_turisticos: { es: 'Apartamentos turísticos', en: 'Tourist apartments', ru: 'Туристические апартаменты' },
    cabanas_turisticas: { es: 'Cabañas turísticas', en: 'Tourist cabins', ru: 'Туристические коттеджи' }
  };
  var operacion = {
    venta_completa: { es: 'Venta completa', en: 'Full sale', ru: 'Полная продажа' }, venta: { es: 'Venta', en: 'Sale', ru: 'Продажа' },
    venta_suelo: { es: 'Venta de suelo', en: 'Land sale', ru: 'Продажа участка' }, venta_participaciones: { es: 'Venta de participaciones', en: 'Sale of shares', ru: 'Продажа долей' },
    venta_fondo_comercio: { es: 'Venta de fondo de comercio', en: 'Business sale (goodwill)', ru: 'Продажа действующего бизнеса' },
    venta_activo_ocupado: { es: 'Venta de activo (ocupado, sin posesión)', en: 'Asset sale (occupied, no possession)', ru: 'Продажа объекта (занят, без передачи владения)' },
    a_negociar: { es: 'A negociar', en: 'Negotiable', ru: 'Договорная' }
  };
  var estado = {
    disponible: { es: 'Disponible', en: 'Available', ru: 'Доступен' }, nuevo: { es: 'Nuevo', en: 'New', ru: 'Новый' },
    interes_preliminar: { es: 'Interés preliminar', en: 'Preliminary interest', ru: 'Предварительный интерес' },
    en_negociacion: { es: 'En negociación', en: 'Under negotiation', ru: 'На переговорах' }, cerrado: { es: 'Cerrado', en: 'Closed', ru: 'Закрыт' }
  };

  // Otros idiomas de los catálogos (pt, fr, it, de)
  (function (extra) {
    var C = { tipo: tipo, categoria: categoria, operacion: operacion, estado: estado };
    Object.keys(extra).forEach(function (k) {
      var p = k.split('.'), v = extra[k];
      ['pt', 'fr', 'it', 'de'].forEach(function (l, i) { C[p[0]][p[1]][l] = v[i]; });
    });
  })({
    'tipo.hotel_operativo': ['Hotel em funcionamento', 'Hôtel en activité', 'Hotel operativo', 'Betriebenes Hotel'],
    'tipo.hotel_boutique': ['Hotel boutique', 'Hôtel boutique', 'Hotel boutique', 'Boutique-Hotel'],
    'tipo.hotel_resort': ['Hotel resort', 'Hôtel resort', 'Hotel resort', 'Resorthotel'],
    'tipo.resort_todo_incluido': ['Resort tudo incluído', 'Resort tout compris', 'Resort all inclusive', 'All-inclusive-Resort'],
    'tipo.hotel_frente_mar': ['Hotel à beira-mar', 'Hôtel en bord de mer', 'Hotel fronte mare', 'Hotel am Meer'],
    'tipo.aparthotel': ['Apart-hotel', 'Apparthôtel', 'Aparthotel', 'Aparthotel'],
    'tipo.hotel_restaurante': ['Hotel e restaurante', 'Hôtel et restaurant', 'Hotel e ristorante', 'Hotel mit Restaurant'],
    'tipo.hotel_plaza_comercial': ['Hotel e centro comercial', 'Hôtel et galerie commerciale', 'Hotel e centro commerciale', 'Hotel und Einkaufszentrum'],
    'tipo.complejo_cabanas': ['Complexo de chalés', 'Complexe de chalets', 'Complesso di chalet', 'Hüttenanlage'],
    'tipo.villa_turistica': ['Villa turística', 'Villa touristique', 'Villa turistica', 'Ferienvilla'],
    'tipo.hotel_semiconstruido': ['Hotel parcialmente construído', 'Hôtel partiellement construit', 'Hotel parzialmente costruito', 'Teilweise gebautes Hotel'],
    'tipo.proyecto_hotelero': ['Projeto hoteleiro', 'Projet hôtelier', 'Progetto alberghiero', 'Hotelprojekt'],
    'tipo.macro_desarrollo': ['Projeto de grande desenvolvimento', 'Projet de grand aménagement', 'Progetto di grande sviluppo', 'Großes Entwicklungsprojekt'],
    'tipo.hotel_cerrado': ['Hotel fechado', 'Hôtel fermé', 'Hotel chiuso', 'Geschlossenes Hotel'],
    'tipo.hotel_para_reforma': ['Hotel para reforma', 'Hôtel à rénover', 'Hotel da ristrutturare', 'Sanierungsbedürftiges Hotel'],
    'tipo.edificio_convertible': ['Edifício para reconversão', 'Immeuble à reconvertir', 'Edificio da riconvertire', 'Gebäude zur Umnutzung'],
    'tipo.suelo_hotelero': ['Terreno hoteleiro', 'Terrain hôtelier', 'Terreno alberghiero', 'Hotelgrundstück'],
    'tipo.terreno': ['Terreno', 'Terrain', 'Terreno', 'Grundstück'],
    'tipo.terreno_turistico': ['Terreno turístico / residencial', 'Terrain touristique / résidentiel', 'Terreno turistico / residenziale', 'Touristisches / Wohngrundstück'],
    'tipo.terreno_playa': ['Terreno de praia', 'Terrain en bord de plage', 'Terreno sulla spiaggia', 'Strandgrundstück'],
    'tipo.terreno_golf': ['Terreno turístico / campo de golfe', 'Terrain touristique / golf', 'Terreno turistico / campo da golf', 'Touristisches Grundstück / Golfplatz'],
    'tipo.terreno_ecoturistico': ['Terreno ecoturístico', 'Terrain écotouristique', 'Terreno ecoturistico', 'Ökotourismus-Grundstück'],
    'tipo.terreno_vinedo': ['Terreno / vinhedo', 'Terrain / vignoble', 'Terreno / vigneto', 'Grundstück / Weinberg'],
    'tipo.plaza_comercial': ['Centro comercial', 'Galerie commerciale', 'Centro commerciale', 'Einkaufszentrum'],
    'tipo.otro': ['Outro ativo', 'Autre actif', 'Altro asset', 'Sonstiges Objekt'],
    'categoria.estrellas_1': ['1 estrela', '1 étoile', '1 stella', '1 Stern'],
    'categoria.estrellas_2': ['2 estrelas', '2 étoiles', '2 stelle', '2 Sterne'],
    'categoria.estrellas_3': ['3 estrelas', '3 étoiles', '3 stelle', '3 Sterne'],
    'categoria.estrellas_4': ['4 estrelas', '4 étoiles', '4 stelle', '4 Sterne'],
    'categoria.estrellas_5': ['5 estrelas', '5 étoiles', '5 stelle', '5 Sterne'],
    'categoria.lujo': ['Luxo', 'Luxe', 'Lusso', 'Luxus'],
    'categoria.boutique_lujo': ['Boutique de luxo', 'Boutique de luxe', 'Boutique di lusso', 'Luxus-Boutique'],
    'categoria.rural': ['Rural', 'Rural', 'Rurale', 'Ländlich'],
    'categoria.apartamentos_turisticos': ['Apartamentos turísticos', 'Appartements touristiques', 'Appartamenti turistici', 'Ferienwohnungen'],
    'categoria.cabanas_turisticas': ['Chalés turísticos', 'Chalets touristiques', 'Chalet turistici', 'Ferienhütten'],
    'operacion.venta_completa': ['Venda integral', 'Vente totale', 'Vendita totale', 'Gesamtverkauf'],
    'operacion.venta': ['Venda', 'Vente', 'Vendita', 'Verkauf'],
    'operacion.venta_suelo': ['Venda de terreno', 'Vente de terrain', 'Vendita di terreno', 'Grundstücksverkauf'],
    'operacion.venta_participaciones': ['Venda de participações', 'Vente de parts sociales', 'Vendita di quote', 'Verkauf von Anteilen'],
    'operacion.venta_fondo_comercio': ['Venda do fundo de comércio', 'Vente du fonds de commerce', 'Vendita dell\'avviamento', 'Verkauf des Geschäftsbetriebs'],
    'operacion.venta_activo_ocupado': ['Venda do ativo (ocupado, sem posse)', 'Vente de l\'actif (occupé, sans possession)', 'Vendita dell\'asset (occupato, senza possesso)', 'Objektverkauf (belegt, ohne Besitz)'],
    'operacion.a_negociar': ['A negociar', 'À négocier', 'Da negoziare', 'Verhandelbar'],
    'estado.disponible': ['Disponível', 'Disponible', 'Disponibile', 'Verfügbar'],
    'estado.nuevo': ['Novo', 'Nouveau', 'Nuovo', 'Neu'],
    'estado.interes_preliminar': ['Interesse preliminar', 'Intérêt préliminaire', 'Interesse preliminare', 'Vorläufiges Interesse'],
    'estado.en_negociacion': ['Em negociação', 'En négociation', 'In trattativa', 'In Verhandlung'],
    'estado.cerrado': ['Fechado', 'Clôturé', 'Chiuso', 'Abgeschlossen']
  });

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

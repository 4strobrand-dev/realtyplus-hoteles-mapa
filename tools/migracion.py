# -*- coding: utf-8 -*-
"""Prepara los 76 activos para Supabase (mapa v2): solo ciudad (sin dirección ni fotos), textos ES/EN.
Salida: sql/01_esquema.sql, sql/02_datos.sql y assets/data/activos_publicos.json (respaldo local del mapa).
Uso: python -X utf8 tools/migracion.py
"""
import json, pathlib, re

R = pathlib.Path(__file__).resolve().parent.parent
src = (R.parent / "_archivo mapa v1 (con fotos)" / "assets/data/activos.js").read_text(encoding="utf8")
A = json.loads(src[src.index("["):src.rindex("]") + 1])

# ---- ciudad mostrada (solo ciudad / zona general) y coordenadas del centro urbano
CIUDAD = {
    "República Dominicana 5": ("Montecristi", 19.848, -71.646),
    "República Dominicana 6": ("Miches", 18.983, -69.045),
    "República Dominicana 8": ("Península de Samaná", 19.205, -69.336),
    "República Dominicana 9": ("Las Terrenas", 19.311, -69.542),
    "República Dominicana 10": ("Barahona", 18.208, -71.100),
    "República Dominicana 14": ("Cabrera", 19.640, -69.903),
    "República Dominicana 11": ("Puerto Plata", 19.793, -70.689),
    "USA 3": ("Miami, Florida", 25.774, -80.194),
    "España 4": ("Málaga, Costa del Sol", 36.721, -4.421),
    "España 5": ("Málaga, Costa del Sol", 36.721, -4.421),
    "Argentina 25": ("Maipú, Mendoza", -32.983, -68.783),
    "Argentina 26": ("Maipú, Mendoza", -32.983, -68.783),
    "Argentina 11": ("Luján de Cuyo, Mendoza", -33.040, -68.880),
    "Argentina 12": ("Tunuyán, Mendoza", -33.577, -69.016),
    "Argentina 7": ("Guaymallén, Mendoza", -32.900, -68.790),
}

TIPO_EN = {
    "Hotel semiconstruido": "Partly built hotel", "Hotel operativo": "Operating hotel", "Proyecto hotelero": "Hotel project",
    "Aparthotel": "Aparthotel", "Apart hotel": "Aparthotel", "Hotel para reforma": "Hotel for refurbishment", "Suelo hotelero": "Hotel land",
    "Hotel y Plaza Comercial": "Hotel and shopping plaza", "Hotel y Restaurante": "Hotel and restaurant", "Plaza Comercial": "Shopping plaza",
    "Hotel Resort": "Resort hotel", "Terreno Turístico / Residencial": "Tourist / residential land", "Terreno Ecoturístico": "Eco-tourism land",
    "Terreno de Playa": "Beach land", "Terreno Turístico / Campo de Golf": "Tourist land / golf course", "Hotel Boutique": "Boutique hotel",
    "Hotel / Apart-Hotel": "Hotel / aparthotel", "Villa Turística": "Tourist villa", "Proyecto Macro-Desarrollo": "Large-scale development project",
    "Resort Todo Incluido": "All-inclusive resort", "Hotel Frente al Mar": "Beachfront hotel", "Edificio convertible": "Building for conversion",
    "Hotel cerrado": "Closed hotel", "Hotel cerrado (+ 3 locales)": "Closed hotel (+ 3 retail units)", "Complejo Operativo": "Operating complex",
    "Terreno": "Land", "Terreno / viñedo": "Land / vineyard", "Complejo de cabañas": "Cabin complex", "Hotel": "Hotel",
}
TIPO_FIX = {"USA 4": "Hotel operativo", "USA 5": "Hotel operativo", "Argentina 1": "Complejo de cabañas", "Argentina 7": "Terreno"}

def tipo_key(t):
    t = t.lower()
    if re.search(r"terreno|suelo|predio", t): return "suelo"
    if re.search(r"semiconstruido|proyecto", t): return "obra"
    if re.search(r"cerrado|reforma|convertible", t): return "reforma"
    if re.search(r"hotel|resort|apart|villa|complejo|cabañ|boutique", t): return "hotel"
    return "otros"

CAT = {  # categoría -> (es, en)
    "3 Estrellas": 3, "3": 3, "3 estrellas": 3, "5 estrellas": 5, "5 Estrellas": 5, "4 estrellas": 4, "4 Estrellas": 4, "4 estrelas": 4,
    "2 Estrellas": 2, "2": 2, "1": 1, "1900-01-04": 4,
    "Lujo": ("Lujo", "Luxury"), "Rural": ("Rural", "Rural"), "boutique de lujo": ("Boutique de lujo", "Luxury boutique"),
    "Hotel Boutique Lujo": ("Boutique de lujo", "Luxury boutique"), "Apartamentos Turisticos": ("Apartamentos turísticos", "Tourist apartments"),
    "Cabañas para turismo": ("Cabañas turísticas", "Tourist cabins"), "Complejo de cabañas para turismo": ("Cabañas turísticas", "Tourist cabins"),
}
def categoria(v):
    c = CAT.get(str(v).strip()) if v is not None else None
    if c is None: return None, None
    if isinstance(c, int): return f"{c} estrella{'s' if c > 1 else ''}", f"{c}-star"
    return c

OPER = {"Venta completa": ("Venta completa", "Full sale"), "Venta": ("Venta", "Sale"), "a negociar": ("A negociar", "Negotiable"),
        "Venta de suelo": ("Venta de suelo", "Land sale"), "Venta de participaciones": ("Venta de participaciones", "Sale of shares"),
        "Venta de activo(Okupado / Sin posesión)": ("Venta de activo (ocupado, sin posesión)", "Asset sale (occupied, no possession)"),
        "Venta de fondo de comercio": ("Venta de fondo de comercio", "Business sale (goodwill)")}
ESTADO = {"Disponible para presentar": ("Disponible", "Available"), "Disponible": ("Disponible", "Available"), None: ("Disponible", "Available"),
          "Interés preliminar": ("Interés preliminar", "Preliminary interest"), "Negociación": ("En negociación", "Under negotiation"),
          "Cerrado": ("Cerrado", "Closed"), "Nuevo": ("Nuevo", "New"), "Revisado": ("Disponible", "Available"),
          "Nuevo. Disponible para Presentar": ("Nuevo", "New")}

def moneda(m):
    m = str(m or "")
    return "EUR" if re.search(r"eur|€", m, re.I) else "USD"

def precio(v):
    if isinstance(v, (int, float)): return v
    s = str(v or "").strip()
    if re.fullmatch(r"\d{1,3}(,\d{3})+(\.\d+)?", s): return float(s.replace(",", ""))
    return None

# habitaciones / superficie (ES, EN)
HAB = {
    "República Dominicana 1": ("45 hab. (+5 espacios)", "45 rooms (+5 spaces)"), "República Dominicana 2": ("26 hab. + 12 apartamentos", "26 rooms + 12 apartments"),
    "República Dominicana 3": ("Locales comerciales", "Retail units"), "República Dominicana 4": ("900+", "900+"),
    "República Dominicana 5": ("Terreno de 8.049.435 m²", "8,049,435 m² plot"), "República Dominicana 6": ("Terreno de 1.200.000 m²", "1,200,000 m² plot"),
    "República Dominicana 7": ("Terreno de 174.593 m²", "174,593 m² plot"), "República Dominicana 8": ("Terreno de 1.800.000 m²", "1,800,000 m² plot"),
    "República Dominicana 10": ("12 apartamentos (+10 en desarrollo)", "12 apartments (+10 in development)"), "República Dominicana 11": ("400+", "400+"),
    "República Dominicana 12": ("400 (+400 en desarrollo)", "400 (+400 in development)"), "República Dominicana 14": ("Terreno de 1.067.557 m²", "1,067,557 m² plot"),
    "República Dominicana 15": ("600+ (hab. y bungalows)", "600+ (rooms and bungalows)"), "República Dominicana 16": ("250+ (hab. y apartamentos)", "250+ (rooms and apartments)"),
    "USA 6": ("Entre 20 y 30", "20 to 30"), "España 3": ("40 - 55", "40 - 55"), "España 5": ("20 - 25", "20 - 25"), "España 6": ("35 - 40", "35 - 40"),
    "España 10": ("28 hab. + 8 bungalows", "28 rooms + 8 bungalows"), "España 11": ("Entre 50 y 70", "50 to 70"), "España 12": ("1.427 m² útiles", "1,427 m² usable"),
    "España 13": ("Entre 30 y 40", "30 to 40"), "España 14": ("15-30 hab. + 8-10 bungalows", "15-30 rooms + 8-10 bungalows"), "España 15": ("Entre 10 y 20", "10 to 20"),
    "Argentina 1": ("5 cabañas y una casa", "5 cabins and a house"), "Argentina 4": ("4 cabañas", "4 cabins"), "Argentina 6": ("8 hab. en varias unidades", "8 rooms across several units"),
    "Argentina 9": ("27 (potenciales)", "27 (potential)"), "Argentina 19": ("Terreno de 354 ha", "354 ha plot"), "Argentina 25": None,
    "Argentina 26": ("8 cabañas equipadas", "8 furnished cabins"), "Paraguay 1": ("Terreno de 952 m²", "952 m² plot"),
    "Grecia 1": ("Entre 200 y 300", "200 to 300"), "Grecia 2": ("Entre 200 y 300", "200 to 300"),
}
def habitaciones(ref, v):
    if ref in HAB: return HAB[ref] or (None, None)
    if v is None: return None, None
    s = str(v).strip()
    m = re.match(r"^(\d+)\s*(habitaciones|Habitaciones)?\s*$", s)
    if m: return m.group(1), m.group(1)
    return s, s

# descripción pública (sin nombres comerciales, direcciones, enlaces ni notas internas)
DESC = {
    "Venezuela 1": ("Obra construida al 70 %.", "70% of construction completed."),
    "Venezuela 3": ("Obra construida al 90 %.", "90% of construction completed."),
    "Venezuela 8": ("Dos terrenos: 4.600 m² y 3.022 m².", "Two plots: 4,600 m² and 3,022 m²."),
    "Venezuela 9": ("Terreno de 48.000 m².", "48,000 m² plot."),
    "República Dominicana 1": ("Espacios hoteleros y locales comerciales a pocos minutos del aeropuerto de Punta Cana.", "Hotel spaces and retail units a few minutes from Punta Cana airport."),
    "República Dominicana 2": ("Edificio de 3 niveles con restaurante, 2 salones, 2 terrazas, 30 plazas de aparcamiento y piscina.", "Three-storey building with restaurant, 2 function rooms, 2 terraces, 30 parking spaces and pool."),
    "República Dominicana 3": ("Supermercado 1.000 m², restauración rápida 1.400 m², gimnasio 750 m², servicios 750 m² y ocio 300 m².", "Supermarket 1,000 m², fast food 1,400 m², gym 750 m², services 750 m² and leisure 300 m²."),
    "República Dominicana 4": ("Terreno de más de 350.000 m² frente a la playa, ocupación del 80-100 %, 4 piscinas, 10 bares, 8 restaurantes y casino.", "Beachfront plot of over 350,000 m², 80-100% occupancy, 4 pools, 10 bars, 8 restaurants and casino."),
    "República Dominicana 5": ("8-10 km de frente de playa (US$ 10/m²), vocación turística y agrícola, junto a un parque nacional.", "8-10 km of beachfront (US$ 10/m²), tourism and agricultural potential, next to a national park."),
    "República Dominicana 6": ("Terreno para eco-resort (US$ 25/m²) con 900 m de playa, cerca de lagunas y montaña.", "Land for an eco-resort (US$ 25/m²) with 900 m of beach, near lagoons and mountains."),
    "República Dominicana 7": ("Lote con vista panorámica al mar y la montaña, frutales y zonas verdes.", "Plot with panoramic sea and mountain views, fruit trees and green areas."),
    "República Dominicana 8": ("1 km de frente de playa (US$ 32/m²), con potencial para campo de golf. Títulos al día.", "1 km of beachfront (US$ 32/m²), with potential for a golf course. Titles in order."),
    "República Dominicana 9": ("Primera línea de playa. Facturación superior a US$ 1,1 M, EBITDA aprox. 23 %, sin deuda y alta ocupación.", "Beachfront. Revenue above US$ 1.1M, EBITDA approx. 23%, debt-free and high occupancy."),
    "República Dominicana 10": ("Frente al mar, restaurante-bar para 150 personas, piscina con jacuzzi, planta eléctrica y seguridad 24/7.", "Seafront, restaurant-bar for 150 guests, pool with jacuzzi, power plant and 24/7 security."),
    "República Dominicana 11": ("Resort caribeño de lujo con acceso directo a la playa.", "Luxury Caribbean resort with direct beach access."),
    "República Dominicana 12": ("Frente a la playa, 400 habitaciones activas y 400 en desarrollo. Alto potencial.", "Beachfront, 400 active rooms and 400 in development. High potential."),
    "República Dominicana 13": ("600 m² construidos sobre 2.500 m² de terreno, piscina, jacuzzi, cancha de baloncesto y sala de billar.", "600 m² built on a 2,500 m² plot, pool, jacuzzi, basketball court and billiards room."),
    "República Dominicana 14": ("Proyecto con campo de golf de 18 hoyos, marina de 160 amarres, 700 m de playa, 1.000 m de acantilado y centro comercial. Terreno a US$ 40/m²; desarrollo estimado en US$ 56,3 M.", "Project with an 18-hole golf course, 160-berth marina, 700 m of beach, 1,000 m of cliffs and a shopping centre. Land at US$ 40/m²; development estimated at US$ 56.3M."),
    "República Dominicana 15": ("Remodelación de US$ 20 M en 2024. Playa privada y terreno para una ampliación importante.", "US$ 20M refurbishment in 2024. Private beach and land for a major expansion."),
    "República Dominicana 16": ("15.701 m² de terreno, casino operativo, discoteca, 3 piscinas, teatro y más de 20 locales comerciales.", "15,701 m² plot, operating casino, nightclub, 3 pools, theatre and over 20 retail units."),
    "España 2": ("Se vende el suelo y el proyecto.", "Land and project for sale."),
    "España 3": ("Se vende el suelo y el proyecto.", "Land and project for sale."),
    "España 4": ("Edificio para reformar en pleno centro, con proyecto de apartamentos turísticos.", "Building to refurbish in the city centre, with a tourist apartment project."),
    "España 5": ("Edificio reformado en pleno centro, con apartamentos turísticos.", "Refurbished building in the city centre, with tourist apartments."),
    "México 1": ("80 % de avance global de obra.", "80% overall construction progress."),
    "Argentina 1": ("Complejo de cabañas y casa de apoyo en zona turística de alta montaña.", "Cabin complex with support house in a high-mountain tourist area."),
    "Argentina 2": ("Hotel en la zona céntrica de la ciudad.", "Hotel in the city centre."),
    "Argentina 6": ("Se vende el fondo de comercio.", "Business (goodwill) for sale."),
    "Argentina 7": ("Terreno de 8.800 m², ideal para desarrollo hotelero, en el centro del Gran Mendoza.", "8,800 m² plot, ideal for hotel development, in central Greater Mendoza."),
    "Argentina 8": ("Hotel boutique en una de las zonas más exclusivas de Mendoza, en plena región vitivinícola.", "Boutique hotel in one of Mendoza's most exclusive areas, in the heart of the wine region."),
    "Argentina 9": ("Hotel boutique actualmente en renta. Ingreso anual de US$ 216.000 (rentabilidad del 5,4 % sobre el precio).", "Boutique hotel currently leased. Annual income of US$ 216,000 (5.4% yield on the asking price)."),
    "Argentina 10": ("Terreno de 2.461 m², libre de mejoras, en ubicación preferente.", "2,461 m² plot, undeveloped, in a prime location."),
    "Argentina 11": ("150 ha con agua de pozo y 10 ha de viñedo, en un entorno de proyectos turísticos de muy alto nivel.", "150 ha with well water and 10 ha of vineyard, surrounded by very high-end tourism projects."),
    "Argentina 12": ("33 ha, de ellas 16 ha de viñedo con derecho de riego, casa nueva de 136 m² y galpón agrícola, en entorno de bodegas.", "33 ha, 16 ha of vineyard with irrigation rights, new 136 m² house and farm shed, surrounded by wineries."),
    "Argentina 13": ("17 habitaciones (42 plazas), actualmente alquilado. Principal destino de playa de Argentina. Se vende junto con el activo Argentina 14.", "17 rooms (42 guests), currently leased. Argentina's main beach destination. Sold together with asset Argentina 14."),
    "Argentina 14": ("29 habitaciones (66 plazas), actualmente alquilado. Principal destino de playa de Argentina. Se vende junto con el activo Argentina 13.", "29 rooms (66 guests), currently leased. Argentina's main beach destination. Sold together with asset Argentina 13."),
    "Argentina 25": ("Predio de 80 ha con finca, bodega y pozo de agua. Potencial para desarrollo hotelero.", "80 ha estate with farm, winery and water well. Potential for hotel development."),
    "Argentina 26": ("Complejo de 16.000 m² con cabañas de 30 m² con pérgola, salón de 180 m² con cocina y piscina.", "16,000 m² complex with 30 m² cabins with pergola, 180 m² hall with kitchen, and pool."),
}

PAIS_EN = {"Venezuela": "Venezuela", "República Dominicana": "Dominican Republic", "USA": "United States", "United States": "United States",
           "Estados Unidos": "United States", "España": "Spain", "México": "Mexico", "Argentina": "Argentina", "Chile": "Chile",
           "Paraguay": "Paraguay", "Grecia": "Greece"}

def q(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"

rows = []
for i, x in enumerate(A):
    ref = x["Referencia Consultoría"].strip()
    g = x["_geo"]
    pais = x["País"].strip()
    if re.match(r"united states|usa", pais, re.I): pais = "Estados Unidos"
    ciudad, lat, lng = CIUDAD.get(ref, (g["zona"], g["lat"], g["lng"]))
    tipo = TIPO_FIX.get(ref) or (x.get("Tipo de activo") or "Hotel").strip()
    ce, cn = categoria(x.get("Categoría / Estrellas"))
    he, hn = habitaciones(ref, x.get("Habitaciones (rango orientativo)"))
    oe, on = OPER.get((x.get("Tipo de operación") or "").strip(), (x.get("Tipo de operación"), x.get("Tipo de operación")))
    ee, en = ESTADO.get(x.get("Estado comercial") and x["Estado comercial"].strip(), ("Disponible", "Available"))
    de, dn = DESC.get(ref, (None, None))
    rows.append(dict(referencia=ref, pais=pais, pais_en=PAIS_EN.get(pais, pais), ciudad=ciudad, region=g.get("region") or ciudad,
                     lat=lat, lng=lng, tipo_clave=tipo_key(tipo), tipo_es=tipo, tipo_en=TIPO_EN.get(tipo, tipo),
                     categoria_es=ce, categoria_en=cn, habitaciones_es=he, habitaciones_en=hn,
                     precio=precio(x.get("Precio")), moneda=moneda(x.get("Moneda")), operacion_es=oe, operacion_en=on,
                     estado_es=ee, estado_en=en, descripcion_es=de, descripcion_en=dn, publicado=True, orden=i + 1))

COLS = list(rows[0])
sql = "-- Datos iniciales: 76 activos (solo ciudad; sin fotos, direcciones ni datos internos)\n"
sql += "insert into public.activos (" + ", ".join(COLS) + ") values\n"
sql += ",\n".join("(" + ", ".join(q(r[c]) for c in COLS) + ")" for r in rows) + "\non conflict (referencia) do nothing;\n"
(R / "sql").mkdir(exist_ok=True)
(R / "sql/02_datos.sql").write_text(sql, encoding="utf8")
(R / "assets/data/activos_publicos.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf8")
print(len(rows), "activos;", sum(1 for r in rows if r["descripcion_es"]), "con descripción;", sum(1 for r in rows if r["precio"] is None), "sin precio")

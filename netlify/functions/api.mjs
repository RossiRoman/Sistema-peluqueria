/* Backend para Netlify (equivalente a server.py). Persistencia: Netlify Blobs.
   Variables de entorno recomendadas en Netlify: ADMIN_PIN (obligatoria en producción), ADMIN_SECRET (opcional). */
import { getStore } from "@netlify/blobs";
import { createHmac, createHash, timingSafeEqual, randomUUID } from "node:crypto";

export const config = { path: "/api/*" };

const TZ = "America/Argentina/Cordoba";
const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
const SECRET = process.env.ADMIN_SECRET || "pelu:" + ADMIN_PIN;
const FORMAS_PAGO = ["Efectivo", "Transferencia"];
const APERTURA = 9 * 60 + 30, CIERRE = 20 * 60, PASO = 30;
const DIAS_ABIERTO = [2, 3, 4, 5, 6];            // getUTCDay(): martes a sábado
const SERVICIOS = [
 {
  "id": 1,
  "nombre": "Corte Diseño + Lavado",
  "categoria": "Corte",
  "duracion": 45,
  "precio": 12500.0,
  "descripcion": "Diagnóstico capilar personalizado, lavado relajante y peinado final.",
  "etiqueta": "Recomendado",
  "imagen": "https://lh3.googleusercontent.com/aida-public/AB6AXuBSt3JyxJqf5D-BOuwJNfZVNY83HhmFE3nV6d1sFff7zRV3xnYubCjd9qO_tpSokPiuWnEehUfIXKiJiiAeIrZy0yrMt29sPqYD5lwmCFzgUB5ALk2xd7BHAbg53Z50AfwjFHXpWtyGzoCva5-iUnAiBxjJtX86kAiab85Cnp1_wtKyqLes4xM6UDkr56hMv9OHkagtG45XdgKoTIQJWD-bZ_jwbCzRNLskM3W14W9fxxTAdBC0RkA"
 },
 {
  "id": 2,
  "nombre": "Balayage & Nutrición",
  "categoria": "Coloración",
  "duracion": 120,
  "precio": 38000.0,
  "descripcion": "Iluminación artesanal francesa con baño de luz y nutrición profunda.",
  "etiqueta": "Signature",
  "imagen": "https://lh3.googleusercontent.com/aida-public/AB6AXuCrGzDefQUCp1ZIPihR72EmmvGop5-0lXe8FJVQuHnfkSLKNOW1yVT79h05y6DSuPQnd0D-YuJhSDERvvkVx9kiN1ClwEQoE9vuf2A41Ju6kzlM-DMkLRGE0-KCotyPA-yigSZWSSVMoWsCuIG65n16zbHTfpIIV6lPas9CEeRH_sHv6wEkrDRtL3FygMYUB02lVEBp5uB75lwQsB5011CruFFu85lvnF1ZCn-QgP9RhTlDcT-cCl8"
 },
 {
  "id": 3,
  "nombre": "Tratamiento Olaplex",
  "categoria": "Tratamientos",
  "duracion": 60,
  "precio": 18000.0,
  "descripcion": "Reconstrucción molecular de enlaces capilares para devolver brillo.",
  "etiqueta": "Intensivo",
  "imagen": "https://lh3.googleusercontent.com/aida-public/AB6AXuAcICwyIHx3JnJmUZrIK_Hb_aM2YpjXD1govwIIY5xl6x8QAsTslVmRBk1PorbST35Kxnq2ho1rflzZoHq0WWmYEPV1LXfetKpdsZoiAY-Ey_7Sf5_gGXjzZv61iSVIRfQc421joaYN1j2EK7wmDGIz8QLInIzB5S65jWXzOPknDblQ5mRSoGpMVFQLleSv8c3jr5IIEbAbBND1fBdDFM1mtDxOI2hDJTILLgAlYKA1bmsPPNR4rLY"
 },
 {
  "id": 4,
  "nombre": "Corte Masculino / Femenino",
  "categoria": "Corte",
  "duracion": 30,
  "precio": 8000.0,
  "descripcion": "Corte clásico a medida con terminación prolija.",
  "etiqueta": "Clásico",
  "imagen": ""
 },
 {
  "id": 5,
  "nombre": "Corte & Brushing",
  "categoria": "Peinados",
  "duracion": 45,
  "precio": 14000.0,
  "descripcion": "Corte y brushing de acabado profesional.",
  "etiqueta": "Peinado",
  "imagen": ""
 },
 {
  "id": 6,
  "nombre": "Arreglo de Barba / Perfilado",
  "categoria": "Barbería",
  "duracion": 30,
  "precio": 4500.0,
  "descripcion": "Perfilado con navaja y toalla caliente.",
  "etiqueta": "Barbería",
  "imagen": ""
 },
 {
  "id": 7,
  "nombre": "Combo Corte + Barba",
  "categoria": "Barbería",
  "duracion": 60,
  "precio": 11000.0,
  "descripcion": "Corte y arreglo de barba en una sola visita.",
  "etiqueta": "Combo",
  "imagen": ""
 },
 {
  "id": 8,
  "nombre": "Tintura / Colorimetría",
  "categoria": "Coloración",
  "duracion": 90,
  "precio": 18000.0,
  "descripcion": "Color uniforme con diagnóstico previo.",
  "etiqueta": "Color",
  "imagen": ""
 }
];
const ESTILISTAS = [
 {
  "id": 1,
  "nombre": "Sofía Albarracín",
  "rol": "Colorista Senior",
  "rating": 4.9,
  "categorias": [
   "Coloración",
   "Tratamientos",
   "Peinados",
   "Corte"
  ],
  "foto": "https://lh3.googleusercontent.com/aida-public/AB6AXuCRJFi1oeld3surCaUrsTrXMgPQ0JKFFi_XCi96bjuCUcLOvc6oWepa8n8yAUYnVkbaGL2fwmv5o5HbeA1fBh1S2OEQMYc5jxacEZXsCjQPPK-vYx4ST7pBSP2_U6s6dC-tm0NteF2LsPglkppwuw0vEf0HqyywlXE9cmtWey9T-F0sxQHEaOzM9HuncPYeAi3fqVqPl25PNJgTps6WbzG85c6jfDyi9mvDjLUe7yhG8FLnir20R08"
 },
 {
  "id": 2,
  "nombre": "Julián Viale",
  "rol": "Master Barber",
  "rating": 5.0,
  "categorias": [
   "Barbería",
   "Corte"
  ],
  "foto": "https://lh3.googleusercontent.com/aida-public/AB6AXuAsivbPpzUn_GJVh7L-adthcWBGJCq95C-v4MDfQRbX5vGujw21efXAgeWpgFVlmFJUtXwVebCjtRnhgniOg6Q9hEH5vgPNuQmAn0P0toleaKl8JTOxLqMQdTCxvUMFbjcIbj6LkVriHnEvsQhe367sWW7mon8khLGlVjtLMtdnfFO9VIbrYKp2HYamy_-4MHfZTVKdQ_rphntCFkV-F1lWR9-cuJrDyYdH7n1bdTHaGA17kmNsrBc"
 },
 {
  "id": 3,
  "nombre": "Camila Rossi",
  "rol": "Hair Stylist",
  "rating": 4.9,
  "categorias": [
   "Corte",
   "Peinados",
   "Coloración"
  ],
  "foto": "https://lh3.googleusercontent.com/aida-public/AB6AXuAs5GwTU7aqAW4GzqxbPHCYBrLT9-ao2JhGF4SeUbQbQvUELgqShZpdO8uNJ3lMmr0BYm_yxpKVVGFx1q-rfz-CZ48LA8u_KoBnowdrYizAt9oYlQJ52mflQSNBvHcPbzmtKxE7_oC1Bwm_m1sgtIpuorcU_lzT0VaorDOtb3QNfnuv6Oh_Ht1qOWy-Ci0JcuTn1JVqJb9FpbJBHf3GVLhHAbOZTGqI2FqO4hi-EOYWK70-kzyED8g"
 },
 {
  "id": 4,
  "nombre": "Mateo R.",
  "rol": "Estilista",
  "rating": 4.8,
  "categorias": [
   "Corte",
   "Peinados",
   "Barbería"
  ],
  "foto": "https://lh3.googleusercontent.com/aida-public/AB6AXuDGRVsNsqTmpmxj_vqou1fXHMr4vWQ6XWCWfmHq1VBwNMiBdcjtEa9Q_F4b6i0IJkJBvlaBlzR-xedLt9jsktsI0nkwZA-zpNjYuPHMJNjLUbIyWmtIDNJqcL9dSYoBMDR7DSnNHuXwXundcRT-AB04rQtAqTjx3OayH1NqVDmYEX3eJmuvhg0pypl5NKjyPaI4t4GMaVv0Uitk33TyTtrzrTO9sIUnbdfCf8X_Q1DVIQV_z9bMhxo"
 }
];

/* ---------- fechas (minutos "locales" de Argentina, sin depender del huso del servidor) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const parse = (f, h = "00:00") => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f || ""), t = /^(\d{1,2}):(\d{2})$/.exec(h || "");
  if (!m || !t) return null;
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
  return new Date(ms).getUTCMonth() === +m[2] - 1 ? ms / 60000 : null;
};
const fmt = (min) => { const d = new Date(min * 60000); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
const dow = (min) => new Date(min * 60000).getUTCDay();
const ahora = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) / 60000;
};

/* ---------- persistencia ---------- */
const mem = new Map();   // solo para pruebas locales (LOCAL_MEMORY_STORE=1)
const db = () => process.env.LOCAL_MEMORY_STORE
  ? {
      get: async (k) => mem.get(k)?.v ?? null,
      setJSON: async (k, v) => { mem.set(k, { v: structuredClone(v) }); },
      set: async (k, v, o) => { mem.set(k, { v, meta: o?.metadata }); },
      getWithMetadata: async (k) => (mem.has(k) ? { data: mem.get(k).v, metadata: mem.get(k).meta } : null),
      delete: async (k) => { mem.delete(k); },
    }
  : getStore("peluqueria");
const leer = async (k, def) => (await db().get(k, { type: "json" })) ?? def;
const guardar = (k, v) => db().setJSON(k, v);

/* ---------- catálogo editable (estilos/servicios y productos) ---------- */
const catalogo = async () => {
  const c = await leer("catalogo", null);
  return c ? { productos: [], ...c } : { servicios: structuredClone(SERVICIOS), productos: [] };
};
const CATEGORIAS = [...new Set(ESTILISTAS.flatMap((e) => e.categorias))];   // categorías que algún estilista atiende
const texto = (v, max) => String(v ?? "").trim().slice(0, max);
const monto = (v) => { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) && n > 0 && n <= 1e7 ? Math.round(n * 100) / 100 : null; };
const IMG_OK = /^(\/api\/img\/[a-f0-9]{32}|https:\/\/[^\s]{1,1900})$/;
const borrarImg = async (url) => { const m = /^\/api\/img\/([a-f0-9]{32})$/.exec(url || ""); if (m) await db().delete("img:" + m[1]).catch(() => {}); };
const sigId = (lista) => Math.max(0, ...lista.map((x) => x.id)) + 1;

/* ---------- lógica de negocio ---------- */
const servicio = (cat, id) => cat.servicios.find((s) => s.id === id);
const precio = (s, ini) => { let p = s.precio; if ([0, 6].includes(dow(ini))) p *= 1.2; if (Math.floor((ini % 1440) / 60) >= 19) p += 1500; return Math.round(p * 100) / 100; };   // RF03
const ocupado = (turnos, idEst, ini, fin, excluir) => turnos.some((t) => {            // RF02
  if (t.estado === "Cancelado" || t.estilista_id !== idEst || t.id === excluir) return false;
  const a = parse(...t.fecha_hora.split(" "));
  return ini < a + t.duracion && a < fin;
});
const aptos = (s, idEst) => ESTILISTAS.filter((e) => e.categorias.includes(s.categoria) && (!idEst || e.id === idEst));
function slots(turnos, cat, fecha, idServ, idEst = 0) {
  const s = servicio(cat, idServ), dia = parse(fecha);
  if (!s || dia === null || !DIAS_ABIERTO.includes(dow(dia))) return [];
  const now = ahora(), out = [];
  for (let m = APERTURA; m <= CIERRE - s.duracion; m += PASO) {
    const ini = dia + m, fin = ini + s.duracion;
    out.push({ hora: fmt(ini).slice(11), libre: ini > now && aptos(s, idEst).some((e) => !ocupado(turnos, e.id, ini, fin)), precio: precio(s, ini) });
  }
  return out;
}
function primerTurno(turnos, cat, idServ, idEst = 0) {
  const hoy = Math.floor(ahora() / 1440) * 1440;
  for (let i = 0; i < 30; i++) {
    const f = fmt(hoy + i * 1440).slice(0, 10), l = slots(turnos, cat, f, idServ, idEst).find((x) => x.libre);
    if (l) return { fecha: f, hora: l.hora };
  }
  return null;
}
const digitos = (v) => String(v ?? "").replace(/\D/g, "");

/* ---------- WhatsApp ---------- */
const mensaje = (t) => `💈 Nueva solicitud de turno #${t.id}\nCliente: ${t.cliente} (${t.telefono})\nServicio: ${t.servicio}\nFecha: ${t.fecha_hora} hs\nEstilista: ${t.estilista}\nTotal: $${Math.round(t.precio_total).toLocaleString("es-AR")} · ${t.forma_pago}`;
const linkWa = (cfg, t) => cfg.whatsapp ? `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(mensaje(t))}` : "";
async function avisar(cfg, t) {
  if (!cfg.whatsapp || !cfg.callmebot_key) return false;
  try { await fetch(`https://api.callmebot.com/whatsapp.php?phone=${cfg.whatsapp}&text=${encodeURIComponent(mensaje(t))}&apikey=${encodeURIComponent(cfg.callmebot_key)}`, { signal: AbortSignal.timeout(8000) }); }
  catch (e) { console.error("No se pudo enviar el WhatsApp automático:", e.message); }
  return true;
}

/* ---------- sesión de administrador (token firmado, sin estado en el servidor) ---------- */
const firmar = (e) => createHmac("sha256", SECRET).update(String(e)).digest("hex");
const nuevoToken = () => { const e = Date.now() + 12 * 36e5; return `${e}.${firmar(e)}`; };
const tokenOk = (t) => {
  const [e, s] = String(t || "").split(".");
  if (!e || !s || +e < Date.now()) return false;
  const a = Buffer.from(firmar(e)), b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
};
const hash = (v) => createHash("sha256").update(String(v)).digest();

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const err = (mensaje, status = 400) => json({ exito: false, mensaje }, status);
const NOAUTH = () => err("Acceso no autorizado.", 401);

export default async (req) => {
  const url = new URL(req.url), path = url.pathname.replace(/\/+$/, ""), q = Object.fromEntries(url.searchParams);
  const admin = tokenOk(req.headers.get("x-admin-token"));
  const num = (k) => (/^\d+$/.test(q[k] || "") ? +q[k] : 0);
  try {
    if (req.method === "GET") {
      const im = /^\/api\/img\/([a-f0-9]{32})$/.exec(path);
      if (im) {
        const r = await db().getWithMetadata("img:" + im[1], { type: "arrayBuffer" });
        if (!r) return err("No encontrado.", 404);
        return new Response(r.data, { headers: { "Content-Type": r.metadata?.tipo || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
      }
      const cfg = await leer("config", { whatsapp: "", callmebot_key: "" });
      if (path === "/api/config") { const cat = await catalogo(); return json({ servicios: cat.servicios, productos: cat.productos, categorias: CATEGORIAS, estilistas: ESTILISTAS, formas_pago: FORMAS_PAGO, whatsapp: cfg.whatsapp }); }
      if (path === "/api/disponibilidad") return json(slots(await leer("turnos", []), await catalogo(), q.fecha, num("servicio"), num("estilista")));
      if (path === "/api/primer_turno") return json(primerTurno(await leer("turnos", []), await catalogo(), num("servicio"), num("estilista")));
      if (path === "/api/mis_turnos") { const tel = digitos(q.telefono); return json(tel ? (await leer("turnos", [])).filter((t) => t.telefono === tel) : []); }
      if (path === "/api/admin_config") return admin ? json({ whatsapp: cfg.whatsapp, clave: !!cfg.callmebot_key }) : NOAUTH();
      if (path === "/api/turnos") return admin ? json(await leer("turnos", [])) : NOAUTH();
      if (path === "/api/exportar") {
        if (!admin) return NOAUTH();
        const c = (v) => { v = String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
        const filas = [["ID", "Cliente", "Telefono", "Servicio", "Estilista", "Fecha/Hora", "Precio Total", "Forma de Pago", "Pago Confirmado", "Estado"]]
          .concat((await leer("turnos", [])).map((t) => [t.id, t.cliente, t.telefono, t.servicio, t.estilista, t.fecha_hora, t.precio_total, t.forma_pago, t.pago_confirmado ? "Sí" : "No", t.estado]));
        return new Response("\ufeff" + filas.map((f) => f.map(c).join(",")).join("\r\n") + "\r\n", { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="agenda_turnos.csv"', "Cache-Control": "no-store" } });
      }
      return err("No encontrado.", 404);
    }
    if (req.method !== "POST") return err("Método no permitido.", 405);
    const d = await req.json().catch(() => null);
    if (!d || typeof d !== "object") return err("JSON inválido.");
    const id = parseInt(d.id) || 0;

    if (path === "/api/admin_login") {
      if (timingSafeEqual(hash(d.pin ?? ""), hash(ADMIN_PIN))) return json({ exito: true, token: nuevoToken() });
      return err("PIN incorrecto.", 401);
    }
    if (path === "/api/agendar") {
      const nombre = String(d.nombre ?? "").trim(), tel = digitos(d.telefono), s = servicio(await catalogo(), parseInt(d.servicio) || 0), idEst = parseInt(d.estilista) || 0;
      if (!nombre || tel.length < 6) return err("Ingresá un nombre y un teléfono válidos.");
      if (!s) return err("Servicio no válido.");
      if (!FORMAS_PAGO.includes(d.forma_pago)) return err("Seleccioná una forma de pago válida.");
      const ini = parse(d.fecha, d.hora);
      if (ini === null) return err("Fecha u hora inválidas.");
      const minDia = Math.floor((ini % 1440)), fin = ini + s.duracion;
      if (!DIAS_ABIERTO.includes(dow(ini)) || minDia < APERTURA || minDia + s.duracion > CIERRE) return err("Ese horario está fuera del horario de atención.");
      if (ini <= ahora()) return err("No se puede reservar en el pasado.");
      const turnos = await leer("turnos", []);
      const libre = aptos(s, idEst).find((e) => !ocupado(turnos, e.id, ini, fin));
      if (!libre) return err("El horario seleccionado ya se encuentra ocupado.");
      const t = { id: Math.max(0, ...turnos.map((x) => x.id)) + 1, cliente: nombre, telefono: tel, servicio: s.nombre, servicio_id: s.id, estilista_id: libre.id, estilista: libre.nombre, duracion: s.duracion, fecha_hora: fmt(ini), precio_total: precio(s, ini), forma_pago: d.forma_pago, pago_confirmado: false, estado: "Pendiente" };
      turnos.push(t);
      await guardar("turnos", turnos);
      const cfg = await leer("config", { whatsapp: "", callmebot_key: "" });
      return json({ exito: true, datos: t, mensaje: "Ok", wa_url: linkWa(cfg, t), wa_auto: await avisar(cfg, t) });
    }
    if (path === "/api/cancelar") {   // el cliente cancela su propio turno pendiente
      const turnos = await leer("turnos", []), t = turnos.find((x) => x.id === id && x.telefono === digitos(d.telefono));
      if (!t) return err("Turno no encontrado.");
      if (t.estado !== "Pendiente") return err("Solo se pueden cancelar turnos pendientes.");
      t.estado = "Cancelado"; await guardar("turnos", turnos);
      return json({ exito: true, mensaje: `Turno #${id} marcado como Cancelado.` });
    }
    if (!admin) return NOAUTH();
    if (path === "/api/admin_config") {
      const cfg = await leer("config", { whatsapp: "", callmebot_key: "" });
      cfg.whatsapp = digitos(d.whatsapp);
      if (d.clave) cfg.callmebot_key = String(d.clave).trim();
      await guardar("config", cfg);
      return json({ exito: true, mensaje: "Configuración guardada." });
    }
    if (path === "/api/subir_imagen") {   // recibe una imagen (data URL) y devuelve una URL propia /api/img/<id>
      const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(d.imagen ?? ""));
      if (!m) return err("Imagen no válida (usá JPG, PNG o WebP).");
      const buf = Buffer.from(m[2], "base64");
      if (!buf.length || buf.length > 2 * 1024 * 1024) return err("La imagen supera los 2 MB.");
      const k = randomUUID().replace(/-/g, "");
      await db().set("img:" + k, buf, { metadata: { tipo: m[1] } });
      return json({ exito: true, url: "/api/img/" + k });
    }
    if (path === "/api/servicio_guardar" || path === "/api/producto_guardar") {
      const esServ = path === "/api/servicio_guardar", cat = await catalogo(), lista = esServ ? cat.servicios : cat.productos;
      const nombre = texto(d.nombre, 80), descripcion = texto(d.descripcion, 300), precioN = monto(d.precio), imagen = String(d.imagen ?? "").trim();
      if (!nombre) return err("Ingresá un nombre.");
      if (precioN === null) return err("Ingresá un precio válido (mayor a 0).");
      if (imagen && !IMG_OK.test(imagen)) return err("Foto no válida.");
      let item = id ? lista.find((x) => x.id === id) : null;
      if (id && !item) return err("No encontrado.", 404);
      const antes = item?.imagen || "";
      const nuevo = { id: item?.id ?? sigId(lista), nombre, descripcion, precio: precioN, imagen };
      if (esServ) {
        const categoria = texto(d.categoria, 40), duracion = parseInt(d.duracion);
        if (!CATEGORIAS.includes(categoria)) return err("Elegí una categoría válida.");
        if (!(duracion >= 15 && duracion <= 480)) return err("La duración debe estar entre 15 y 480 minutos.");
        Object.assign(nuevo, { categoria, duracion, etiqueta: texto(d.etiqueta, 20) || categoria });
      }
      if (item) Object.assign(item, nuevo); else lista.push(nuevo);
      await guardar("catalogo", cat);
      if (antes && antes !== imagen) await borrarImg(antes);
      return json({ exito: true, mensaje: item ? "Cambios guardados." : esServ ? "Estilo agregado." : "Producto agregado.", item: nuevo });
    }
    if (path === "/api/servicio_eliminar" || path === "/api/producto_eliminar") {
      const esServ = path === "/api/servicio_eliminar", cat = await catalogo(), clave = esServ ? "servicios" : "productos";
      const item = cat[clave].find((x) => x.id === id);
      if (!item) return err("No encontrado.", 404);
      if (esServ && cat.servicios.length <= 1) return err("Tiene que quedar al menos un estilo.");
      cat[clave] = cat[clave].filter((x) => x.id !== id);
      await guardar("catalogo", cat);
      await borrarImg(item.imagen);
      return json({ exito: true, mensaje: esServ ? "Estilo eliminado." : "Producto eliminado." });
    }
    if (path === "/api/cambiar_estado" || path === "/api/confirmar_pago") {
      const turnos = await leer("turnos", []), t = turnos.find((x) => x.id === id);
      if (!t) return err("Turno no encontrado.");
      let mensaje;
      if (path === "/api/cambiar_estado") {
        if (!["Pendiente", "Realizado", "Cancelado"].includes(d.estado)) return err("Estado no válido.");
        t.estado = d.estado; mensaje = `Turno #${id} marcado como ${d.estado}.`;
      } else {
        if (t.estado === "Cancelado") return err("No se puede confirmar el pago de un turno cancelado.");
        t.pago_confirmado = true; mensaje = `Pago del turno #${id} confirmado (${t.forma_pago}).`;
      }
      await guardar("turnos", turnos);
      return json({ exito: true, mensaje });
    }
    return err("No encontrado.", 404);
  } catch (e) {
    console.error(e);
    return err("Error interno del servidor.", 500);
  }
};

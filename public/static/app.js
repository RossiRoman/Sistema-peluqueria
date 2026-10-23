/* Estilo Único — app única (cliente + administrador). JS nativo + fetch() contra server.py */
const HERO = "https://lh3.googleusercontent.com/aida-public/AB6AXuCCdP6JXpJ8Oh6aHbsvQ5hplEXpahthn14vVvfyjJpAK4C9RLqwhuyGi1fslBMlgyeDGI6yWf2QPISqAPtLjzMxssiekb9gpWFsBmeXHpYI9_WT3fP1djrasmuS_FD0Uhmyk0R5LEa-1WspK06tHcTb0Hsfvy7Vl4mDTBAaxiyypeVCt_UucFRFpu3_SL14becKsBb4Dcxse_kyMafZjFkZrdxTT6U8YTU4LkCKB9mCmv0FzLMEgEY";
const I = {
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  leaf: '<path d="M12 21c-5 0-8-3-8-8 5 0 8 2 8 8zm0 0c0-6 3-8 8-8 0 5-3 8-8 8zM12 13c-2-2-2-6 0-9 2 3 2 7 0 9z"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  down: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  home: '<path d="M4 11 12 4l8 7v9H4z"/>'
};
const ic = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => "$" + Math.round(n).toLocaleString("es-AR");
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const img = (u, alt, cls = "") => u ? `<img class="${cls}" src="${esc(u)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : `<div class="ph ${cls}"></div>`;

const newB = (o = {}) => ({ paso: 1, serv: null, est: 0, fecha: null, hora: null, pago: "", slots: null, rapido: false, ok: null, ...o });
const S = {
  cfg: null, view: "inicio", cat: "Todos", b: newB(), mis: null,
  p: JSON.parse(localStorage.getItem("perfil") || "{}"),
  adm: { tok: sessionStorage.getItem("tok") || "", list: [], f: { q: "", e: "", d: "" }, err: "", tab: "agenda", form: null }
};
const cats = () => ["Todos", ...new Set(S.cfg.servicios.map((s) => s.categoria))];
const serv = (id) => S.cfg.servicios.find((s) => s.id == id);
const est = (id) => S.cfg.estilistas.find((e) => e.id == id);
const post = (u, b) => fetch(u, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Token": S.adm.tok }, body: JSON.stringify(b) }).then((r) => r.json());
const get = (u) => fetch(u, { headers: { "X-Admin-Token": S.adm.tok } }).then((r) => r.json());
let tt;
const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3200); };
const fechaTxt = (fh) => {
  const [d, h] = fh.split(" "), hoy = new Date(), man = new Date(); man.setDate(hoy.getDate() + 1);
  const dia = d === iso(hoy) ? "Hoy" : d === iso(man) ? "Mañana" : new Date(d + "T00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  return `${dia} ${h} hs`;
};
const nowStr = () => { const n = new Date(); return `${iso(n)} ${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`; };
const guardarPerfil = (p) => { S.p = { ...S.p, ...p }; localStorage.setItem("perfil", JSON.stringify(S.p)); };
const cargarMis = async () => { S.mis = S.p.telefono ? await get("/api/mis_turnos?telefono=" + encodeURIComponent(S.p.telefono)) : []; };

/* ------------------------------ componentes ------------------------------ */
const servCard = (s, sel) => `<article class="card sv ${sel ? "sel" : ""}"><div class="sv-t"><div class="meta"><span class="tag">${esc(s.etiqueta)}</span><span class="dur">${ic("clock", 14)}${s.duracion} min</span></div><h4>${esc(s.nombre)}</h4><p>${esc(s.descripcion)}</p><b class="price">${money(s.precio)}</b></div><div class="sv-i">${img(s.imagen, s.nombre)}<button class="btn-s" data-a="pick" data-id="${s.id}">${ic("plus", 16)}Elegir</button></div></article>`;
const prodCard = (p) => `<div class="card es pr"><div class="es-p">${img(p.imagen, p.nombre)}</div><h4>${esc(p.nombre)}</h4><span class="sub pr-d">${esc(p.descripcion)}</span><b class="price">${money(p.precio)}</b>${S.cfg.whatsapp ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${S.cfg.whatsapp}?text=${encodeURIComponent("Hola! Me interesa el producto: " + p.nombre + " (" + money(p.precio) + ")")}">Consultar</a>` : ""}</div>`;
const chips = () => `<div class="chips">${cats().map((c) => `<button class="chip ${S.cat === c ? "on" : ""}" data-a="cat" data-c="${c}">${c}</button>`).join("")}</div>`;
const listaServ = (max) => { if (!cats().includes(S.cat)) S.cat = "Todos"; const l = S.cfg.servicios.filter((s) => S.cat === "Todos" || s.categoria === S.cat); return l.slice(0, max || 99); };

/* -------------------------------- vistas --------------------------------- */
const V = {};
V.inicio = () => {
  const nombre = (S.p.nombre || "").split(" ")[0];
  const pr = (S.mis || []).filter((t) => t.estado === "Pendiente" && t.fecha_hora >= nowStr()).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))[0];
  const prox = pr ? `<section class="next"><div class="next-h"><span class="lbl"><i></i>Tu próximo turno</span><span class="when">${fechaTxt(pr.fecha_hora)}</span></div>
    <div class="next-b">${img(est(pr.estilista_id)?.foto, pr.estilista)}<div style="min-width:0"><h3>${esc(pr.servicio)}</h3><p>con ${esc(pr.estilista)}</p><p class="sub" style="display:flex;gap:4px;align-items:center;margin-top:2px">${ic("clock", 14)}${pr.duracion} min · ${money(pr.precio_total)}</p></div></div>
    <div class="next-f"><button class="btn" data-a="go" data-v="turnos">Ver detalle ${ic("chev", 18)}</button></div></section>`
    : `<section class="next"><div class="lbl"><i></i>Tu próximo turno</div><div class="empty" style="padding:12px 0 0">Todavía no tenés turnos agendados.</div></section>`;
  return `<section class="hero-s">
  <div class="hero">${img(HERO, "Atelier")}<div class="hero-in"><div class="hero-top"><span class="pill"><i></i>Atelier Recoleta</span></div>
  <div><p>${nombre ? "Bienvenido/a de nuevo" : "Bienvenido/a"}</p><h2>${nombre ? "Hola, " + esc(nombre) : "Estilo Único"}</h2><p>Tu espacio de estilismo exclusivo</p></div></div></div>
  <div class="fast"><button class="btn a" data-a="nueva">${ic("cal")}<span style="flex:1;text-align:left;margin-left:4px">Reservar Turno Ahora</span><b>${S.hoyLibre ? "Hoy libre" : "Reservar"} ${ic("arrow", 18)}</b></button>
  <div class="quick"><button data-a="rapido">${ic("bolt")}Primer turno libre</button><button data-a="scroll" data-t="servicios">${ic("leaf")}Elegir Servicio</button></div></div></section>
  ${prox}
  <section class="sec" id="servicios"><div class="sec-h"><div><h2>Explorar Servicios</h2><p class="sub">Elegí y reservá en un solo paso</p></div><button class="link" data-a="nueva">Ver todos ${ic("arrow", 16)}</button></div>${chips()}<div class="list">${listaServ(3).map((s) => servCard(s)).join("")}</div></section>
  ${S.cfg.productos?.length ? `<section class="sec" id="productos"><div class="sec-h"><div><h2>Productos</h2><p class="sub">Cuidado capilar profesional para llevarte</p></div></div><div class="row">${S.cfg.productos.map(prodCard).join("")}</div></section>` : ""}
  <section class="sec" id="estilistas"><div class="sec-h"><div><h2>Nuestro equipo</h2><p class="sub">Te asignamos al profesional que esté libre en tu horario</p></div></div><div class="row">${S.cfg.estilistas.map((e) => `<div class="card es"><div class="es-p">${img(e.foto, e.nombre)}<span class="tag">${e.disp ? "Disponible hoy" : "Próximamente"}</span><span class="rt">${ic("star", 12)}${e.rating.toFixed(1)}</span></div><h4>${esc(e.nombre)}</h4><span class="sub">${esc(e.rol)}</span></div>`).join("")}</div></section>
  <section class="rev"><div class="stars">${ic("star", 18).repeat(5)}<b>4.9 / 5</b><span class="sub" style="margin-left:auto">+340 opiniones</span></div><blockquote>“La atención en Recoleta es un viaje de calma total. El balayage de Sofía superó mis expectativas: luminoso, natural y sano.”</blockquote><div class="rev-f"><span>Martina G. · Hace 2 días</span><b>Cliente verificada</b></div></section>
  <section class="hrs"><div><span class="circ">${ic("clock")}</span><span><strong>Horario de Atención</strong><span class="sub">Martes a Sábados: 09:30 – 20:00 hs</span></span></div><a class="call" href="tel:+541148000000" aria-label="Llamar">${ic("phone", 18)}</a></section>`;
};

V.reservar = () => {
  const b = S.b;
  if (b.ok) {
    const t = b.ok;
    return `<div class="ok"><div class="big">${ic("check", 36)}</div><h2>¡Reserva confirmada!</h2><p class="sub" style="margin-top:6px">Te esperamos en Atelier Recoleta.</p></div>
    <div class="card sum"><div><span>Servicio</span><strong>${esc(t.servicio)}</strong></div><div><span>Estilista</span><strong>${esc(t.estilista)}</strong></div><div><span>Fecha</span><strong>${fechaTxt(t.fecha_hora)}</strong></div><div><span>Pago</span><strong>${esc(t.forma_pago)}</strong></div><div class="tot"><span>Total</span><span>${money(t.precio_total)}</span></div></div>
    ${b.wa?.auto ? '<p class="note" style="text-align:center;margin-top:12px">Avisamos al salón por WhatsApp.</p>' : ""}${b.wa?.url ? `<a class="btn a" style="margin:16px 20px 0" href="${esc(b.wa.url)}" target="_blank" rel="noopener">Enviar solicitud por WhatsApp</a>` : ""}
    <button class="btn p" style="margin:16px 20px 0;width:calc(100% - 40px)" data-a="go" data-v="turnos">Ver mis turnos</button><button class="btn o" style="margin:10px 20px 0;width:calc(100% - 40px)" data-a="go" data-v="inicio">Volver al inicio</button>`;
  }
  const titulos = ["Elegí tu servicio", "Selecciona Fecha", "Confirmación"];
  const s = b.serv ? serv(b.serv) : null;
  let body = "", tray = "";
  if (b.paso === 1) {
    const l = S.cfg.servicios.filter((x) => S.cat === "Todos" || x.categoria === S.cat);
    body = `${chips()}<div class="list">${l.map((x) => servCard(x, x.id === b.serv)).join("") || '<p class="empty">Sin servicios en esta categoría.</p>'}</div>`;
  } else if (b.paso === 2) {
    const dias = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
    const slotsH = b.slots === null ? '<p class="note">Cargando horarios…</p>' : !b.slots.length ? '<p class="note">Cerrado ese día. Atendemos de martes a sábados.</p>'
      : `<div class="grid">${b.slots.map((x) => `<button class="sl ${b.hora === x.hora ? "on" : ""}" data-a="hora" data-h="${x.hora}" ${x.libre ? "" : "disabled"}>${x.hora}</button>`).join("")}</div>`;
    const sl = (b.slots || []).find((x) => x.hora === b.hora);
    body = `<div class="dates">${dias.map((d) => `<button class="dt ${iso(d) === b.fecha ? "on" : ""}" data-a="fecha" data-f="${iso(d)}" ${[0, 1].includes(d.getDay()) ? "disabled" : ""}>${d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")}<b>${d.getDate()}</b></button>`).join("")}</div>
    <div class="sec-h" style="margin-top:4px"><h2 style="font-size:18px">Horarios disponibles</h2></div>${slotsH}<p class="note">Sábados +20% · desde las 19:00 hs +$1.500.</p>`;
    tray = `<div><small>${sl ? "Total" : "Elegí un horario"}</small><strong>${sl ? money(sl.precio) : "—"}</strong></div><button class="btn p" data-a="next" ${sl ? "" : "disabled"}>Continuar</button>`;
  } else {
    const sl = (b.slots || []).find((x) => x.hora === b.hora), tot = sl ? sl.precio : s.precio;
    const sab = new Date(b.fecha + "T00:00").getDay() === 6, noc = parseInt(b.hora) >= 19;
    body = `<div class="card sum"><div><span>${esc(s.nombre)}</span><span>${money(s.precio)}</span></div>${sab ? `<div><span>Recargo sábado (20%)</span><span>${money(s.precio * 0.2)}</span></div>` : ""}${noc ? "<div><span>Franja nocturna</span><span>$1.500</span></div>" : ""}<div><span>Estilista a asignar</span><span>${fechaTxt(b.fecha + " " + b.hora)}</span></div><div class="tot"><span>Total</span><span>${money(tot)}</span></div></div>
    <div class="field"><label for="f-n">Nombre y apellido</label><input id="f-n" value="${esc(S.p.nombre || "")}" placeholder="Ej: Valentina Gómez" autocomplete="name"></div>
    <div class="field"><label for="f-t">Teléfono</label><input id="f-t" type="tel" value="${esc(S.p.telefono || "")}" placeholder="Ej: 3511234567" autocomplete="tel"></div>
    <div class="field"><label>Forma de pago</label></div><div class="chips" style="flex-wrap:wrap;overflow:visible">${S.cfg.formas_pago.map((f) => `<button class="chip ${b.pago === f ? "on" : ""}" data-a="pago" data-p="${esc(f)}">${esc(f)}</button>`).join("")}</div>`;
    tray = `<div><small>Total</small><strong>${money(tot)}</strong></div><button class="btn a" data-a="confirmar" ${b.pago ? "" : "disabled"}>Confirmar reserva</button>`;
  }
  return `<div class="steps">${[1, 2, 3].map((n) => `<i class="${n <= b.paso ? "on" : ""}"></i>`).join("")}</div>
  <div class="vh">${b.paso > 1 ? `<button class="ib" data-a="back" aria-label="Volver">${ic("back")}</button>` : ""}<h2>${titulos[b.paso - 1]}</h2></div>${body}${tray ? `<div class="tray">${tray}</div>` : ""}`;
};

V.turnos = () => {
  if (!S.p.telefono) return `<div class="field"><p class="sub" style="margin-bottom:8px">Ingresá tu teléfono para ver tus turnos.</p><label for="m-t">Teléfono</label><input id="m-t" type="tel" placeholder="Ej: 3511234567"><button class="btn p" style="margin-top:12px;width:100%" data-a="buscar">Ver mis turnos</button></div>`;
  if (S.mis === null) return '<p class="empty">Cargando…</p>';
  const tc = (t) => `<article class="card tc"><div class="tc-h"><h3>${esc(t.servicio)}</h3><span class="st ${esc(t.estado.toLowerCase())}">${esc(t.estado)}</span></div>
    <dl><dt>Estilista</dt><dd>${esc(t.estilista)}</dd><dt>Fecha</dt><dd>${fechaTxt(t.fecha_hora)}</dd><dt>Duración</dt><dd>${t.duracion} min</dd><dt>Total</dt><dd><strong>${money(t.precio_total)}</strong> · ${esc(t.forma_pago)}${t.pago_confirmado ? " ✔" : ""}</dd></dl>
    ${t.estado === "Pendiente" ? `<div class="tc-f"><button class="btn o sm" data-a="cancelar" data-id="${t.id}">Cancelar turno</button></div>` : ""}</article>`;
  const prox = S.mis.filter((t) => t.estado === "Pendiente").sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
  const hist = S.mis.filter((t) => t.estado !== "Pendiente").sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora));
  return `<h3 class="grp">Próximos</h3><div class="list">${prox.map(tc).join("") || `<div class="card empty">No tenés turnos pendientes.<br><button class="btn a" data-a="nueva">Reservar ahora</button></div>`}</div>${hist.length ? `<h3 class="grp">Historial</h3><div class="list">${hist.map(tc).join("")}</div>` : ""}`;
};

V.perfil = () => `<div class="vh"><h2>Tus datos</h2></div><p class="note" style="margin-bottom:4px">Se guardan en este dispositivo para reservar más rápido.</p>
  <div class="field"><label for="p-n">Nombre y apellido</label><input id="p-n" value="${esc(S.p.nombre || "")}"></div><div class="field"><label for="p-t">Teléfono</label><input id="p-t" type="tel" value="${esc(S.p.telefono || "")}"></div>
  <div class="field"><button class="btn p" style="width:100%" data-a="guardarPerfil">Guardar</button></div>
  <div class="field" style="margin-top:32px"><button class="btn o" style="width:100%" data-a="go" data-v="admin">${ic("lock", 18)}Acceso administrador</button></div>`;

/* --------------------------------- admin --------------------------------- */
const admTabs = () => `<div class="tabs" role="tablist">${[["agenda", "Agenda"], ["estilos", "Estilos"], ["productos", "Productos"]].map(([t, n]) => `<button role="tab" class="${S.adm.tab === t ? "on" : ""}" data-a="atab" data-t="${t}">${n}</button>`).join("")}</div>`;
V.admin = () => !S.adm.tok ? `<div class="card lg"><h2>Panel administrador</h2><p class="sub" style="margin-top:6px">Ingresá el PIN para gestionar la agenda.</p><input id="pin" type="password" inputmode="numeric" maxlength="12" autocomplete="off" aria-label="PIN"><p class="err">${esc(S.adm.err)}</p><button class="btn p" style="width:100%" data-a="login">Ingresar</button><button class="link" style="margin-top:14px" data-a="go" data-v="inicio">Volver a la app</button></div>`
  : `<div class="vh"><h2>${{ agenda: "Agenda general", estilos: "Estilos", productos: "Productos" }[S.adm.tab]}</h2>${S.adm.tab === "agenda" ? `<button class="btn o sm" data-a="exportar">${ic("down", 16)}CSV</button>` : ""}<button class="btn o sm" data-a="logout">Salir</button></div>${admTabs()}${S.adm.tab === "agenda" ? V.admAgenda() : V.admCatalogo(S.adm.tab === "estilos" ? "servicio" : "producto")}`;

V.admAgenda = () => `<div class="kpis" id="akpi"></div>
  <div class="card cfg"><div><strong>Avisos por WhatsApp</strong><p class="sub">Número del administrador con código de país, sin + (ej: 5493511234567). Con la clave de CallMeBot (callmebot.com/blog/free-api-whatsapp-messages) el aviso se envía solo; sin clave, se ofrece un botón para enviarlo.</p></div><input id="wa-n" type="tel" placeholder="5493511234567" aria-label="WhatsApp del administrador"><input id="wa-k" type="password" placeholder="Clave CallMeBot (opcional)" aria-label="Clave CallMeBot" autocomplete="off"><button class="btn p sm" data-a="guardarWa">Guardar</button></div>
  <div class="filt"><input id="a-q" type="search" placeholder="Buscar cliente, servicio o teléfono…" value="${esc(S.adm.f.q)}"><select id="a-e"><option value="">Estado: todos</option>${["Pendiente", "Realizado", "Cancelado"].map((e) => `<option ${S.adm.f.e === e ? "selected" : ""}>${e}</option>`).join("")}</select><input id="a-d" type="date" value="${S.adm.f.d}"><button class="btn o sm" data-a="limpiar" style="min-height:44px">Limpiar</button></div><div class="list" id="alist"></div>`;

/* Catálogo: estilos (servicios reservables) y productos — alta, edición y baja con foto, descripción y precio */
const NOM = { servicio: ["estilo", "Nuevo estilo"], producto: ["producto", "Nuevo producto"] };
V.admCatalogo = (k) => {
  const es = k === "servicio", F = S.adm.form && S.adm.form.k === k ? S.adm.form : null, lista = es ? S.cfg.servicios : S.cfg.productos || [];
  const form = F ? `<div class="card frm"><h3>${F.id ? "Editar " + NOM[k][0] : NOM[k][1]}</h3>
    <div class="frm-img"><div id="fm-prev">${img(F.imagen, "Vista previa")}</div><div class="frm-b"><label class="btn o sm up" for="fm-file">${ic("plus", 16)}${F.imagen ? "Cambiar foto" : "Subir foto"}</label><input id="fm-file" type="file" accept="image/*" hidden>${F.imagen ? '<button class="btn o sm" data-a="quitarFoto">Quitar foto</button>' : ""}<span class="sub">JPG, PNG o WebP. Se ajusta sola a un tamaño liviano.</span></div></div>
    <label class="fl">Nombre<input id="fm-nombre" maxlength="80" value="${esc(F.nombre)}" placeholder="${es ? "Ej: Degradé + Perfilado" : "Ej: Shampoo Reparador 300 ml"}"></label>
    ${es ? `<div class="fl2"><label class="fl">Categoría<select id="fm-categoria">${S.cfg.categorias.map((c) => `<option ${F.categoria === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label><label class="fl">Duración (min)<input id="fm-duracion" type="number" min="15" max="480" step="15" inputmode="numeric" value="${esc(F.duracion)}"></label></div>` : ""}
    <div class="fl2"><label class="fl">Precio ($)<input id="fm-precio" type="number" min="1" step="any" inputmode="decimal" value="${esc(F.precio)}" placeholder="12500"></label>${es ? `<label class="fl">Etiqueta (opcional)<input id="fm-etiqueta" maxlength="20" value="${esc(F.etiqueta)}" placeholder="Ej: Nuevo"></label>` : ""}</div>
    <label class="fl">Descripción<textarea id="fm-desc" rows="3" maxlength="300" placeholder="Contale al cliente de qué se trata">${esc(F.descripcion)}</textarea></label>
    <div class="frm-a"><button class="btn a sm" data-a="itemGuardar">Guardar</button><button class="btn o sm" data-a="itemCancelar">Cancelar</button></div></div>` : "";
  const item = (x) => `<article class="card ai"><div class="ai-i">${img(x.imagen, x.nombre)}</div><div class="ai-t"><strong>${esc(x.nombre)}</strong><span class="sub">${es ? esc(x.categoria) + " · " + x.duracion + " min" : "Producto"}</span><p>${esc(x.descripcion)}</p></div><b class="price">${money(x.precio)}</b><div class="acc"><button class="btn o sm" data-a="itemEditar" data-k="${k}" data-id="${x.id}">Editar</button><button class="btn o sm" data-a="itemEliminar" data-k="${k}" data-id="${x.id}">Eliminar</button></div></article>`;
  return `<div class="ahead"><p class="sub">${es ? "Son los servicios que los clientes pueden reservar." : "Se muestran en el inicio de la app. Si cargás tu WhatsApp, aparece el botón “Consultar”."}</p>${F ? "" : `<button class="btn a sm" data-a="itemNuevo" data-k="${k}">${ic("plus", 16)}${NOM[k][1]}</button>`}</div>${form}<div class="list">${lista.map(item).join("") || `<p class="empty">Todavía no cargaste ${es ? "estilos" : "productos"}.</p>`}</div>`;
};

function adminDibujar() {
  const L = S.adm.list, f = S.adm.f, hoy = iso(new Date());
  const act = L.filter((t) => t.estado !== "Cancelado"), real = L.filter((t) => t.estado === "Realizado"), canc = L.filter((t) => t.estado === "Cancelado");
  const cerr = real.length + canc.length;
  const k = (t, v, s) => `<div class="card kpi"><span class="sub">${t}</span><b>${v}</b><span class="sub">${s}</span></div>`;
  $("#akpi").innerHTML = k("Turnos hoy", L.filter((t) => t.fecha_hora.startsWith(hoy)).length, `de ${L.length} en total`) + k("Ingresos estimados", money(act.reduce((s, t) => s + t.precio_total, 0)), `Cobrado: ${money(L.filter((t) => t.pago_confirmado && t.estado !== "Cancelado").reduce((s, t) => s + t.precio_total, 0))}`)
    + k("Pendientes", L.filter((t) => t.estado === "Pendiente").length, "por atender") + k("Asistencia", cerr ? Math.round((real.length / cerr) * 100) + "%" : "—", `${canc.length} cancelados`);
  const q = f.q.trim().toLowerCase();
  const v = L.filter((t) => (!f.e || t.estado === f.e) && (!f.d || t.fecha_hora.startsWith(f.d)) && (!q || `${t.cliente} ${t.servicio} ${t.telefono} ${t.estilista}`.toLowerCase().includes(q))).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
  $("#alist").innerHTML = v.map((t) => `<article class="card ar"><div class="ar-top"><div><strong>${esc(t.cliente)}</strong><span class="sub">#${String(t.id).padStart(4, "0")} · ${esc(t.telefono)}</span></div><span class="st ${esc(t.estado.toLowerCase())}">${esc(t.estado)}</span></div>
    <div><strong>${esc(t.servicio)}</strong><span class="sub">con ${esc(t.estilista)}</span></div><div><strong>${fechaTxt(t.fecha_hora)}</strong><span class="sub">${t.duracion} min</span></div>
    <div><strong>${money(t.precio_total)}</strong><span class="pg ${t.pago_confirmado ? "ok" : ""}">${esc(t.forma_pago)} · ${t.estado === "Cancelado" ? "—" : t.pago_confirmado ? "pagado" : "pago pendiente"}</span></div>
    <div class="acc">${t.estado === "Pendiente" ? `<button class="btn p sm" data-a="estado" data-id="${t.id}" data-e="Realizado">Atendido</button>` : ""}${t.estado !== "Cancelado" && !t.pago_confirmado ? `<button class="btn o sm" data-a="cobrar" data-id="${t.id}">Confirmar pago</button>` : ""}${t.estado === "Pendiente" ? `<button class="btn o sm" data-a="estado" data-id="${t.id}" data-e="Cancelado">Cancelar</button>` : ""}</div></article>`).join("") || `<p class="empty">${L.length ? "Ningún turno coincide con los filtros." : "No hay turnos registrados aún."}</p>`;
}
async function adminCargar() {
  const r = await get("/api/turnos");
  if (!Array.isArray(r)) { S.adm.tok = ""; sessionStorage.removeItem("tok"); S.adm.err = "La sesión expiró."; return render(); }
  S.adm.list = r; adminDibujar();
  const c = await get("/api/admin_config");
  if ($("#wa-n")) { $("#wa-n").value = c.whatsapp || ""; $("#wa-k").placeholder = c.clave ? "Clave guardada (dejar vacío para mantener)" : "Clave CallMeBot (opcional)"; }
}

/* ------------------------------ render / nav ------------------------------ */
const NAV = [["inicio", "home", "Inicio"], ["reservar", "cal", "Reservar"], ["turnos", "clock", "Mis Turnos"], ["perfil", "user", "Perfil"]];
const TIT = { inicio: "Inicio", reservar: "Reservar cita", turnos: "Mis Turnos", perfil: "Perfil", admin: "Administración" };
function render() {
  document.body.classList.toggle("wide", S.view === "admin" && !!S.adm.tok);
  $("#loc").innerHTML = `${ic("pin", 16)}Estilo Único · Recoleta`;
  $("#titulo").textContent = TIT[S.view];
  $("#topr").innerHTML = `<button class="ib" aria-label="Notificaciones" data-a="notif">${ic("bell", 22)}<span class="dot"></span></button><button class="av" data-a="go" data-v="perfil" aria-label="Perfil">${esc((S.p.nombre || "?")[0].toUpperCase())}</button>`;
  $("#nav").innerHTML = NAV.map(([v, i, t]) => `<button class="${S.view === v ? "on" : ""}" data-a="go" data-v="${v}" ${S.view === v ? 'aria-current="page"' : ""}>${ic(i, 22)}${t}</button>`).join("");
  $("#vista").className = ["inicio", "admin"].includes(S.view) ? "" : "narrow";
  $("#vista").innerHTML = V[S.view]();
  if (S.view === "admin" && S.adm.tok && S.adm.tab === "agenda") adminCargar();
  if (S.view === "turnos" && S.p.telefono && S.mis === null) cargarMis().then(() => S.view === "turnos" && render());
  if (S.view === "reservar" && S.b.paso === 2 && S.b.slots === null) cargarSlots();
}
function go(v) { S.view = v; if (v === "reservar" && S.b.ok) S.b = newB(); if (v === "turnos") S.mis = null; render(); scrollTo(0, 0); }
async function cargarSlots() {
  const b = S.b;
  if (!b.fecha) { const d = new Date(); while ([0, 1].includes(d.getDay())) d.setDate(d.getDate() + 1); b.fecha = iso(d); render(); return; }
  const f = b.fecha;
  const r = await get(`/api/disponibilidad?fecha=${f}&servicio=${b.serv}&estilista=${b.est}`);
  if (S.b === b && b.fecha === f) { b.slots = r; if (b.hora && !r.find((x) => x.hora === b.hora && x.libre)) b.hora = null; render(); }
}
async function cargarHoy() {   // para "Hoy libre" y "Disponible hoy" en el inicio
  const hoy = iso(new Date());
  S.hoyLibre = false;
  for (const e of S.cfg.estilistas) {
    const s = S.cfg.servicios.find((x) => e.categorias.includes(x.categoria));
    if (!s) { e.disp = false; continue; }
    const r = await get(`/api/disponibilidad?fecha=${hoy}&servicio=${s.id}&estilista=${e.id}`);
    e.disp = r.some((x) => x.libre); S.hoyLibre ||= e.disp;
  }
}

/* --------------------------------- acciones -------------------------------- */
const A = {
  go: (el) => go(el.dataset.v),
  nueva: () => { S.b = newB(); S.cat = "Todos"; go("reservar"); },
  scroll: (el) => document.getElementById(el.dataset.t).scrollIntoView({ behavior: "smooth", block: "start" }),
  notif: () => toast("No tenés notificaciones nuevas."),
  cat: (el) => { S.cat = el.dataset.c; render(); },
  pick: (el) => {
    const id = +el.dataset.id;
    if (S.view === "inicio") { S.b = newB({ serv: id }); S.view = "reservar"; }
    else S.b.serv = id;
    const b = S.b; b.slots = null; b.hora = null; b.fecha = null;
    b.est = 0; b.paso = 2;
    if (b.rapido) return A.primero();
    render(); scrollTo(0, 0);
  },
  rapido: () => { S.b = newB({ rapido: true }); S.cat = "Todos"; go("reservar"); toast("Elegí un servicio y te damos el primer horario libre."); },
  primero: async () => {
    const b = S.b, r = await get(`/api/primer_turno?servicio=${b.serv}&estilista=0`);
    if (r) { b.fecha = r.fecha; b.hora = r.hora; } else toast("No hay horarios libres próximos.");
    b.slots = null; render();
  },
  fecha: (el) => { S.b.fecha = el.dataset.f; S.b.hora = null; S.b.slots = null; render(); },
  hora: (el) => { S.b.hora = el.dataset.h; render(); },
  pago: (el) => { S.b.pago = el.dataset.p; keepForm(); render(); },
  next: () => { S.b.paso = 3; render(); scrollTo(0, 0); },
  back: () => { const b = S.b; b.paso--; if (b.paso === 1) b.rapido = false; render(); },
  confirmar: async () => {
    const b = S.b, n = $("#f-n").value.trim(), t = $("#f-t").value.trim();
    const r = await post("/api/agendar", { nombre: n, telefono: t, servicio: b.serv, estilista: b.est, fecha: b.fecha, hora: b.hora, forma_pago: b.pago });
    if (!r.exito) { toast("⚠️ " + r.mensaje); if (/ocupado/.test(r.mensaje)) { b.paso = 3; b.slots = null; render(); } return; }
    guardarPerfil({ nombre: n, telefono: r.datos.telefono }); b.ok = r.datos; b.wa = { url: r.wa_url, auto: r.wa_auto }; S.mis = null; render(); scrollTo(0, 0);
  },
  buscar: async () => { guardarPerfil({ telefono: $("#m-t").value.trim() }); S.mis = null; render(); },
  guardarPerfil: () => { guardarPerfil({ nombre: $("#p-n").value.trim(), telefono: $("#p-t").value.trim() }); S.mis = null; toast("Datos guardados."); render(); },
  cancelar: async (el) => {
    if (!confirm("¿Cancelar este turno?")) return;
    const r = await post("/api/cancelar", { id: +el.dataset.id, telefono: S.p.telefono });
    toast(r.exito ? "Turno cancelado." : "⚠️ " + r.mensaje); S.mis = null; render();
  },
  login: async () => {
    const r = await post("/api/admin_login", { pin: $("#pin").value });
    if (r.exito) { S.adm.tok = r.token; sessionStorage.setItem("tok", r.token); S.adm.err = ""; } else S.adm.err = r.mensaje;
    render();
  },
  logout: () => { S.adm.tok = ""; sessionStorage.removeItem("tok"); render(); },
  estado: async (el) => { const r = await post("/api/cambiar_estado", { id: +el.dataset.id, estado: el.dataset.e }); if (!r.exito) toast("⚠️ " + r.mensaje); adminCargar(); },
  cobrar: async (el) => { const r = await post("/api/confirmar_pago", { id: +el.dataset.id }); if (!r.exito) toast("⚠️ " + r.mensaje); adminCargar(); },
  guardarWa: async () => {
    const r = await post("/api/admin_config", { whatsapp: $("#wa-n").value, clave: $("#wa-k").value });
    toast(r.exito ? "✅ " + r.mensaje : "⚠️ " + r.mensaje); if (r.exito) { $("#wa-k").value = ""; S.cfg.whatsapp = $("#wa-n").value.replace(/\D/g, ""); }
  },
  atab: (el) => { S.adm.tab = el.dataset.t; S.adm.form = null; render(); },
  itemNuevo: (el) => { S.adm.form = { k: el.dataset.k, id: 0, nombre: "", categoria: S.cfg.categorias[0], duracion: 45, precio: "", etiqueta: "", descripcion: "", imagen: "" }; render(); $("#fm-nombre")?.focus(); },
  itemEditar: (el) => {
    const k = el.dataset.k, x = (k === "servicio" ? S.cfg.servicios : S.cfg.productos).find((y) => y.id == el.dataset.id);
    S.adm.form = { k, id: x.id, nombre: x.nombre, categoria: x.categoria, duracion: x.duracion, precio: x.precio, etiqueta: x.etiqueta === x.categoria ? "" : x.etiqueta || "", descripcion: x.descripcion || "", imagen: x.imagen || "" };
    render(); scrollTo(0, 0);
  },
  itemCancelar: () => { S.adm.form = null; render(); },
  quitarFoto: () => { leerForm(); S.adm.form.imagen = ""; render(); },
  itemGuardar: async () => {
    const F = leerForm(), es = F.k === "servicio";
    const r = await post(es ? "/api/servicio_guardar" : "/api/producto_guardar", { id: F.id, nombre: F.nombre, categoria: F.categoria, duracion: F.duracion, precio: F.precio, etiqueta: F.etiqueta, descripcion: F.descripcion, imagen: F.imagen });
    if (!r.exito) return toast("⚠️ " + r.mensaje);
    S.adm.form = null; await recargarCfg(); toast("✅ " + r.mensaje); render();
  },
  itemEliminar: async (el) => {
    const es = el.dataset.k === "servicio";
    if (!confirm(es ? "¿Eliminar este estilo? Los turnos ya reservados se conservan." : "¿Eliminar este producto?")) return;
    const r = await post(es ? "/api/servicio_eliminar" : "/api/producto_eliminar", { id: +el.dataset.id });
    if (!r.exito) return toast("⚠️ " + r.mensaje);
    await recargarCfg(); toast("✅ " + r.mensaje); render();
  },
  limpiar: () => { S.adm.f = { q: "", e: "", d: "" }; render(); },
  exportar: async () => {
    const r = await fetch("/api/exportar", { headers: { "X-Admin-Token": S.adm.tok } });
    if (!r.ok) return toast("⚠️ No se pudo exportar.");
    const a = document.createElement("a"); a.href = URL.createObjectURL(await r.blob()); a.download = "agenda_turnos.csv"; a.click();
  }
};
const recargarCfg = async () => { const c = await fetch("/api/config").then((r) => r.json()); c.estilistas.forEach((e) => { e.disp = S.cfg.estilistas.find((x) => x.id === e.id)?.disp; }); S.cfg = c; };
function leerForm() {   // pasa lo tipeado en el formulario al estado, para no perderlo al redibujar
  const F = S.adm.form, v = (id) => $("#" + id)?.value ?? "";
  Object.assign(F, { nombre: v("fm-nombre"), precio: v("fm-precio"), descripcion: v("fm-desc") });
  if (F.k === "servicio") Object.assign(F, { categoria: v("fm-categoria"), duracion: v("fm-duracion"), etiqueta: v("fm-etiqueta") });
  return F;
}
async function subirFoto(file) {
  const F = S.adm.form;
  try {
    toast("Subiendo foto…");
    const bmp = await createImageBitmap(file), k = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(bmp, 0, 0, c.width, c.height);
    const r = await post("/api/subir_imagen", { imagen: c.toDataURL("image/jpeg", 0.82) });
    if (!r.exito) return toast("⚠️ " + r.mensaje);
    leerForm(); F.imagen = r.url; render(); toast("✅ Foto cargada.");
  } catch { toast("⚠️ No se pudo leer esa imagen. Probá con un JPG o PNG."); }
}
document.addEventListener("change", (e) => { if (e.target.id === "fm-file" && e.target.files[0] && S.adm.form) subirFoto(e.target.files[0]); });
function keepForm() { const n = $("#f-n"), t = $("#f-t"); if (n) guardarPerfil({ nombre: n.value, telefono: t.value }); }
document.addEventListener("click", (e) => { const el = e.target.closest("[data-a]"); if (el && A[el.dataset.a]) A[el.dataset.a](el); });
document.addEventListener("input", (e) => {
  const m = { "a-q": "q", "a-e": "e", "a-d": "d" }[e.target.id];
  if (m) { S.adm.f[m] = e.target.value; adminDibujar(); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "pin") A.login(); });
addEventListener("hashchange", () => { if (location.hash === "#admin") go("admin"); });

(async function init() {
  S.cfg = await fetch("/api/config").then((r) => r.json());
  S.view = location.hash === "#admin" ? "admin" : "inicio";
  render();
  if (S.p.telefono) { await cargarMis(); }
  await cargarHoy();
  if (S.view === "inicio") render();
})();

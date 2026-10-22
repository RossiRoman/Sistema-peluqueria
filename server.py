import csv, json, os, secrets, threading
from datetime import datetime, timedelta
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from io import StringIO
import urllib.request
from urllib.parse import urlparse, parse_qs, quote

BASE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(BASE, "public")   # sitio estático (el mismo que se publica en Netlify)
DB = os.path.join(BASE, "turnos.json")
CFG = os.path.join(BASE, "config.json")
ADMIN_PIN = os.environ.get("ADMIN_PIN", "1234")   # PIN del panel administrador
FORMAS_PAGO = ["Efectivo", "Transferencia"]
APERTURA, CIERRE, PASO = 9 * 60 + 30, 20 * 60, 30   # Martes a Sábados 09:30-20:00, turnos cada 30 min
DIAS_ABIERTO = {1, 2, 3, 4, 5}                       # weekday(): lunes=0 ... domingo=6
U = "https://lh3.googleusercontent.com/aida-public/"
IMG = {
    "corte": U + "AB6AXuBSt3JyxJqf5D-BOuwJNfZVNY83HhmFE3nV6d1sFff7zRV3xnYubCjd9qO_tpSokPiuWnEehUfIXKiJiiAeIrZy0yrMt29sPqYD5lwmCFzgUB5ALk2xd7BHAbg53Z50AfwjFHXpWtyGzoCva5-iUnAiBxjJtX86kAiab85Cnp1_wtKyqLes4xM6UDkr56hMv9OHkagtG45XdgKoTIQJWD-bZ_jwbCzRNLskM3W14W9fxxTAdBC0RkA",
    "balayage": U + "AB6AXuCrGzDefQUCp1ZIPihR72EmmvGop5-0lXe8FJVQuHnfkSLKNOW1yVT79h05y6DSuPQnd0D-YuJhSDERvvkVx9kiN1ClwEQoE9vuf2A41Ju6kzlM-DMkLRGE0-KCotyPA-yigSZWSSVMoWsCuIG65n16zbHTfpIIV6lPas9CEeRH_sHv6wEkrDRtL3FygMYUB02lVEBp5uB75lwQsB5011CruFFu85lvnF1ZCn-QgP9RhTlDcT-cCl8",
    "olaplex": U + "AB6AXuAcICwyIHx3JnJmUZrIK_Hb_aM2YpjXD1govwIIY5xl6x8QAsTslVmRBk1PorbST35Kxnq2ho1rflzZoHq0WWmYEPV1LXfetKpdsZoiAY-Ey_7Sf5_gGXjzZv61iSVIRfQc421joaYN1j2EK7wmDGIz8QLInIzB5S65jWXzOPknDblQ5mRSoGpMVFQLleSv8c3jr5IIEbAbBND1fBdDFM1mtDxOI2hDJTILLgAlYKA1bmsPPNR4rLY",
    "sofia": U + "AB6AXuCRJFi1oeld3surCaUrsTrXMgPQ0JKFFi_XCi96bjuCUcLOvc6oWepa8n8yAUYnVkbaGL2fwmv5o5HbeA1fBh1S2OEQMYc5jxacEZXsCjQPPK-vYx4ST7pBSP2_U6s6dC-tm0NteF2LsPglkppwuw0vEf0HqyywlXE9cmtWey9T-F0sxQHEaOzM9HuncPYeAi3fqVqPl25PNJgTps6WbzG85c6jfDyi9mvDjLUe7yhG8FLnir20R08",
    "julian": U + "AB6AXuAsivbPpzUn_GJVh7L-adthcWBGJCq95C-v4MDfQRbX5vGujw21efXAgeWpgFVlmFJUtXwVebCjtRnhgniOg6Q9hEH5vgPNuQmAn0P0toleaKl8JTOxLqMQdTCxvUMFbjcIbj6LkVriHnEvsQhe367sWW7mon8khLGlVjtLMtdnfFO9VIbrYKp2HYamy_-4MHfZTVKdQ_rphntCFkV-F1lWR9-cuJrDyYdH7n1bdTHaGA17kmNsrBc",
    "camila": U + "AB6AXuAs5GwTU7aqAW4GzqxbPHCYBrLT9-ao2JhGF4SeUbQbQvUELgqShZpdO8uNJ3lMmr0BYm_yxpKVVGFx1q-rfz-CZ48LA8u_KoBnowdrYizAt9oYlQJ52mflQSNBvHcPbzmtKxE7_oC1Bwm_m1sgtIpuorcU_lzT0VaorDOtb3QNfnuv6Oh_Ht1qOWy-Ci0JcuTn1JVqJb9FpbJBHf3GVLhHAbOZTGqI2FqO4hi-EOYWK70-kzyED8g",
    "mateo": U + "AB6AXuDGRVsNsqTmpmxj_vqou1fXHMr4vWQ6XWCWfmHq1VBwNMiBdcjtEa9Q_F4b6i0IJkJBvlaBlzR-xedLt9jsktsI0nkwZA-zpNjYuPHMJNjLUbIyWmtIDNJqcL9dSYoBMDR7DSnNHuXwXundcRT-AB04rQtAqTjx3OayH1NqVDmYEX3eJmuvhg0pypl5NKjyPaI4t4GMaVv0Uitk33TyTtrzrTO9sIUnbdfCf8X_Q1DVIQV_z9bMhxo",
}


class Servicio:
    def __init__(self, id_servicio, nombre, categoria, duracion, precio_base, descripcion, etiqueta, imagen=""):
        self.id_servicio, self.nombre, self.categoria = id_servicio, nombre, categoria
        self.duracion, self.precio_base = duracion, precio_base
        self.descripcion, self.etiqueta, self.imagen = descripcion, etiqueta, imagen

    def a_dict(self):
        return {"id": self.id_servicio, "nombre": self.nombre, "categoria": self.categoria, "duracion": self.duracion,
                "precio": self.precio_base, "descripcion": self.descripcion, "etiqueta": self.etiqueta, "imagen": self.imagen}


class Estilista:
    def __init__(self, id_est, nombre, rol, rating, categorias, foto):
        self.id_est, self.nombre, self.rol, self.rating = id_est, nombre, rol, rating
        self.categorias, self.foto = categorias, foto

    def a_dict(self):
        return {"id": self.id_est, "nombre": self.nombre, "rol": self.rol, "rating": self.rating,
                "categorias": self.categorias, "foto": self.foto}


class SistemaPeluqueria:
    def __init__(self):
        self.lock = threading.RLock()
        self.servicios = {s.id_servicio: s for s in [
            Servicio(1, "Corte Diseño + Lavado", "Corte", 45, 12500.0, "Diagnóstico capilar personalizado, lavado relajante y peinado final.", "Recomendado", IMG["corte"]),
            Servicio(2, "Balayage & Nutrición", "Coloración", 120, 38000.0, "Iluminación artesanal francesa con baño de luz y nutrición profunda.", "Signature", IMG["balayage"]),
            Servicio(3, "Tratamiento Olaplex", "Tratamientos", 60, 18000.0, "Reconstrucción molecular de enlaces capilares para devolver brillo.", "Intensivo", IMG["olaplex"]),
            Servicio(4, "Corte Masculino / Femenino", "Corte", 30, 8000.0, "Corte clásico a medida con terminación prolija.", "Clásico"),
            Servicio(5, "Corte & Brushing", "Peinados", 45, 14000.0, "Corte y brushing de acabado profesional.", "Peinado"),
            Servicio(6, "Arreglo de Barba / Perfilado", "Barbería", 30, 4500.0, "Perfilado con navaja y toalla caliente.", "Barbería"),
            Servicio(7, "Combo Corte + Barba", "Barbería", 60, 11000.0, "Corte y arreglo de barba en una sola visita.", "Combo"),
            Servicio(8, "Tintura / Colorimetría", "Coloración", 90, 18000.0, "Color uniforme con diagnóstico previo.", "Color"),
        ]}
        self.estilistas = {e.id_est: e for e in [
            Estilista(1, "Sofía Albarracín", "Colorista Senior", 4.9, ["Coloración", "Tratamientos", "Peinados", "Corte"], IMG["sofia"]),
            Estilista(2, "Julián Viale", "Master Barber", 5.0, ["Barbería", "Corte"], IMG["julian"]),
            Estilista(3, "Camila Rossi", "Hair Stylist", 4.9, ["Corte", "Peinados", "Coloración"], IMG["camila"]),
            Estilista(4, "Mateo R.", "Estilista", 4.8, ["Corte", "Peinados", "Barbería"], IMG["mateo"]),
        ]}
        self.turnos, self._contador_id = [], 1
        if os.path.exists(DB):
            with open(DB, encoding="utf-8") as f:
                self.turnos = json.load(f)
            self._contador_id = max([t["id"] for t in self.turnos], default=0) + 1

    def _guardar(self):
        with open(DB, "w", encoding="utf-8") as f:
            json.dump(self.turnos, f, ensure_ascii=False, indent=1)

    # RF03 - Tarifador automático
    def precio(self, servicio, inicio):
        p = servicio.precio_base
        if inicio.weekday() in (5, 6):
            p *= 1.20
        if inicio.hour >= 19:
            p += 1500.0
        return round(p, 2)

    # RF02 - Verificación de disponibilidad (por estilista, considerando la duración)
    def _ocupado(self, id_est, ini, fin, excluir=None):
        for t in self.turnos:
            if t["estado"] == "Cancelado" or t["estilista_id"] != id_est or t["id"] == excluir:
                continue
            t_ini = datetime.strptime(t["fecha_hora"], "%Y-%m-%d %H:%M")
            if ini < t_ini + timedelta(minutes=t["duracion"]) and t_ini < fin:
                return True
        return False

    def _aptos(self, servicio, id_est):
        return [e for e in self.estilistas.values() if servicio.categoria in e.categorias and (not id_est or e.id_est == id_est)]

    def slots(self, fecha, id_servicio, id_est=0, excluir=None):
        servicio = self.servicios.get(id_servicio)
        try:
            dia = datetime.strptime(fecha, "%Y-%m-%d")
        except (TypeError, ValueError):
            return []
        if not servicio or dia.weekday() not in DIAS_ABIERTO:
            return []
        out, ahora = [], datetime.now()
        with self.lock:
            for m in range(APERTURA, CIERRE - servicio.duracion + 1, PASO):
                ini = dia + timedelta(minutes=m)
                fin = ini + timedelta(minutes=servicio.duracion)
                libre = ini > ahora and any(not self._ocupado(e.id_est, ini, fin, excluir) for e in self._aptos(servicio, id_est))
                out.append({"hora": ini.strftime("%H:%M"), "libre": libre, "precio": self.precio(servicio, ini)})
        return out

    def primer_turno(self, id_servicio, id_est=0):
        hoy = datetime.now()
        for i in range(30):
            f = (hoy + timedelta(days=i)).strftime("%Y-%m-%d")
            for s in self.slots(f, id_servicio, id_est):
                if s["libre"]:
                    return {"fecha": f, "hora": s["hora"]}
        return None

    # RF01 - Toma de reservas
    def agendar_turno(self, nombre, telefono, id_servicio, fecha, hora, forma_pago, id_est=0):
        nombre, telefono = (nombre or "").strip(), "".join(c for c in str(telefono or "") if c.isdigit())
        if not nombre or len(telefono) < 6:
            return False, "Ingresá un nombre y un teléfono válidos."
        servicio = self.servicios.get(id_servicio)
        if not servicio:
            return False, "Servicio no válido."
        if forma_pago not in FORMAS_PAGO:
            return False, "Seleccioná una forma de pago válida."
        try:
            ini = datetime.strptime(f"{fecha} {hora}", "%Y-%m-%d %H:%M")
        except (TypeError, ValueError):
            return False, "Fecha u hora inválidas."
        with self.lock:
            fin = ini + timedelta(minutes=servicio.duracion)
            if ini.weekday() not in DIAS_ABIERTO or not (APERTURA <= ini.hour * 60 + ini.minute and ini.hour * 60 + ini.minute + servicio.duracion <= CIERRE):
                return False, "Ese horario está fuera del horario de atención."
            if ini <= datetime.now():
                return False, "No se puede reservar en el pasado."
            libres = [e for e in self._aptos(servicio, id_est) if not self._ocupado(e.id_est, ini, fin)]
            if not libres:
                return False, "El horario seleccionado ya se encuentra ocupado."
            est = libres[0]
            turno = {"id": self._contador_id, "cliente": nombre, "telefono": telefono, "servicio": servicio.nombre,
                     "servicio_id": servicio.id_servicio, "estilista_id": est.id_est, "estilista": est.nombre,
                     "duracion": servicio.duracion, "fecha_hora": ini.strftime("%Y-%m-%d %H:%M"),
                     "precio_total": self.precio(servicio, ini), "forma_pago": forma_pago,
                     "pago_confirmado": False, "estado": "Pendiente"}
            self.turnos.append(turno)
            self._contador_id += 1
            self._guardar()
            return True, turno

    # RF04 - Gestión de estados
    def cambiar_estado(self, id_turno, nuevo_estado, telefono=None):
        if nuevo_estado not in ("Pendiente", "Realizado", "Cancelado"):
            return False, "Estado no válido."
        with self.lock:
            for t in self.turnos:
                if t["id"] == id_turno:
                    if telefono is not None and t["telefono"] != telefono:
                        return False, "Turno no encontrado."
                    t["estado"] = nuevo_estado
                    self._guardar()
                    return True, f"Turno #{id_turno} marcado como {nuevo_estado}."
        return False, "Turno no encontrado."

    def confirmar_pago(self, id_turno):
        with self.lock:
            for t in self.turnos:
                if t["id"] == id_turno:
                    if t["estado"] == "Cancelado":
                        return False, "No se puede confirmar el pago de un turno cancelado."
                    t["pago_confirmado"] = True
                    self._guardar()
                    return True, f"Pago del turno #{id_turno} confirmado ({t['forma_pago']})."
        return False, "Turno no encontrado."

    # RF05 - Exportación CSV
    def generar_csv(self):
        out = StringIO()
        w = csv.writer(out)
        w.writerow(["ID", "Cliente", "Telefono", "Servicio", "Estilista", "Fecha/Hora", "Precio Total", "Forma de Pago", "Pago Confirmado", "Estado"])
        for t in self.turnos:
            w.writerow([t["id"], t["cliente"], t["telefono"], t["servicio"], t["estilista"], t["fecha_hora"],
                        t["precio_total"], t["forma_pago"], "Sí" if t["pago_confirmado"] else "No", t["estado"]])
        return out.getvalue()


sistema = SistemaPeluqueria()

# ---- Aviso por WhatsApp al administrador ----
config = {"whatsapp": "", "callmebot_key": ""}
if os.path.exists(CFG):
    with open(CFG, encoding="utf-8") as f:
        config.update(json.load(f))


def guardar_config():
    with open(CFG, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=1)


def mensaje_turno(t):
    return (f"💈 Nueva solicitud de turno #{t['id']}\nCliente: {t['cliente']} ({t['telefono']})\n"
            f"Servicio: {t['servicio']}\nFecha: {t['fecha_hora']} hs\nEstilista: {t['estilista']}\n"
            f"Total: ${t['precio_total']:,.0f} · {t['forma_pago']}")


def link_whatsapp(t):
    return f"https://wa.me/{config['whatsapp']}?text={quote(mensaje_turno(t))}" if config["whatsapp"] else ""


def _enviar_callmebot(num, key, texto):
    try:
        url = f"https://api.callmebot.com/whatsapp.php?phone={num}&text={quote(texto)}&apikey={quote(key)}"
        urllib.request.urlopen(url, timeout=15).read()
    except Exception as e:
        print("No se pudo enviar el WhatsApp automático:", e)


def avisar_admin(t):
    """Envío automático (CallMeBot) si el administrador cargó número y clave. Devuelve True si se intentó."""
    if config["whatsapp"] and config["callmebot_key"]:
        threading.Thread(target=_enviar_callmebot, args=(config["whatsapp"], config["callmebot_key"], mensaje_turno(t)), daemon=True).start()
        return True
    return False
TOKENS = set()


class ServidorPeluqueria(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=PUBLIC, **k)

    def _json(self, datos, code=200):
        body = json.dumps(datos, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _admin(self):
        if self.headers.get("X-Admin-Token") in TOKENS:
            return True
        self._json({"exito": False, "mensaje": "Acceso no autorizado."}, 401)
        return False

    def do_GET(self):
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        num = lambda k: int(q[k]) if q.get(k, "").isdigit() else 0
        if u.path == "/api/config":
            return self._json({"servicios": [s.a_dict() for s in sistema.servicios.values()],
                               "estilistas": [e.a_dict() for e in sistema.estilistas.values()],
                               "formas_pago": FORMAS_PAGO, "whatsapp": config["whatsapp"]})
        if u.path == "/api/disponibilidad":
            return self._json(sistema.slots(q.get("fecha"), num("servicio"), num("estilista")))
        if u.path == "/api/primer_turno":
            return self._json(sistema.primer_turno(num("servicio"), num("estilista")))
        if u.path == "/api/mis_turnos":
            tel = "".join(c for c in q.get("telefono", "") if c.isdigit())
            return self._json([t for t in sistema.turnos if tel and t["telefono"] == tel])
        if u.path == "/api/admin_config":
            return self._admin() and self._json({"whatsapp": config["whatsapp"], "clave": bool(config["callmebot_key"])})
        if u.path == "/api/turnos":
            return self._admin() and self._json(sistema.turnos)
        if u.path == "/api/exportar":
            if not self._admin():
                return
            body = sistema.generar_csv().encode("utf-8-sig")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="agenda_turnos.csv"')
            self.end_headers()
            return self.wfile.write(body)
        if u.path.startswith("/api/"):
            return self._json({"exito": False, "mensaje": "No encontrado."}, 404)
        if u.path in ("/", "/index.html"):
            self.path = "/index.html"
        elif not u.path.startswith("/static/"):      # no exponer server.py ni turnos.json
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            d = json.loads(self.rfile.read(n).decode("utf-8")) if n else {}
        except (ValueError, UnicodeDecodeError):
            return self._json({"exito": False, "mensaje": "JSON inválido."}, 400)
        try:
            ident = int(d.get("id") or 0)
            if self.path == "/api/agendar":
                ok, res = sistema.agendar_turno(d.get("nombre"), d.get("telefono"), int(d.get("servicio") or 0),
                                                d.get("fecha"), d.get("hora"), d.get("forma_pago"), int(d.get("estilista") or 0))
                extra = {"wa_url": link_whatsapp(res), "wa_auto": avisar_admin(res)} if ok else {}
                return self._json({"exito": ok, "datos": res if ok else None, "mensaje": "Ok" if ok else res, **extra}, 200 if ok else 400)
            if self.path == "/api/cancelar":   # el cliente cancela su propio turno pendiente
                tel = "".join(c for c in str(d.get("telefono", "")) if c.isdigit())
                t = next((t for t in sistema.turnos if t["id"] == ident), None)
                if t and t["estado"] != "Pendiente":
                    return self._json({"exito": False, "mensaje": "Solo se pueden cancelar turnos pendientes."}, 400)
                ok, msg = sistema.cambiar_estado(ident, "Cancelado", tel)
            elif self.path == "/api/admin_login":
                ok = secrets.compare_digest(str(d.get("pin", "")), ADMIN_PIN)
                if ok:
                    tok = secrets.token_hex(16)
                    TOKENS.add(tok)
                    return self._json({"exito": True, "token": tok})
                return self._json({"exito": False, "mensaje": "PIN incorrecto."}, 401)
            elif self.path == "/api/admin_config":
                if not self._admin():
                    return
                config["whatsapp"] = "".join(c for c in str(d.get("whatsapp", "")) if c.isdigit())
                if d.get("clave"):
                    config["callmebot_key"] = str(d["clave"]).strip()
                guardar_config()
                ok, msg = True, "Configuración guardada."
            elif self.path == "/api/cambiar_estado":
                if not self._admin():
                    return
                ok, msg = sistema.cambiar_estado(ident, d.get("estado"))
            elif self.path == "/api/confirmar_pago":
                if not self._admin():
                    return
                ok, msg = sistema.confirmar_pago(ident)
            else:
                return self._json({"exito": False, "mensaje": "No encontrado."}, 404)
        except (TypeError, ValueError):
            return self._json({"exito": False, "mensaje": "Datos inválidos."}, 400)
        self._json({"exito": ok, "mensaje": msg}, 200 if ok else 400)


if __name__ == "__main__":
    puerto = 8000
    print(f"🚀 Servidor Python ejecutándose en: http://localhost:{puerto}  (PIN admin: {ADMIN_PIN})")
    ThreadingHTTPServer(("localhost", puerto), ServidorPeluqueria).serve_forever()

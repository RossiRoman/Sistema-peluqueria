# Estilo Único — Gestión de turnos

## Publicar en Netlify
1. Subí esta carpeta a un repositorio de GitHub. (Arrastrar la carpeta en Netlify Drop no sirve: las funciones del backend requieren Git o la CLI).
2. En Netlify: *Add new site → Import an existing project* → elegí el repo. No hace falta comando de build (`netlify.toml` ya define `public/` y `netlify/functions/`).
3. En *Site configuration → Environment variables* creá **`ADMIN_PIN`** con el PIN del administrador (si no, queda `1234`). Opcional: `ADMIN_SECRET` (texto largo aleatorio para firmar las sesiones).
4. Deploy. Los turnos y el número de WhatsApp se guardan en Netlify Blobs (no se pierden entre despliegues).

Con la CLI: `npm i -g netlify-cli && npm install && netlify deploy --prod`.
Probar local con el entorno de Netlify: `npm install && netlify dev`.

## Uso local con Python (versión del TP)
`python server.py` → http://localhost:8000 (sirve la carpeta `public/` y guarda en `turnos.json`).

## Panel admin: estilos y productos
Entrá a `/#admin` con el PIN. Además de la **Agenda**, hay dos pestañas nuevas:
- **Estilos**: alta, edición y baja de los servicios reservables (nombre, categoría, duración, precio, etiqueta, descripción y foto).
- **Productos**: catálogo de venta que se muestra en el inicio (nombre, precio, descripción y foto). Si cargás tu WhatsApp, cada producto tiene un botón "Consultar".

Las fotos se achican en el navegador (máx. 900 px) y se guardan en Netlify Blobs (o en `imagenes/` con Python). El catálogo se guarda en Blobs (o en `catalogo.json`). La primera vez que guardás, se parte de los 8 estilos que ya existían.

## Estructura
- `public/` sitio estático (index.html + static/)
- `netlify/functions/api.mjs` API para Netlify
- `server.py` API equivalente en Python puro

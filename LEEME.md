# Ruido Íntimo — sitio web

**Sitio publicado:** https://ruido-intimo.vercel.app
**Código:** https://github.com/AlexAnder0905/Ruido-Intimo (cada cambio en `main` se publica solo en Vercel)
**Testimonios:** proyecto Supabase «Ruido Íntimo» (ya conectado en `js/comentarios.js`)

Sitio estático (HTML + CSS + JavaScript, sin librerías ni instalación). Funciona en cualquier hosting.

## Estructura

```
ruido-intimo-sitio/
├── index.html        → Página "Hoy": versículo del día, pasaje, concordancias y devocional
├── archivo.html      → Página "Archivo": devocionales en PDF y videos de YouTube
├── que-es.html       → Página "¿Qué es Ruido Íntimo?" + sección Comunidad (#comunidad)
├── css/estilos.css   → Todo el diseño (colores en la sección 01)
├── js/app.js         → Funciones compartidas (tema día/noche, compartir, lector, animaciones)
├── js/archivo.js     → LISTA de devocionales y videos (aquí agregas contenido nuevo)
├── js/piano.js       → Piano de fondo para acompañar la lectura
├── js/comentarios.js → Muro "¿Qué te habló Dios hoy?" (conexión a la base de datos)
├── img/              → Imagen del día, logos (color y blanco), favicon, grano y fotos
├── img/ig/           → Publicaciones de Instagram que se muestran en "¿Qué es?"
├── pdf/              → PDFs de los devocionales (los actuales son de EJEMPLO)
└── fonts/            → Fraunces + Inter alojadas en el sitio (licencia libre OFL)
```

## Antes de publicar (reemplazar)

| Qué | Dónde |
|---|---|
| Link del canal de YouTube (`https://www.youtube.com/`) | Las 3 páginas: buscar "REEMPLAZA" y "youtube.com/" |
| Posts de Instagram del feed | Cambia las imágenes de `img/ig/` y pega el link de cada post en `que-es.html` (sección 7) |
| Derechos de las fotografías | Confirma que puedes usar en la web las fotos de `img/que-es-*` (vienen de tu moodboard) |
| PDFs de ejemplo | Carpeta `pdf/`, mismo nombre de archivo o actualiza la ruta en `js/archivo.js` |
| Títulos de ejemplo (semanas 02 a 05) | `js/archivo.js` |
| Nombre del autor (hoy dice "Alexander Alva") | `index.html`, tarjeta del devocional y firma |
| Conexión de comentarios | `js/comentarios.js` (ver sección Comentarios) |

## Logotipo

- `img/logo-color.png` se muestra en modo día y `img/logo-blanco.png` en modo noche (cambia solo).
- Los dos tienen fondo transparente. Si actualizas el logo, conserva los nombres de archivo.
- Instagram ya apunta a **@ruidointimo**. El botón **Comunidad** lleva a `que-es.html#comunidad`.

## Publicar un nuevo versículo / devocional

En `index.html`:

1. **Imagen**: reemplaza `img/versiculo-hoy.webp` y `img/versiculo-hoy.jpg` (mismo nombre). Ideal: horizontal, mínimo 1200 px de ancho, menos de 250 KB.
2. **Versículo**: cambia el texto dentro de `<blockquote class="versiculo-grande">`. Lo que va en `<strong>` se destaca en verde.
3. **Referencia**: en `.referencia`, en `.hoy-imagen-ref` y en los `data-texto` de los botones Compartir/Copiar.
4. **Fecha**: cambia `data-fecha="AAAA-MM-DD"` (aparece dos veces). El sitio la escribe en español automáticamente.
5. **Pasaje**: dentro de `#lector`, cada versículo es un `<span class="v" data-v="NÚMERO">`. Agrega la clase `v-dia` al versículo principal. Cambia `data-libro="Libro Capítulo"` y `data-version`.
6. **Concordancias**: copia/pega un bloque `<article class="conc">`.
7. **Devocional**: título, bajada y párrafos. Usa `<h3>` para subtítulos y `<blockquote class="cita-destacada">` para la frase destacada.
8. Luego agrega la semana anterior al archivo (abajo).

## Pasaje en 4 versiones (RVR1960 · NBLA · NTV · PDT)

En `index.html`, dentro de `#lector`, hay un bloque `<div class="lector-texto" data-version="...">` por versión.
Para un pasaje nuevo, reemplaza los `<span class="v">` de cada bloque (mismos números `data-v` en las 4).
El aviso de derechos de cada versión está en `data-credito` y cambia solo al elegir la pestaña.
La versión elegida queda guardada en el navegador de cada persona.

## Piano de fondo

- Suena **«Conéctate» de Benjamín O’Kington** (`audio/conectate-benjamin-okington-2.mp3`, 10 min, recortada para que empiece en la primera nota y se repita en bucle sin silencios).
- Para cambiar la pista: sube otro mp3 a `audio/` y en `index.html` cambia `data-src` y `data-artista` del reproductor:
  `<div class="piano" id="piano" data-src="audio/otra-pista.mp3" data-artista="Nombre del autor">`
- Si dejas `data-src=""`, suena un piano generado en vivo (sin archivo).
- El audio solo se descarga cuando alguien aprieta reproducir, así que no hace más lenta la página.
- El volumen y el silencio se recuerdan. Si la persona baja leyendo, aparece un botón flotante para pausar.

## Leer el capítulo completo (dentro del sitio)

El botón «Leer Santiago 1 completo» despliega el capítulo bajo el pasaje, en la versión elegida.
El texto **no está copiado en el sitio**: se carga en vivo desde **bolls.life**, un servicio bíblico gratuito.

- RVR1960, NTV y PDT se muestran tal cual. La **NBLA no está en ese servicio**: se muestra la **LBLA** (versión anterior de la misma editorial) con un aviso.
- Si el servicio no responde, aparece «Reintentar» y un enlace a BibleGateway como respaldo.
- Para otro capítulo, cambia en el botón `#capitulo-btn` de `index.html`: `data-libro`, `data-libro-id` (Santiago = 59; lista en `js/capitulo.js`), `data-cap` y `data-destacar`.
- bolls.life es un proyecto independiente y gratuito, sin garantía de funcionamiento ni de licencias. Si el sitio crece, conviene pasar a un servicio oficial con licencia (por ejemplo YouVersion Platform o API.Bible); solo hay que cambiar la función `SERVICIO` en `js/capitulo.js`.

## Volumen del piano

- La barra de volumen ajusta la pista también en iPhone (Safari ignora el volumen normal, por eso la pista pasa por Web Audio).
- Mientras suena, aparece en la pantalla bloqueada y el centro de control del celular con «Conéctate · Benjamín O’Kington»: desde ahí se pausa, y los botones físicos ajustan el volumen general del teléfono.
- Ninguna página web puede cambiar el volumen general del celular por sí misma: es una restricción de seguridad de los navegadores.

## Concordancias en 4 versiones

Cada tarjeta `.conc` tiene un `<blockquote data-version-texto="...">` por versión. Las pestañas de versión
del lector y de las concordancias están sincronizadas: elegir una cambia todo.

## Comentarios: "¿Qué te habló Dios hoy?"

Sin configurar, funciona en **modo demostración**: cada persona ve solo lo que escribió (se guarda en su navegador) y aparece un aviso.
Para que todos vean los testimonios, conecta **Supabase** (gratis):

1. Crea una cuenta en supabase.com → **New project**.
2. Ve a **SQL Editor** y ejecuta:

```sql
create table comentarios (
  id bigint generated always as identity primary key,
  devocional text not null,
  nombre text not null default 'Anónimo' check (char_length(nombre) <= 40),
  texto text not null check (char_length(texto) between 3 and 600),
  aprobado boolean not null default false,
  creado timestamptz not null default now()
);
alter table comentarios enable row level security;

-- Cualquiera puede enviar, pero queda pendiente de aprobación
create policy "enviar" on comentarios for insert to anon
  with check (aprobado = false);

-- Solo se muestran los aprobados
create policy "leer aprobados" on comentarios for select to anon
  using (aprobado = true);
```

3. En **Project Settings → API** copia la *Project URL* y la clave *anon public*.
4. Pégalas en `js/comentarios.js` (`supabaseUrl` y `supabaseClave`).
5. **Moderar**: en **Table Editor → comentarios**, marca `aprobado = true` en los que quieras publicar.
   Si prefieres publicar sin revisión, cambia `default false` por `default true` en el SQL, quita `with check (aprobado = false)` y pon `moderacion: false` en `js/comentarios.js` (no recomendado: spam y mensajes sensibles).

Cada devocional tiene su propio muro según `data-devocional` en el formulario (ej. `santiago-1-12`). Cámbialo al publicar uno nuevo.

## Agregar al Archivo

Abre `js/archivo.js` y copia un bloque `{ ... }` al inicio de la lista `DEVOCIONALES`:

```js
{
  numero: '07',
  titulo: 'Título del devocional',
  cita: 'Salmo 23:1',
  fecha: '2026-11-05',
  resumen: 'Una frase breve.',
  temas: ['Descanso'],
  pdf: 'pdf/semana-07-titulo.pdf',
  color: 'verde'          // verde | tinta | crema | hondo
}
```

Videos: en `VIDEOS`, pega el ID de YouTube (lo que va después de `v=` en el link). Si `id` está vacío, la tarjeta aparece como "Próximamente".

## Subirlo a internet (gratis)

- **Netlify Drop**: entra a app.netlify.com/drop y arrastra la carpeta completa. Listo en segundos.
- **GitHub Pages**: sube la carpeta a un repositorio → Settings → Pages → rama `main`.
- **Hosting propio (cPanel)**: sube el contenido de la carpeta a `public_html`.

Para probarlo en tu computador, ábrelo con la extensión **Live Server** de VS Code (algunos navegadores bloquean funciones si abres el HTML con doble clic).

## Rendimiento y accesibilidad

- Sin frameworks: ~55 KB de CSS + JS en total (sin comprimir).
- Animaciones solo con `opacity` y `transform`; se desactivan si la persona prefiere menos movimiento.
- Tipografías propias con `font-display: swap` y precarga.
- Imágenes WebP con respaldo JPG; las del archivo cargan en diferido (`loading="lazy"`).
- Modo noche automático (según el sistema) y manual (botón luna/sol).
- Navegación inferior tipo app en móvil.

## Texto bíblico

La NBLA permite citar hasta 500 versículos con el aviso de copyright que ya está en el lector. Si usas otra versión, actualiza ese aviso.

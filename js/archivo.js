/* ============================================================
   RUIDO ÍNTIMO — archivo.js
   Tarjetas de devocionales (lista en js/devocionales.js)
   y videos de YouTube.

   ► PARA AGREGAR UN DEVOCIONAL NUEVO
     Edita la lista DEVOCIONALES en js/devocionales.js.

   ► PARA AGREGAR UN VIDEO
     Copia un bloque de VIDEOS y pega el ID de YouTube.
     El ID es lo que va después de "v=" en el link:
     https://www.youtube.com/watch?v=ABC123xyz  →  id: 'ABC123xyz'
     Si el video aún no existe, deja id: '' y aparecerá «Próximamente».
   ============================================================ */


/* ------------------------------------------------------------
   DATOS — VIDEOS
------------------------------------------------------------ */
const VIDEOS = [
  { id: '', titulo: 'Del ruido a la intimidad', descripcion: 'Por qué existe Ruido Íntimo y hacia dónde queremos caminar.', duracion: '' },
  { id: '', titulo: 'Permanecer en la prueba', descripcion: 'Lectura y reflexión en voz alta de Santiago 1:12–15.', duracion: '' },
  { id: '', titulo: 'Cinco minutos de silencio', descripcion: 'Una pausa guiada con la Escritura para comenzar el día.', duracion: '' }
];


/* ============================================================
   A partir de aquí no necesitas modificar nada.
   ============================================================ */

const grillaDev   = document.getElementById('grilla-devocionales');
const grillaVid   = document.getElementById('grilla-videos');
const inputBuscar = document.getElementById('buscar');
const chipsEl     = document.getElementById('chips');
const resultados  = document.getElementById('resultados');
const vacio       = document.getElementById('vacio');

// Quita tildes para que "oracion" encuentre "oración"
function normalizar(txt) {
  return txt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}


/* ---------- Tarjeta de video ---------- */
function tarjetaVideo(v, i) {
  const existe = Boolean(v.id);
  const mini = existe
    ? `<img src="https://i.ytimg.com/vi/${seguro(v.id)}/hqdefault.jpg" alt="" loading="lazy" decoding="async">
       <span class="video-play"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>
       ${v.duracion ? `<span class="video-duracion">${seguro(v.duracion)}</span>` : ''}`
    : `<span class="portada-rosa"></span><span class="video-estado">Próximamente</span>`;

  const contenido = `
      <div class="video-mini">${mini}</div>
      <div class="video-info">
        <h3 class="video-titulo">${seguro(v.titulo)}</h3>
        <p class="video-desc">${seguro(v.descripcion)}</p>
      </div>`;

  return existe
    ? `<a class="video-card revelar" style="--d:${i}" href="https://www.youtube.com/watch?v=${seguro(v.id)}" target="_blank" rel="noopener" aria-label="Ver en YouTube: ${seguro(v.titulo)}">${contenido}</a>`
    : `<article class="video-card revelar" style="--d:${i}">${contenido}</article>`;
}


/* ---------- Filtros ---------- */
let temaActivo = 'Todos';

function pintarChips() {
  const temas = ['Todos', ...new Set(DEVOCIONALES.flatMap(d => d.temas || []))];
  chipsEl.innerHTML = temas.map(t =>
    `<button type="button" class="chip-filtro" aria-pressed="${t === temaActivo}" data-tema="${seguro(t)}">${seguro(t)}</button>`
  ).join('');
}

function filtrar() {
  const q = normalizar(inputBuscar.value.trim());
  const lista = DEVOCIONALES.filter(d => {
    const coincideTema = temaActivo === 'Todos' || (d.temas || []).includes(temaActivo);
    const texto = normalizar([d.titulo, d.cita, d.resumen, d.numero, ...(d.temas || [])].join(' '));
    return coincideTema && (!q || texto.includes(q));
  });

  // Sin filtros, la primera tarjeta anuncia el próximo devocional
  const sinFiltro = temaActivo === 'Todos' && !q;
  grillaDev.innerHTML = (sinFiltro ? tarjetaProximo(0) : '') +
    lista.map((d, i) => tarjetaDevocional(d, sinFiltro ? i + 1 : i)).join('');
  vacio.classList.toggle('visible', lista.length === 0);
  resultados.textContent = lista.length === DEVOCIONALES.length
    ? `${lista.length} publicados`
    : `${lista.length} de ${DEVOCIONALES.length}`;

  activarRevelar(grillaDev);   // función de app.js
}

chipsEl.addEventListener('click', e => {
  const chip = e.target.closest('[data-tema]');
  if (!chip) return;
  temaActivo = chip.dataset.tema;
  pintarChips();
  filtrar();
});

let pausa;
inputBuscar.addEventListener('input', () => {
  clearTimeout(pausa);
  pausa = setTimeout(filtrar, 120);
});


/* ---------- Inicio ---------- */
document.getElementById('cifra-devocionales').textContent = DEVOCIONALES.length;
const videosPublicados = VIDEOS.filter(v => v.id).length;
const cifraVideos = document.getElementById('cifra-videos');
cifraVideos.textContent = videosPublicados || 'Pronto';
cifraVideos.classList.toggle('pronto', videosPublicados === 0);

pintarChips();
filtrar();

grillaVid.innerHTML = VIDEOS.map(tarjetaVideo).join('');
activarRevelar(grillaVid);

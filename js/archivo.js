/* ============================================================
   RUIDO ÍNTIMO — archivo.js
   Lista de devocionales (PDF) y videos (YouTube).

   ► PARA AGREGAR UN DEVOCIONAL NUEVO
     1. Sube el PDF a la carpeta /pdf
     2. Copia un bloque { ... } de DEVOCIONALES, pégalo ARRIBA
        de la lista y cambia sus datos.

   ► PARA AGREGAR UN VIDEO
     Copia un bloque de VIDEOS y pega el ID de YouTube.
     El ID es lo que va después de "v=" en el link:
     https://www.youtube.com/watch?v=ABC123xyz  →  id: 'ABC123xyz'
     Si el video aún no existe, deja id: '' y aparecerá "Próximamente".
   ============================================================ */


/* ------------------------------------------------------------
   DATOS — DEVOCIONALES
   color: 'verde' | 'tinta' | 'crema' | 'hondo'
   portada (opcional): ruta a una imagen propia, ej. 'img/portadas/semana-06.jpg'
   (Los títulos 02 a 05 son de EJEMPLO: reemplázalos por los reales.)
------------------------------------------------------------ */
const DEVOCIONALES = [
  {
    numero: '08',
    titulo: '¿Qué estoy haciendo mientras camino y espero?',
    cita: 'Mateo 28:19',
    fecha: '2026-11-03',
    resumen: 'Dios nos ha llamado a transformar nuestro entorno, no a ser transformados por quienes viven en nuestro entorno.',
    temas: ['Discipulado', 'Comunidad'],
    pdf: 'pdf/semana-08-mientras-camino-y-espero.pdf',
    leer: 'index.html#devocional',
    color: 'tinta'
  },
  {
    numero: '07',
    titulo: 'Permanecer en la prueba',
    cita: 'Santiago 1:12',
    fecha: '2026-10-29',
    resumen: 'La victoria no consiste solo en salir de la prueba, sino en permanecer en Cristo durante ella.',
    temas: ['Pruebas', 'Perseverancia'],
    pdf: 'pdf/semana-07-permanecer-en-la-prueba.pdf',
    portada: 'img/portadas/semana-07.webp',
    color: 'hondo'
  },
  {
    numero: '06',
    titulo: 'Hechos a Su imagen',
    cita: 'Romanos 8:29',
    fecha: '2026-10-22',
    resumen: 'El propósito de Dios no es solo que seas mejor, sino que te parezcas a Su Hijo.',
    temas: ['Identidad', 'Propósito'],
    pdf: 'pdf/semana-06-hechos-a-su-imagen.pdf',
    portada: 'img/portadas/semana-06.webp',
    color: 'verde'
  },
  {
    numero: '05',
    titulo: 'La luz que no se apaga',
    cita: 'Juan 1:5',
    fecha: '2026-10-15',
    resumen: 'Ninguna oscuridad que enfrentes ha logrado apagar la luz de Cristo.',
    temas: ['Esperanza'],
    pdf: 'pdf/semana-05-la-luz-que-no-se-apaga.pdf',
    color: 'tinta'
  },
  {
    numero: '04',
    titulo: 'El silencio también habla',
    cita: 'Salmo 46:10',
    fecha: '2026-10-08',
    resumen: 'Detenerse no es perder el tiempo: es reconocer quién es Dios.',
    temas: ['Silencio', 'Descanso'],
    pdf: 'pdf/semana-04-el-silencio-tambien-habla.pdf',
    color: 'crema'
  },
  {
    numero: '03',
    titulo: 'Gracia que alcanza',
    cita: '2 Corintios 12:9',
    fecha: '2026-10-01',
    resumen: 'Tu debilidad no es el final de la historia; es el lugar donde Su poder se perfecciona.',
    temas: ['Gracia'],
    pdf: 'pdf/semana-03-gracia-que-alcanza.pdf',
    color: 'hondo'
  },
  {
    numero: '02',
    titulo: 'Cuando el alma se cansa',
    cita: 'Mateo 11:28',
    fecha: '2026-09-24',
    resumen: 'Jesús no te pide que llegues fuerte. Te invita a llegar como estás.',
    temas: ['Descanso'],
    pdf: 'pdf/semana-02-cuando-el-alma-se-cansa.pdf',
    color: 'verde'
  },
  {
    numero: '01',
    titulo: 'La relación que transforma',
    cita: 'Juan 15:5',
    fecha: '2026-09-17',
    resumen: 'Permanecer en Cristo es el comienzo de toda transformación verdadera.',
    temas: ['Identidad', 'Intimidad'],
    pdf: 'pdf/semana-01-la-relacion-que-transforma.pdf',
    color: 'tinta'
  }
];


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

const MESES_CORTOS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function fechaCorta(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES_CORTOS[m - 1]} ${a}`;
}

// Evita que un texto rompa el HTML
function seguro(txt = '') {
  return String(txt).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// Quita tildes para que "oracion" encuentre "oración"
function normalizar(txt) {
  return txt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}


/* ---------- Tarjeta de devocional ---------- */
function tarjetaDevocional(d, i) {
  const portadaImg = d.portada
    ? `<img src="${seguro(d.portada)}" alt="" loading="lazy" decoding="async">`
    : '';
  const botonLeer = d.leer
    ? `<a href="${seguro(d.leer)}" class="btn btn-borde btn-sm">Leer</a>`
    : '';
  const botonPdf = d.pdf
    ? `<a href="${seguro(d.pdf)}" class="btn btn-primario btn-sm" download>
         <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>
         PDF
       </a>`
    : `<span class="btn btn-borde btn-sm" aria-disabled="true">PDF pronto</span>`;

  return `
    <article class="dev-card revelar" style="--d:${i % 4}">
      <div class="portada portada--${seguro(d.color || 'verde')}${d.portada ? ' portada--imagen' : ''}" aria-hidden="true">
        ${portadaImg}
        <span class="portada-num">N.º ${seguro(d.numero)}</span>
        <span class="portada-titulo">${seguro(d.titulo)}</span>
        <span class="portada-pie"><span class="portada-rosa"></span></span>
      </div>
      <div class="dev-info">
        <p class="dev-meta"><span>${seguro(d.cita)}</span><time datetime="${seguro(d.fecha)}">${fechaCorta(d.fecha)}</time></p>
        <h3 class="dev-titulo sr-only">${seguro(d.titulo)}</h3>
        <p class="dev-resumen">${seguro(d.resumen)}</p>
        <div class="dev-acciones">${botonPdf}${botonLeer}</div>
      </div>
    </article>`;
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

  grillaDev.innerHTML = lista.map(tarjetaDevocional).join('');
  vacio.classList.toggle('visible', lista.length === 0);
  resultados.textContent = lista.length === DEVOCIONALES.length
    ? `${lista.length} semanas`
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

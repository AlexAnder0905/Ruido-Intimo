/* ============================================================
   RUIDO ÍNTIMO — devocionales.js
   Lista única de devocionales. La usan:
   · archivo.html (todas las tarjetas)
   · cada devocional (sección «Más escritos»)
   · el inicio (aviso del próximo devocional)

   ► PARA AGREGAR UN DEVOCIONAL NUEVO
     1. Crea el PDF con el mismo diseño de todos:
        python3 herramientas/crear-pdf.py index.html
        (queda en /pdf; escribe su ruta en el campo pdf)
     2. Copia un bloque { ... } de DEVOCIONALES, pégalo ARRIBA
        de la lista y cambia sus datos.
     El aviso «Próximamente» avanza solo al miércoles siguiente.

   ► DÍA DE PUBLICACIÓN
     Un devocional nuevo cada miércoles (DIA_PUBLICACION = 3).
     Domingo 0 · lunes 1 · martes 2 · miércoles 3 · jueves 4 ·
     viernes 5 · sábado 6.

   ► PRÓXIMO DEVOCIONAL (opcional)
     Si ya sabes el título o el versículo del próximo, escríbelos
     en PROXIMO. Si los dejas vacíos, se muestra un texto general.
   ============================================================ */

const DIA_PUBLICACION = 3;   // miércoles

const PROXIMO = {
  titulo: '',   // ej.: 'Raíces profundas'
  cita: ''      // ej.: 'Salmo 1:3'
};

/* color: 'verde' | 'tinta' | 'crema' | 'hondo'
   portada (opcional): imagen propia, ej. 'img/portadas/semana-10.webp'
   leer (opcional): página web del devocional
*/
const DEVOCIONALES = [
  {
    numero: '11',
    titulo: '¿Anhelamos la prueba?',
    cita: 'Santiago 1',
    fecha: '2026-11-25',
    resumen: 'La prueba tiene el potencial de fortalecer nuestra fe, producir perseverancia y llevarnos a la madurez espiritual.',
    temas: ['Pruebas', 'Sabiduría'],
    pdf: 'pdf/semana-11-anhelamos-la-prueba.pdf',
    leer: 'index.html#devocional',
    portada: 'img/portadas/semana-11.webp',
    color: 'verde'
  },
  {
    numero: '10',
    titulo: 'Dependemos en «todo» de Dios',
    cita: 'Oseas 11',
    fecha: '2026-11-18',
    resumen: 'Entender que todos los días tengo necesidad de Su presencia es una declaración de dependencia, no de debilidad.',
    temas: ['Dependencia', 'Dios Padre'],
    pdf: 'pdf/semana-10-dependemos-en-todo-de-dios.pdf',
    leer: 'semana-10.html',
    portada: 'img/portadas/semana-10.webp',
    color: 'verde'
  },
  {
    numero: '09',
    titulo: 'El pueblo firmó, celebró y cantó, y luego no obedeció',
    cita: 'Nehemías 13',
    fecha: '2026-11-11',
    resumen: 'La obediencia no se mide por la intensidad del momento de compromiso, sino por la fidelidad cuando nadie te está mirando.',
    temas: ['Obediencia', 'Fidelidad'],
    pdf: 'pdf/semana-09-el-pueblo-firmo-celebro-y-canto.pdf',
    leer: 'semana-09.html',
    portada: 'img/portadas/semana-09.webp',
    color: 'verde'
  },
  {
    numero: '08',
    titulo: '¿Qué estoy haciendo mientras camino y espero?',
    cita: 'Jeremías 29:7',
    fecha: '2026-11-03',
    resumen: 'Dios nos ha llamado a transformar nuestro entorno, no a ser transformados por quienes viven en nuestro entorno.',
    temas: ['Discipulado', 'Comunidad'],
    pdf: 'pdf/semana-08-mientras-camino-y-espero.pdf',
    leer: 'semana-08.html',
    portada: 'img/portadas/semana-08.webp',
    color: 'hondo'
  },
  {
    numero: '07',
    titulo: 'Permanecer en la prueba',
    cita: 'Santiago 1:12',
    fecha: '2026-10-29',
    resumen: 'La victoria no consiste solo en salir de la prueba, sino en permanecer en Cristo durante ella.',
    temas: ['Pruebas', 'Perseverancia'],
    pdf: 'pdf/semana-07-permanecer-en-la-prueba.pdf',
    leer: 'semana-07.html',
    portada: 'img/portadas/semana-07.webp',
    color: 'hondo'
  }
];


/* ============================================================
   A partir de aquí no necesitas modificar nada.
   ============================================================ */

const RI_MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const RI_MESES_CORTOS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const RI_DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

function riFecha(iso) { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); }
function riIso(f) { return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`; }
function fechaCorta(iso) { const f = riFecha(iso); return `${f.getDate()} ${RI_MESES_CORTOS[f.getMonth()]} ${f.getFullYear()}`; }
function fechaLarga(iso) { const f = riFecha(iso); return `${RI_DIAS[f.getDay()]} ${f.getDate()} de ${RI_MESES[f.getMonth()]}`; }

// Evita que un texto rompa el HTML
function seguro(txt = '') {
  return String(txt).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* Próximo devocional: una semana después del último publicado.
   Si esa fecha ya pasó (y aún no se agrega el nuevo), se usa
   el próximo día de publicación desde hoy. */
function proximoDevocional() {
  const ultimo = DEVOCIONALES.reduce((a, d) => (d.fecha > a.fecha ? d : a), DEVOCIONALES[0]);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = riFecha(ultimo.fecha); f.setDate(f.getDate() + 7);
  if (f < hoy) {
    f.setTime(hoy.getTime());
    while (f.getDay() !== DIA_PUBLICACION) f.setDate(f.getDate() + 1);
  }
  const dias = Math.round((f - hoy) / 864e5);
  const iso = riIso(f);
  const cuando = dias === 0 ? `Se publica hoy, ${fechaLarga(iso)}`
               : dias === 1 ? `Se publica mañana, ${fechaLarga(iso)}`
               : `Se publica el ${fechaLarga(iso)}`;
  return {
    numero: String(Number(ultimo.numero) + 1).padStart(2, '0'),
    fecha: iso, dias, cuando,
    titulo: (PROXIMO.titulo || '').trim(),
    cita: (PROXIMO.cita || '').trim()
  };
}

/* ---------- Tarjeta de devocional ---------- */
function tarjetaDevocional(d, i) {
  const portadaImg = d.portada ? `<img src="${seguro(d.portada)}" alt="" loading="lazy" decoding="async">` : '';
  // Si el devocional tiene página web, «Leer» es la acción principal
  const botonLeer = d.leer ? `<a href="${seguro(d.leer)}" class="btn btn-primario btn-sm" aria-label="Leer «${seguro(d.titulo)}»">Leer</a>` : '';
  const botonPdf = d.pdf
    ? `<a href="${seguro(d.pdf)}" class="btn ${d.leer ? 'btn-borde' : 'btn-primario'} btn-sm" download aria-label="Descargar en PDF «${seguro(d.titulo)}»">
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
        <div class="dev-acciones">${botonLeer}${botonPdf}</div>
      </div>
    </article>`;
}

/* ---------- Tarjeta «Próximamente» ---------- */
function tarjetaProximo(i = 0) {
  const p = proximoDevocional();
  const titulo = p.titulo || 'Un nuevo encuentro con la Palabra';
  return `
    <article class="dev-card dev-card--proximo revelar" style="--d:${i % 4}">
      <div class="portada portada--proximo" aria-hidden="true">
        <span class="portada-num">N.º ${seguro(p.numero)} · Próximamente</span>
        <span class="portada-titulo">${seguro(titulo)}</span>
        <span class="portada-pie"><span class="portada-rosa"></span></span>
      </div>
      <div class="dev-info">
        <p class="dev-meta"><span class="dev-pronto"><span class="punto" aria-hidden="true"></span>${p.cita ? seguro(p.cita) : 'Próximamente'}</span><time datetime="${p.fecha}">${p.dias === 0 ? 'Hoy' : p.dias === 1 ? 'Mañana' : fechaCorta(p.fecha)}</time></p>
        <h3 class="dev-titulo">Devocional N.º ${seguro(p.numero)}</h3>
        <p class="dev-resumen">${seguro(p.cuando)}. Publicamos un devocional nuevo cada ${RI_DIAS[DIA_PUBLICACION]}.</p>
        <div class="dev-acciones">
          <a href="https://www.instagram.com/ruidointimo/" class="btn btn-borde btn-sm" target="_blank" rel="noopener">Avísame en Instagram</a>
        </div>
      </div>
    </article>`;
}

/* ---------- Aviso del próximo devocional (inicio y archivo) ---------- */
document.querySelectorAll('[data-proximo]').forEach(el => {
  const p = proximoDevocional();
  el.innerHTML = `<span class="punto" aria-hidden="true"></span><span><strong>Próximo devocional:</strong> ${seguro(p.cuando.replace(/^Se publica /, '').replace(/^el /, ''))}</span>`;
  el.hidden = false;
});

/* ---------- Sección «Más escritos» en cada devocional ---------- */
(function () {
  const grilla = document.getElementById('escritos');
  if (!grilla) return;
  const actual = grilla.dataset.actual || '';
  const otros = DEVOCIONALES.filter(d => d.numero !== actual)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 3);
  grilla.innerHTML = tarjetaProximo(0) + otros.map((d, i) => tarjetaDevocional(d, i + 1)).join('');
  if (typeof activarRevelar === 'function') activarRevelar(grilla);
})();

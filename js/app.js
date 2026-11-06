/* ============================================================
   RUIDO ÍNTIMO — app.js
   Funciones compartidas por las dos páginas.
   Sin librerías: JavaScript simple y liviano.

   1. Tema día / noche
   2. Fechas en español
   3. Animaciones al hacer scroll
   4. Cabecera con borde + barra de progreso de lectura
   5. Compartir y copiar
   6. Lector bíblico: marcar versículos y tamaño de letra
   7. Aviso breve
   ============================================================ */

document.documentElement.classList.add('js');

/* ---------- Utilidades ---------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function guardar(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) {} }
function leer(clave)          { try { return localStorage.getItem(clave); } catch (e) { return null; } }


/* ------------------------------------------------------------
   1. TEMA DÍA / NOCHE
------------------------------------------------------------ */
function temaActual() {
  const elegido = document.documentElement.getAttribute('data-tema');
  if (elegido) return elegido;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

function actualizarBotonTema() {
  const oscuro = temaActual() === 'oscuro';
  $$('[data-tema-toggle]').forEach(btn => {
    btn.setAttribute('aria-label', oscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche');
  });
}

$$('[data-tema-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    const nuevo = temaActual() === 'oscuro' ? 'claro' : 'oscuro';
    document.documentElement.setAttribute('data-tema', nuevo);
    guardar('ri-tema', nuevo);
    actualizarBotonTema();
  });
});
actualizarBotonTema();


/* ------------------------------------------------------------
   2. FECHAS EN ESPAÑOL
   <time data-fecha="2026-10-29"> → "jueves 29 de octubre de 2026"
------------------------------------------------------------ */
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

function formatearFecha(iso, conDia) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(a, m - 1, d);
  const base = `${d} de ${MESES[m - 1]} de ${a}`;
  return conDia ? `${DIAS[f.getDay()]} ${base}` : base;
}

$$('time[data-fecha]').forEach(el => {
  el.setAttribute('datetime', el.dataset.fecha);
  el.textContent = formatearFecha(el.dataset.fecha, el.closest('.eyebrow') !== null);
});

$$('[data-anio]').forEach(el => { el.textContent = new Date().getFullYear(); });


/* ------------------------------------------------------------
   3. ANIMACIONES AL HACER SCROLL
   Agrega .visible a los elementos .revelar cuando entran en pantalla.
   Se observa una sola vez por elemento (no consume recursos después).
------------------------------------------------------------ */
const observadorRevelar = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entradas, obs) => {
      entradas.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 })
  : null;

function activarRevelar(ctx = document) {
  $$('.revelar:not(.visible)', ctx).forEach(el => {
    if (observadorRevelar) observadorRevelar.observe(el);
    else el.classList.add('visible');
  });
}
activarRevelar();


/* ------------------------------------------------------------
   4. CABECERA + BARRA DE PROGRESO
   Un solo listener de scroll, pasivo y sincronizado con
   requestAnimationFrame para no afectar el rendimiento.
------------------------------------------------------------ */
const cabecera  = $('#cabecera');
const barra     = $('#progreso-barra');
const articulo  = $('#devocional-articulo');
let esperando   = false;

function alHacerScroll() {
  const y = window.scrollY;
  if (cabecera) cabecera.classList.toggle('con-borde', y > 8);

  if (barra && articulo) {
    const r = articulo.getBoundingClientRect();
    const total = r.height - window.innerHeight * .6;
    const avance = Math.min(1, Math.max(0, (window.innerHeight * .4 - r.top) / total));
    barra.style.transform = `scaleX(${avance})`;
  }
  esperando = false;
}

window.addEventListener('scroll', () => {
  if (!esperando) { esperando = true; requestAnimationFrame(alHacerScroll); }
}, { passive: true });
alHacerScroll();


/* ------------------------------------------------------------
   5. COMPARTIR Y COPIAR
------------------------------------------------------------ */
async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    mostrarAviso('Copiado al portapapeles');
  } catch (e) {
    // Respaldo para navegadores antiguos
    const area = document.createElement('textarea');
    area.value = texto; area.setAttribute('readonly', '');
    area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    try { document.execCommand('copy'); mostrarAviso('Copiado al portapapeles'); }
    catch (err) { mostrarAviso('No se pudo copiar'); }
    area.remove();
  }
}

async function compartirTexto(texto) {
  const datos = { title: 'Ruido Íntimo', text: texto, url: location.href.split('#')[0] };
  if (navigator.share) {
    try { await navigator.share(datos); } catch (e) { /* la persona canceló */ }
  } else {
    copiarTexto(`${texto}\n${datos.url}`);
  }
}

document.addEventListener('click', e => {
  const btnCompartir = e.target.closest('[data-compartir]');
  const btnCopiar    = e.target.closest('[data-copiar]');
  if (btnCompartir) compartirTexto(btnCompartir.dataset.texto || document.title);
  if (btnCopiar)    copiarTexto(btnCopiar.dataset.texto || '');
});


/* ------------------------------------------------------------
   6. LECTOR BÍBLICO
------------------------------------------------------------ */
const lector    = $('#lector');
const seleccion = $('#seleccion');

if (lector && seleccion) {
  const libro    = lector.dataset.libro;            // "Santiago 1"
  const refEl    = $('#seleccion-ref');
  const credito  = $('#lector-credito');
  const paneles  = $$('.lector-texto[data-version]', lector);

  // Panel de la versión que se está leyendo
  const panelActivo = () => paneles.find(p => !p.hidden) || paneles[0];
  const version     = () => panelActivo().dataset.version;
  const marcados    = () => $$('.v.marcado', panelActivo());

  // "Santiago 1:12-13" o "Santiago 1:12, 15"
  function referencia(lista) {
    const nums = lista.map(v => Number(v.dataset.v)).sort((a, b) => a - b);
    const tramos = [];
    nums.forEach(n => {
      const ultimo = tramos[tramos.length - 1];
      if (ultimo && n === ultimo[1] + 1) ultimo[1] = n; else tramos.push([n, n]);
    });
    return `${libro}:` + tramos.map(([a, b]) => a === b ? a : `${a}-${b}`).join(', ');
  }

  function textoMarcado() {
    const lista = marcados();
    const texto = lista.map(v => v.textContent.replace(/^\d+/, '').trim()).join(' ');
    return `«${texto}» — ${referencia(lista)} (${version()})`;
  }

  function actualizarSeleccion() {
    const lista = marcados();
    seleccion.hidden = lista.length === 0;
    if (lista.length) refEl.textContent = `${referencia(lista)} · ${version()}`;
  }

  function limpiar() {
    $$('.v.marcado', lector).forEach(v => { v.classList.remove('marcado'); v.setAttribute('aria-pressed', 'false'); });
    actualizarSeleccion();
  }

  function alternar(v) {
    v.classList.toggle('marcado');
    v.setAttribute('aria-pressed', v.classList.contains('marcado'));
    actualizarSeleccion();
  }

  /* --- Al cambiar de versión, el lector muestra su texto y conserva lo marcado --- */
  let numerosMarcados = [];
  document.addEventListener('ri:version-antes', () => {
    numerosMarcados = marcados().map(v => v.dataset.v);
    limpiar();
  });
  document.addEventListener('ri:version', e => {
    const panel = paneles.find(p => p.dataset.version === e.detail);
    if (!panel) return;
    paneles.forEach(p => { p.hidden = p !== panel; });
    if (credito) credito.textContent = panel.dataset.credito || '';
    numerosMarcados.forEach(n => { const v = $(`.v[data-v="${n}"]`, panel); if (v) alternar(v); });
    panel.classList.remove('cambio'); void panel.offsetWidth; panel.classList.add('cambio');
  });

  /* --- Marcar versículos --- */
  lector.addEventListener('click', e => {
    const v = e.target.closest('.v');
    if (v) alternar(v);
  });
  lector.addEventListener('keydown', e => {
    const v = e.target.closest('.v');
    if (v && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); alternar(v); }
  });

  seleccion.addEventListener('click', e => {
    const accion = e.target.closest('[data-sel]')?.dataset.sel;
    if (accion === 'copiar')    copiarTexto(textoMarcado());
    if (accion === 'compartir') compartirTexto(textoMarcado());
    if (accion === 'limpiar' || accion === 'copiar') limpiar();
  });
}

/* ------------------------------------------------------------
   6b. VERSIÓN DE LA BIBLIA (RVR1960 · NBLA · NTV · PDT)
   Una sola elección controla el lector, las concordancias y el
   enlace "Leer el capítulo completo".
------------------------------------------------------------ */
const VERSIONES = ['RVR1960', 'NBLA', 'NTV', 'PDT'];

function aplicarVersion(nombre, guardarEleccion) {
  if (!VERSIONES.includes(nombre)) return;
  document.dispatchEvent(new CustomEvent('ri:version-antes'));
  $$('.version-tab').forEach(t => t.setAttribute('aria-selected', t.dataset.version === nombre));
  $$('[data-version-texto]').forEach(el => { el.hidden = el.dataset.versionTexto !== nombre; });
  $$('[data-version-nombre]').forEach(el => { el.textContent = nombre; });
  document.dispatchEvent(new CustomEvent('ri:version', { detail: nombre }));
  if (guardarEleccion) guardar('ri-version', nombre);
}

$$('.version-tab').forEach(tab => {
  tab.addEventListener('click', () => aplicarVersion(tab.dataset.version, true));
  tab.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const grupo = $$('.version-tab', tab.parentElement);
    const i = grupo.indexOf(tab);
    const sig = grupo[(i + (e.key === 'ArrowRight' ? 1 : -1) + grupo.length) % grupo.length];
    sig.focus(); sig.click();
  });
});
if ($('.version-tab')) aplicarVersion(leer('ri-version') || 'RVR1960', false);

/* Tamaño de letra para lectura (se recuerda en el navegador) */
const TAMANOS = [1, 1.0625, 1.125, 1.1875, 1.3125, 1.4375];   // en rem
const tamanoGuardado = leer('ri-tamano');
let iTamano = tamanoGuardado === null ? -1 : Number(tamanoGuardado);
if (!Number.isInteger(iTamano) || !TAMANOS[iTamano]) iTamano = -1;   // -1 = tamaño por defecto

function aplicarTamano() {
  if (iTamano >= 0) document.documentElement.style.setProperty('--tam-lectura', TAMANOS[iTamano] + 'rem');
}
aplicarTamano();

$$('[data-tamano]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (iTamano < 0) iTamano = window.innerWidth <= 720 ? 2 : 3;
    iTamano = Math.min(TAMANOS.length - 1, Math.max(0, iTamano + Number(btn.dataset.tamano)));
    aplicarTamano();
    guardar('ri-tamano', iTamano);
  });
});


/* ------------------------------------------------------------
   7. AVISO BREVE
------------------------------------------------------------ */
let temporizadorAviso;
function mostrarAviso(texto) {
  const aviso = $('#aviso');
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove('visible'), 2200);
}

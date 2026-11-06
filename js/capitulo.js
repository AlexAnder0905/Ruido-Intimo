/* ============================================================
   RUIDO ÍNTIMO — capitulo.js
   "Leer el capítulo completo" dentro del sitio.

   El texto NO está copiado en el sitio: se carga en vivo desde
   un servicio bíblico gratuito (bolls.life) en la versión que
   la persona tenga elegida, y se despliega bajo el pasaje.

   ► Para otro devocional, en index.html cambia los atributos
     del botón #capitulo-btn:
       data-libro="Santiago"   (nombre que se muestra)
       data-libro-id="59"      (número del libro: Génesis = 1 …
                                Mateo = 40, Juan = 43, Romanos = 45,
                                Hebreos = 58, Santiago = 59,
                                Apocalipsis = 66)
       data-cap="1"            (capítulo)
       data-destacar="12-15"   (versículos del pasaje del día)
   ============================================================ */

(function () {
  const btn = document.getElementById('capitulo-btn');
  const panel = document.getElementById('capitulo-panel');
  if (!btn || !panel) return;

  const lectura  = document.getElementById('capitulo-lectura');
  const aviso    = document.getElementById('capitulo-aviso');
  const credito  = document.getElementById('capitulo-credito');
  const chip     = document.getElementById('capitulo-chip');
  const accion   = btn.querySelector('.capitulo-accion');

  const libro   = btn.dataset.libro;
  const libroId = btn.dataset.libroId;
  const cap     = btn.dataset.cap;
  const [desde, hasta] = (btn.dataset.destacar || '').split('-').map(Number);

  /* Servicio que entrega el texto (JSON: [{verse, text}, …]).
     La NBLA no está disponible ahí: se muestra la LBLA, su versión
     anterior de la misma editorial, y se avisa con claridad. */
  const SERVICIO = (codigo) => `https://bolls.life/get-text/${codigo}/${libroId}/${cap}/`;
  const VERSIONES = {
    RVR1960: { codigo: 'RV1960', etiqueta: 'RVR1960', credito: 'Reina-Valera 1960 © Sociedades Bíblicas en América Latina, 1960. Renovado © Sociedades Bíblicas Unidas, 1988.' },
    NBLA:    { codigo: 'LBLA',   etiqueta: 'LBLA',    credito: 'La Biblia de las Américas (LBLA) © The Lockman Foundation.',
               aviso: 'La NBLA no está disponible para leer el capítulo completo aquí. Te mostramos la LBLA, su versión anterior de la misma editorial.' },
    NTV:     { codigo: 'NTV',    etiqueta: 'NTV',     credito: 'Nueva Traducción Viviente (NTV) © Tyndale House Foundation, 2010.' },
    PDT:     { codigo: 'PDT',    etiqueta: 'PDT',     credito: 'Palabra de Dios para Todos (PDT) © Bible League International.' }
  };

  const cache = {};
  let version = document.querySelector('.version-tab[aria-selected="true"]')?.dataset.version || 'RVR1960';
  let pedido = 0;

  // Limpia el HTML que trae el servicio (números de Strong, notas) y deja solo el texto
  function textoLimpio(html) {
    const sinExtras = String(html || '')
      .replace(/<S>.*?<\/S>/gi, '')
      .replace(/<sup[^>]*>.*?<\/sup>/gi, '');
    const doc = new DOMParser().parseFromString(sinExtras, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function enlaceExterno(v) {
    return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(libro + ' ' + cap)}&version=${v}`;
  }

  function cargando() {
    lectura.setAttribute('aria-busy', 'true');
    lectura.replaceChildren();
    for (let i = 0; i < 6; i++) {
      const linea = document.createElement('span');
      linea.className = 'capitulo-cargando';
      linea.style.width = (70 + Math.random() * 30) + '%';
      lectura.appendChild(linea);
    }
  }

  function pintar(versiculos) {
    const p = document.createElement('p');
    versiculos.forEach(v => {
      const n = Number(v.verse);
      const span = document.createElement('span');
      span.className = 'cv' + (n >= desde && n <= hasta ? ' cv-dia' : '');
      const sup = document.createElement('sup');
      sup.textContent = n;
      span.append(sup, textoLimpio(v.text) + ' ');
      p.appendChild(span);
    });
    lectura.replaceChildren(p);
    lectura.setAttribute('aria-busy', 'false');
  }

  function error() {
    lectura.setAttribute('aria-busy', 'false');
    const box = document.createElement('div');
    box.className = 'capitulo-error';
    const t = document.createElement('p');
    t.textContent = 'No pudimos cargar el capítulo en este momento. Revisa tu conexión e inténtalo de nuevo.';
    const fila = document.createElement('div');
    fila.className = 'acciones';
    const reintentar = document.createElement('button');
    reintentar.type = 'button';
    reintentar.className = 'btn btn-primario btn-sm';
    reintentar.textContent = 'Reintentar';
    reintentar.addEventListener('click', () => cargar(version));
    const afuera = document.createElement('a');
    afuera.className = 'btn btn-borde btn-sm';
    afuera.href = enlaceExterno(version);
    afuera.target = '_blank'; afuera.rel = 'noopener';
    afuera.textContent = 'Leer en BibleGateway';
    fila.append(reintentar, afuera);
    box.append(t, fila);
    lectura.replaceChildren(box);
  }

  async function cargar(v) {
    const info = VERSIONES[v] || VERSIONES.RVR1960;
    const miPedido = ++pedido;
    chip.textContent = info.etiqueta;
    credito.textContent = info.credito;
    aviso.hidden = !info.aviso;
    aviso.textContent = info.aviso || '';

    if (cache[info.codigo]) { pintar(cache[info.codigo]); return; }
    cargando();
    try {
      const control = new AbortController();
      const limite = setTimeout(() => control.abort(), 10000);
      const r = await fetch(SERVICIO(info.codigo), { signal: control.signal });
      clearTimeout(limite);
      if (!r.ok) throw new Error('respuesta ' + r.status);
      const datos = await r.json();
      if (!Array.isArray(datos) || !datos.length) throw new Error('vacío');
      cache[info.codigo] = datos;
      if (miPedido === pedido) pintar(datos);
    } catch (e) {
      if (miPedido === pedido) error();
    }
  }

  function abrir(abiertoAhora) {
    panel.hidden = !abiertoAhora;
    btn.setAttribute('aria-expanded', abiertoAhora);
    btn.classList.toggle('abierto', abiertoAhora);
    accion.textContent = abiertoAhora ? `Ocultar ${libro} ${cap}` : `Leer ${libro} ${cap} completo`;
    if (abiertoAhora) {
      cargar(version);
      panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  btn.addEventListener('click', () => abrir(panel.hidden));
  document.getElementById('capitulo-cerrar').addEventListener('click', () => { abrir(false); btn.focus(); });
  document.getElementById('capitulo-volver').addEventListener('click', () => {
    abrir(false);
    document.getElementById('pasaje').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Si cambian la versión con las pestañas, el capítulo abierto también cambia
  document.addEventListener('ri:version', e => {
    version = e.detail;
    if (!panel.hidden) cargar(version);
  });
})();

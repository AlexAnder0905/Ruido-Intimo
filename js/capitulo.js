/* ============================================================
   RUIDO ÍNTIMO — capitulo.js
   «Leer el capítulo completo» dentro de la misma caja de lectura.

   Un solo botón. Al tocarlo, el resto del capítulo aparece
   antes y después del pasaje del devocional, en el mismo texto
   y en la versión elegida. El pasaje queda marcado para no
   perderlo. Al tocar «Volver al pasaje», todo regresa a como
   estaba.

   ► Para cada devocional, en el HTML, el bloque #capitulo lleva:
       data-libro="Nehemías"   (nombre que se muestra)
       data-libro-id="16"      (número del libro: Génesis = 1 …
                                Nehemías = 16, Jeremías = 24,
                                Mateo = 40, Juan = 43, Romanos = 45,
                                Santiago = 59, Apocalipsis = 66)
       data-cap="13"           (capítulo)
       data-destacar="10-13"   (versículos del pasaje del día)
       data-total="31"         (cantidad de versículos)

   ► Texto incluido en la página (opcional, se abre sin internet):
       <script type="application/json" id="capitulo-local">
         {"PDT":[{"verse":1,"text":"…"}, …]}
       </script>
     Las versiones que no estén ahí se cargan en línea
     (/api/capitulo en el sitio publicado, o bolls.life).
   ============================================================ */

(function () {
  const caja   = document.getElementById('capitulo');
  const btn    = document.getElementById('capitulo-btn');
  const lector = document.getElementById('lector');
  if (!caja || !btn || !lector) return;

  const articulo = lector.closest('.lector');
  const estado   = document.getElementById('capitulo-estado');
  const credito  = document.getElementById('lector-credito');
  const textoBtn = btn.querySelector('.cap-btn-texto');
  const metaBtn  = btn.querySelector('.cap-btn-meta');

  const libro   = caja.dataset.libro;
  const libroId = caja.dataset.libroId;
  const cap     = caja.dataset.cap;
  const total   = caja.dataset.total;
  const [desde, hasta] = (caja.dataset.destacar || '').split('-').map(Number);

  const ETIQUETA_CERRADO = `Leer ${libro} ${cap} completo`;
  const ETIQUETA_ABIERTO = 'Volver al pasaje';
  const META_CERRADO = total ? `${total} versículos` : '';

  /* Código de cada versión en el servicio en línea.
     La NBLA completa no está disponible ahí: el contexto se
     muestra en LBLA (misma editorial) y se avisa. */
  const SERVICIO = {
    RVR1960: { codigo: 'RV1960' },
    NBLA:    { codigo: 'LBLA', nota: 'Los versículos fuera del pasaje se muestran en LBLA, la versión anterior de la NBLA, porque la NBLA completa no está disponible aquí.', credito: 'Contexto: La Biblia de las Américas (LBLA) © The Lockman Foundation.' },
    NTV:     { codigo: 'NTV' },
    PDT:     { codigo: 'PDT' }
  };
  const enServidor = /^https?:$/.test(location.protocol);
  const fuentes = (codigo) => [
    ...(enServidor ? [`/api/capitulo?v=${codigo}&libro=${libroId}&cap=${cap}`] : []),
    `https://bolls.life/get-text/${codigo}/${libroId}/${cap}/`
  ];

  const local = (() => {
    try { return JSON.parse(document.getElementById('capitulo-local')?.textContent || '{}'); }
    catch (e) { return {}; }
  })();

  const cache = {};
  let abierto = false;
  let pedido = 0;

  const panelActivo = () => lector.querySelector('.lector-texto[data-version]:not([hidden])');
  const versionActiva = () => panelActivo()?.dataset.version || 'RVR1960';
  const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function enlaceExterno(v) {
    return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(libro + ' ' + cap)}&version=${v}`;
  }

  // Limpia lo que trae el servicio (números de Strong, notas, títulos) y deja solo el texto
  function textoLimpio(html) {
    const sinExtras = String(html || '')
      .replace(/<S>.*?<\/S>/gi, '')
      .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
      .replace(/<p[^>]*>.*?<\/p>/gi, '');
    const doc = new DOMParser().parseFromString(sinExtras, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').replace(/^['"]+|['"]+$/g, '').trim();
  }

  async function versiculos(v) {
    if (Array.isArray(local[v]) && local[v].length) return local[v];
    const codigo = (SERVICIO[v] || SERVICIO.RVR1960).codigo;
    if (cache[codigo]) return cache[codigo];
    for (const url of fuentes(codigo)) {
      try {
        const control = new AbortController();
        const limite = setTimeout(() => control.abort(), 9000);
        const r = await fetch(url, { signal: control.signal });
        clearTimeout(limite);
        if (!r.ok) throw new Error('respuesta ' + r.status);
        const datos = await r.json();
        if (!Array.isArray(datos) || !datos.length) throw new Error('vacío');
        cache[codigo] = datos;
        return datos;
      } catch (e) { /* siguiente fuente */ }
    }
    throw new Error('sin fuentes');
  }

  // Un versículo de contexto se comporta igual que los del pasaje (se puede marcar y copiar)
  function spanVersiculo(n, texto) {
    const span = document.createElement('span');
    span.className = 'v';
    span.dataset.v = n;
    span.tabIndex = 0;
    span.setAttribute('role', 'button');
    span.setAttribute('aria-pressed', 'false');
    const sup = document.createElement('sup');
    sup.textContent = n;
    span.append(sup, texto);
    return span;
  }

  function parrafo(clase, lista) {
    const p = document.createElement('p');
    p.className = 'cap-contexto ' + clase;
    lista.forEach((d, i) => {
      if (i) p.append(' ');
      p.append(spanVersiculo(Number(d.verse), textoLimpio(d.text)));
    });
    return p;
  }

  function quitarContexto() {
    lector.querySelectorAll('.cap-contexto').forEach(p => p.remove());
  }

  function avisar(texto, conAcciones, v) {
    if (!estado) return;
    estado.replaceChildren();
    if (!texto) { estado.hidden = true; return; }
    estado.append(texto);
    if (conAcciones) {
      const reintentar = document.createElement('button');
      reintentar.type = 'button';
      reintentar.className = 'cap-enlace';
      reintentar.textContent = 'Reintentar';
      reintentar.addEventListener('click', () => desplegar());
      const afuera = document.createElement('a');
      afuera.className = 'cap-enlace';
      afuera.href = enlaceExterno(v);
      afuera.target = '_blank'; afuera.rel = 'noopener';
      afuera.textContent = 'Abrir en BibleGateway';
      estado.append(' ', reintentar, ' · ', afuera);
    }
    estado.hidden = false;
  }

  function actualizarCredito(v) {
    if (!credito) return;
    const base = panelActivo()?.dataset.credito || '';
    const extra = abierto && !(Array.isArray(local[v]) && local[v].length) ? (SERVICIO[v]?.credito || '') : '';
    credito.textContent = extra ? `${base} ${extra}` : base;
  }

  function etiquetas() {
    btn.setAttribute('aria-expanded', abierto);
    articulo.classList.toggle('expandido', abierto);
    textoBtn.textContent = abierto ? ETIQUETA_ABIERTO : ETIQUETA_CERRADO;
    if (metaBtn) { metaBtn.textContent = abierto ? '' : META_CERRADO; metaBtn.hidden = abierto || !META_CERRADO; }
  }

  async function desplegar() {
    const v = versionActiva();
    const panel = panelActivo();
    const miPedido = ++pedido;
    btn.disabled = true;
    btn.classList.add('cargando');
    textoBtn.textContent = 'Cargando capítulo…';
    avisar('');
    try {
      const datos = await versiculos(v);
      if (miPedido !== pedido) return;
      const clave = panel.querySelector(':scope > p:not(.cap-contexto)');
      quitarContexto();
      const antes = datos.filter(d => Number(d.verse) < desde);
      const despues = datos.filter(d => Number(d.verse) > hasta);
      if (antes.length) clave.before(parrafo('cap-antes', antes));
      if (despues.length) clave.after(parrafo('cap-despues', despues));
      abierto = true;
      etiquetas();
      actualizarCredito(v);
      const local_ = Array.isArray(local[v]) && local[v].length;
      if (!local_ && SERVICIO[v]?.nota) avisar(SERVICIO[v].nota);
      // Se mantiene el pasaje a la vista: si apareció texto arriba, la pantalla lo compensa
      if (antes.length) {
        const r = clave.getBoundingClientRect();
        if (r.top < 0 || r.top > innerHeight) clave.scrollIntoView({ block: 'start', behavior: sinMovimiento() ? 'auto' : 'smooth' });
      }
    } catch (e) {
      if (miPedido !== pedido) return;
      abierto = false;
      etiquetas();
      avisar('No pudimos cargar el capítulo en este momento.', true, v);
    } finally {
      if (miPedido === pedido) { btn.disabled = false; btn.classList.remove('cargando'); }
    }
  }

  function comprimir() {
    pedido++;
    const cabecera = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cabecera-alto')) || 72;
    const arriba = articulo.getBoundingClientRect().top;
    quitarContexto();
    abierto = false;
    etiquetas();
    avisar('');
    actualizarCredito(versionActiva());
    // Si la persona había bajado leyendo, vuelve al inicio de la lectura
    if (arriba < cabecera) {
      window.scrollTo({ top: window.scrollY + articulo.getBoundingClientRect().top - cabecera - 16, behavior: 'instant' });
    }
    btn.focus({ preventScroll: true });
  }

  btn.addEventListener('click', () => (abierto ? comprimir() : desplegar()));

  // Al cambiar de versión con el capítulo abierto, el contexto cambia a esa versión
  document.addEventListener('ri:version', () => {
    if (!abierto) { actualizarCredito(versionActiva()); return; }
    quitarContexto();
    desplegar();
  });

  etiquetas();
})();

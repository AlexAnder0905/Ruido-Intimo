/* ============================================================
   RUIDO ÍNTIMO — comentarios.js
   "¿Qué te habló Dios hoy?" — muro de testimonios.

   ► CONEXIÓN (para que todos vean los comentarios)
     Usa Supabase (gratis). Pega aquí la URL y la clave pública
     "anon" de tu proyecto. Los pasos están en LEEME.md.

   ► MIENTRAS NO ESTÉ CONECTADO
     Funciona en "modo demostración": cada persona ve solo
     sus propios comentarios, guardados en su navegador.
   ============================================================ */

const CONFIG_COMENTARIOS = {
  // Proyecto Supabase "Ruido Íntimo" (conectado el 5 de noviembre de 2026)
  supabaseUrl: 'https://hjeyqjenrpqlrghejmvo.supabase.co',
  // Clave pública "anon": es segura en el navegador, porque la base de datos
  // solo permite publicar testimonios y leer los visibles; nadie puede
  // editarlos ni borrarlos desde el sitio.
  supabaseClave: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZXlxamVucnBxbHJnaGVqbXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MTk2NjAsImV4cCI6MjEwOTQ5NTY2MH0.1RsYI0_foV1bhgwnRJZin7BIYL0qesn8zJKfbWRMHS0',
  tabla: 'comentarios',
  // false = cada testimonio se publica al instante y queda guardado.
  //         Para ocultar uno: en Supabase, tabla «comentarios», cambia
  //         «aprobado» a false. Para borrarlo: elimina la fila.
  // true  = se guardan ocultos hasta que tú los apruebes.
  // (Si lo vuelves a true, cambia también la regla en Supabase; ver LEEME.md.)
  moderacion: false
};


(function () {
  const form = document.getElementById('com-form');
  if (!form) return;

  const devocional = form.dataset.devocional;           // ej: "mateo-28-19"
  const cita       = form.dataset.cita || '';           // ej: "Mateo 28:19"
  const inNombre   = document.getElementById('com-nombre');
  const inTexto    = document.getElementById('com-texto');
  const inTrampa   = document.getElementById('com-web');
  const btnEnviar  = document.getElementById('com-enviar');
  const contador   = document.getElementById('com-contador');
  const mensaje    = document.getElementById('com-mensaje');
  const lista      = document.getElementById('com-lista');
  const vacio      = document.getElementById('com-vacio');
  const total      = document.getElementById('com-total');
  const avisoDemo  = document.getElementById('com-demo');

  const { supabaseUrl, supabaseClave, tabla, moderacion } = CONFIG_COMENTARIOS;
  const conectado = Boolean(supabaseUrl && supabaseClave);
  const CLAVE_LOCAL = 'ri-comentarios-' + devocional;
  if (!conectado) avisoDemo.hidden = false;


  /* ---------- Almacenamiento ---------- */
  const api = conectado ? {
    async listar() {
      const url = `${supabaseUrl}/rest/v1/${tabla}?select=nombre,texto,creado&devocional=eq.${encodeURIComponent(devocional)}&order=creado.desc&limit=100`;
      const r = await fetch(url, { headers: { apikey: supabaseClave, Authorization: `Bearer ${supabaseClave}` } });
      if (!r.ok) throw new Error('listar');
      return r.json();
    },
    async guardar(c) {
      const r = await fetch(`${supabaseUrl}/rest/v1/${tabla}`, {
        method: 'POST',
        headers: {
          apikey: supabaseClave,
          Authorization: `Bearer ${supabaseClave}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ devocional, nombre: c.nombre, texto: c.texto })
      });
      if (!r.ok) {
        // Los avisos de la base de datos (ráfagas, repetidos, enlaces) se muestran tal cual
        let detalle = '';
        try { const j = await r.json(); if (j && j.code === 'P0001') detalle = j.message; } catch (e) {}
        const err = new Error('guardar'); err.detalle = detalle; throw err;
      }
    }
  } : {
    async listar() {
      try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL)) || []; } catch (e) { return []; }
    },
    async guardar(c) {
      const actuales = await this.listar();
      actuales.unshift(c);
      try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(actuales.slice(0, 50))); } catch (e) {}
    }
  };


  /* ---------- Pintar la lista ---------- */
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  function fechaRelativa(iso) {
    const f = new Date(iso);
    const min = Math.round((Date.now() - f) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    return `${f.getDate()} ${MESES[f.getMonth()]}`;
  }

  function iniciales(nombre) {
    return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'A';
  }

  // Se usa textContent para que nadie pueda inyectar código
  function itemComentario(c) {
    const li = document.createElement('li');
    li.className = 'com-item';

    const avatar = document.createElement('span');
    avatar.className = 'com-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = iniciales(c.nombre);

    const cuerpo = document.createElement('div');
    const cab = document.createElement('p');
    cab.className = 'com-cab';
    const nom = document.createElement('strong');
    nom.textContent = c.nombre;
    const fecha = document.createElement('time');
    fecha.dateTime = c.creado;
    fecha.textContent = fechaRelativa(c.creado);
    cab.append(nom, fecha);

    const texto = document.createElement('p');
    texto.className = 'com-texto';
    texto.textContent = c.texto;

    const compartir = document.createElement('button');
    compartir.type = 'button';
    compartir.className = 'com-compartir';
    compartir.dataset.compartir = '';
    compartir.dataset.texto = `«${c.texto}» — ${c.nombre}, en Ruido Íntimo${cita ? ' (' + cita + ')' : ''}`;
    compartir.textContent = 'Compartir';

    cuerpo.append(cab, texto, compartir);
    li.append(avatar, cuerpo);
    return li;
  }

  function pintar(comentarios) {
    lista.replaceChildren(...comentarios.map(itemComentario));
    vacio.hidden = comentarios.length > 0;
    total.textContent = comentarios.length ? `${comentarios.length}` : '';
  }

  // Muestra el testimonio recién enviado de inmediato, sin esperar a recargar
  function agregarArriba(c) {
    const li = itemComentario(c);
    li.classList.add('com-nuevo');
    lista.prepend(li);
    vacio.hidden = true;
    total.textContent = String(lista.children.length);
  }

  async function cargar() {
    try { pintar(await api.listar()); }
    catch (e) { vacio.textContent = 'No pudimos cargar los comentarios. Intenta más tarde.'; }
  }


  /* ---------- Formulario ---------- */
  inTexto.addEventListener('input', () => {
    contador.textContent = `${inTexto.value.length} / 600`;
  });

  function avisar(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.dataset.tipo = tipo || '';
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (inTrampa.value) return;                         // bot detectado

    const texto = inTexto.value.trim().replace(/\s+\n/g, '\n');
    if (texto.length < 3) {
      avisar('Escribe lo que Dios te habló antes de compartir.', 'error');
      inTexto.focus();
      return;
    }
    const comentario = {
      nombre: inNombre.value.trim().slice(0, 40) || 'Anónimo',
      texto: texto.slice(0, 600),
      creado: new Date().toISOString()
    };

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando…';
    try {
      await api.guardar(comentario);
      form.reset();
      contador.textContent = '0 / 600';
      if (conectado && moderacion) {
        avisar('Gracias por compartir. Tu comentario aparecerá aquí cuando sea revisado.', 'ok');
      } else {
        avisar('Gracias por compartir lo que Dios te habló. Ya está publicado.', 'ok');
        agregarArriba(comentario);
        if (conectado) setTimeout(cargar, 1500);   // trae también los de otras personas
      }
    } catch (err) {
      // Los avisos de la base hablan de «testimonios»; en el sitio se dice «comentarios»
      const detalle = (err.detalle || '').replace(/testimonios/g, 'comentarios').replace(/testimonio/g, 'comentario');
      avisar(detalle || 'No se pudo enviar. Revisa tu conexión e inténtalo otra vez.', 'error');
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Quiero compartir esto';
    }
  });

  cargar();
})();

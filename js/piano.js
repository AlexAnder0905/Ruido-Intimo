/* ============================================================
   RUIDO ÍNTIMO — piano.js
   Piano de fondo para acompañar la lectura.

   Por defecto genera un piano suave en vivo con Web Audio:
   no descarga ningún archivo, no tiene derechos de autor
   y no se repite igual dos veces.

   ► Pista actual: «Conéctate» de Benjamín O’Kington
     (audio/conectate-benjamin-okington-2.mp3, recortada
     para que empiece justo en la primera nota), definida en el
     atributo data-src del reproductor en index.html.
     Para cambiarla, sube otro mp3 a /audio y cambia data-src
     y data-artista. Si data-src queda vacío, suena el piano
     generado en vivo.
   ============================================================ */

(function () {
  const caja   = document.getElementById('piano');
  if (!caja) return;

  const btnPlay  = document.getElementById('piano-play');
  const btnMute  = document.getElementById('piano-mute');
  const slider   = document.getElementById('piano-vol');
  const estadoEl = document.getElementById('piano-estado');
  const archivo  = (caja.dataset.src || '').trim();
  const artista  = (caja.dataset.artista || '').trim();
  const estadoReposo = artista || 'Instrumental suave · sin anuncios';

  let sonando = false;
  let silencio = false;
  let volumen = 40;
  try { const v = Number(localStorage.getItem('ri-piano-vol')); if (v >= 0 && v <= 100 && localStorage.getItem('ri-piano-vol') !== null) volumen = v; } catch (e) {}
  slider.value = volumen;
  pintarSlider();

  /* ---------- Volumen ---------- */
  // Curva suave: el oído percibe el volumen de forma logarítmica
  const nivel = () => silencio ? 0 : Math.pow(volumen / 100, 2) * 0.9;

  function pintarSlider() {
    slider.style.setProperty('--lleno', slider.value + '%');
  }

  slider.addEventListener('input', () => {
    volumen = Number(slider.value);
    if (volumen > 0 && silencio) alternarSilencio(false);
    pintarSlider();
    aplicarVolumen();
    try { localStorage.setItem('ri-piano-vol', volumen); } catch (e) {}
  });

  function alternarSilencio(forzar) {
    silencio = typeof forzar === 'boolean' ? forzar : !silencio;
    caja.classList.toggle('silencio', silencio);
    btnMute.setAttribute('aria-label', silencio ? 'Activar sonido' : 'Silenciar');
    aplicarVolumen();
  }
  btnMute.addEventListener('click', () => alternarSilencio());


  /* ============================================================
     MODO A: pista propia (archivo mp3)
     ============================================================ */
  let audio = null;
  if (archivo) {
    audio = new Audio(archivo);
    audio.loop = true;
    audio.preload = 'none';
    audio.setAttribute('playsinline', '');

    /* La pista está recortada para que el piano suene desde el primer
       segundo. Además, cuando el reproductor se acerca a la pantalla,
       se empieza a descargar en silencio: así, al tocar «play», suena
       al instante y no hay que esperar a que cargue. */
    const precargar = () => {
      if (audio.preload === 'auto') return;
      audio.preload = 'auto';
      try { audio.load(); } catch (e) {}
    };
    if ('IntersectionObserver' in window) {
      const vigia = new IntersectionObserver(entradas => {
        if (entradas.some(en => en.isIntersecting)) { precargar(); vigia.disconnect(); }
      }, { rootMargin: '600px 0px' });
      vigia.observe(caja);
    } else {
      precargar();
    }
    btnPlay.addEventListener('pointerenter', precargar, { once: true });
    btnPlay.addEventListener('touchstart', precargar, { once: true, passive: true });
  }

  /* El iPhone ignora audio.volume (siempre suena al 100 %).
     Por eso la pista pasa por un control de ganancia de Web Audio:
     así la barra de volumen funciona igual en iPhone, Android y computador.
     (Al abrir el sitio con doble clic, sin servidor, se usa audio.volume.) */
  let ctxPista = null, gananciaPista = null;
  function conectarPista() {
    if (ctxPista || !audio || location.protocol === 'file:') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctxPista = new AC();
      const fuente = ctxPista.createMediaElementSource(audio);
      gananciaPista = ctxPista.createGain();
      gananciaPista.gain.value = nivel() / 0.9;
      fuente.connect(gananciaPista).connect(ctxPista.destination);
    } catch (e) { ctxPista = null; gananciaPista = null; }
  }

  /* Controles del celular: pantalla bloqueada, centro de control y
     botones físicos de volumen del teléfono (que ajustan el volumen general) */
  function sesionDeMedios() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: caja.dataset.titulo || 'Piano para acompañar la lectura',
        artist: artista || 'Ruido Íntimo',
        album: 'Ruido Íntimo',
        artwork: [{ src: new URL('img/apple-touch-icon.png', location.href).href, sizes: '180x180', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => reproducir());
      navigator.mediaSession.setActionHandler('pause', () => pausar());
    } catch (e) {}
  }

  if (audio) {
    // Si se pausa o reanuda desde la pantalla bloqueada, el botón se sincroniza
    audio.addEventListener('pause', () => { if (sonando) { sonando = false; actualizarUI(); } });
    audio.addEventListener('play',  () => { if (!sonando) { sonando = true; actualizarUI(); } });
  }


  /* ============================================================
     MODO B: piano generado con Web Audio
     ============================================================ */
  let ctx, maestro, reverb, temporizador, siguienteCompas = 0, compas = 0;

  // Progresión contemplativa en Re mayor: D – Bm – G – A (con extensiones suaves)
  const ACORDES = [
    { bajo: 38, notas: [62, 66, 69, 73, 76] },   // Dmaj9
    { bajo: 35, notas: [62, 66, 69, 71, 74] },   // Bm7(add11)
    { bajo: 31, notas: [62, 67, 71, 74, 78] },   // Gmaj7
    { bajo: 33, notas: [61, 64, 69, 71, 76] }    // A6/9
  ];
  const COMPAS = 4.8;   // segundos por acorde (tempo lento)

  const frecuencia = midi => 440 * Math.pow(2, (midi - 69) / 12);

  function crearReverb(c) {
    // Reverberación "de sala" generada con ruido que se apaga
    const dur = 3.2, largo = c.sampleRate * dur;
    const imp = c.createBuffer(2, largo, c.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const d = imp.getChannelData(canal);
      for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6);
    }
    const conv = c.createConvolver();
    conv.buffer = imp;
    return conv;
  }

  function iniciarMotor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    maestro = ctx.createGain();
    maestro.gain.value = 0;

    const filtro = ctx.createBiquadFilter();        // suaviza el brillo (piano "de fieltro")
    filtro.type = 'lowpass';
    filtro.frequency.value = 2400;

    reverb = crearReverb(ctx);
    const seco = ctx.createGain();   seco.gain.value = 0.55;
    const humedo = ctx.createGain(); humedo.gain.value = 0.6;

    filtro.connect(seco).connect(maestro);
    filtro.connect(reverb).connect(humedo).connect(maestro);
    maestro.connect(ctx.destination);
    maestro.entrada = filtro;
    return true;
  }

  // Una nota de piano: armónicos con ataque rápido y caída larga
  function nota(midi, tiempo, fuerza, duracion) {
    const f = frecuencia(midi);
    const salida = ctx.createGain();
    salida.connect(maestro.entrada);

    const pico = 0.16 * fuerza * (midi < 50 ? 1.1 : 1);
    salida.gain.setValueAtTime(0.0001, tiempo);
    salida.gain.exponentialRampToValueAtTime(pico, tiempo + 0.012);
    salida.gain.exponentialRampToValueAtTime(pico * 0.35, tiempo + 0.6);
    salida.gain.exponentialRampToValueAtTime(0.0001, tiempo + duracion);

    [[1, 1, 'sine'], [2, 0.32, 'sine'], [3, 0.1, 'triangle'], [4, 0.05, 'sine']].forEach(([mult, vol, tipo]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = tipo;
      osc.frequency.value = f * mult;
      osc.detune.value = (Math.random() - 0.5) * 4;   // leve imperfección humana
      g.gain.value = vol;
      osc.connect(g).connect(salida);
      osc.start(tiempo);
      osc.stop(tiempo + duracion + 0.1);
    });
  }

  function programarCompas(inicio) {
    const acorde = ACORDES[compas % ACORDES.length];
    // Bajo y quinta al comienzo
    nota(acorde.bajo, inicio, 0.9, COMPAS * 1.6);
    nota(acorde.bajo + 12, inicio + 0.03, 0.45, COMPAS * 1.4);

    // Arpegio espacioso: algunas notas se omiten para dejar silencio
    const pasos = 6;
    for (let i = 0; i < pasos; i++) {
      if (Math.random() < 0.3 && i > 0) continue;
      const n = acorde.notas[Math.floor(Math.random() * acorde.notas.length)];
      const t = inicio + 0.35 + i * (COMPAS / pasos) + (Math.random() - 0.5) * 0.12;
      nota(n, t, 0.35 + Math.random() * 0.3, 3.6);
    }
    // De vez en cuando, una nota alta como "campana"
    if (Math.random() < 0.35) {
      const alta = acorde.notas[acorde.notas.length - 1] + 12;
      nota(alta, inicio + COMPAS * (0.5 + Math.random() * 0.3), 0.22, 4.5);
    }
    compas++;
  }

  // Programa los compases con anticipación (sin cortes aunque la pestaña vaya lenta)
  function planificador() {
    while (siguienteCompas < ctx.currentTime + 1.5) {
      programarCompas(siguienteCompas);
      siguienteCompas += COMPAS;
    }
  }


  /* ---------- Reproducir / pausar ---------- */
  function aplicarVolumen() {
    if (audio) {
      const v = Math.min(1, nivel() / 0.9);
      if (gananciaPista) {
        gananciaPista.gain.setTargetAtTime(v, ctxPista.currentTime, 0.05);
        audio.volume = 1;
      } else {
        audio.volume = v;
      }
    }
    if (ctx && maestro && sonando) {
      maestro.gain.cancelScheduledValues(ctx.currentTime);
      maestro.gain.setTargetAtTime(nivel(), ctx.currentTime, 0.15);
    }
  }

  async function reproducir() {
    if (audio) {
      estadoEl.textContent = 'Cargando…';
      conectarPista();
      if (ctxPista && ctxPista.state === 'suspended') { try { await ctxPista.resume(); } catch (e) {} }
      sesionDeMedios();
      try { await audio.play(); } catch (e) { estadoEl.textContent = 'No se pudo cargar la pista'; return; }
    } else {
      if (!ctx && !iniciarMotor()) { estadoEl.textContent = 'Tu navegador no permite audio'; return; }
      await ctx.resume();
      if (siguienteCompas < ctx.currentTime) siguienteCompas = ctx.currentTime + 0.1;
      planificador();
      temporizador = setInterval(planificador, 400);
      maestro.gain.cancelScheduledValues(ctx.currentTime);
      maestro.gain.setValueAtTime(0.0001, ctx.currentTime);
      maestro.gain.setTargetAtTime(nivel(), ctx.currentTime, 0.8);   // entrada suave
    }
    sonando = true;
    actualizarUI();
    aplicarVolumen();
  }

  function pausar() {
    sonando = false;
    if (audio) audio.pause();
    if (ctx) {
      clearInterval(temporizador);
      maestro.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);   // salida suave
      setTimeout(() => { if (!sonando) ctx.suspend(); }, 900);
    }
    actualizarUI();
  }

  function actualizarUI() {
    caja.classList.toggle('sonando', sonando);
    btnPlay.setAttribute('aria-pressed', sonando);
    btnPlay.setAttribute('aria-label', sonando ? 'Pausar piano de fondo' : 'Reproducir piano de fondo');
    estadoEl.textContent = sonando ? (artista ? `Sonando · ${artista}` : 'Sonando · acompaña tu lectura') : estadoReposo;
    document.documentElement.classList.toggle('piano-activo', sonando);
    if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = sonando ? 'playing' : 'paused'; } catch (e) {} }
  }

  btnPlay.addEventListener('click', () => (sonando ? pausar() : reproducir()));

  // Atajo: barra espaciadora sobre el reproductor no hace scroll
  caja.addEventListener('keydown', e => {
    if (e.key === ' ' && e.target === caja) { e.preventDefault(); btnPlay.click(); }
  });


  /* ---------- Mini reproductor flotante ----------
     Cuando el piano suena y el reproductor sale de pantalla,
     aparece un botón pequeño para pausar sin volver arriba. */
  const mini = document.createElement('button');
  mini.type = 'button';
  mini.className = 'piano-mini';
  mini.innerHTML = '<span class="piano-ondas" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span> Pausar piano';
  mini.addEventListener('click', pausar);
  document.body.appendChild(mini);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      mini.classList.toggle('visible', !e.isIntersecting);
    }).observe(caja);
  }
})();

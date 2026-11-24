/* ============================================================
   RUIDO ÍNTIMO — /api/ping
   Mantiene despierta la base de datos de los comentarios.

   El plan gratis de Supabase pausa el proyecto si pasa una semana
   sin actividad, y entonces el muro «¿Qué te habló Dios hoy?» deja
   de cargar. Vercel llama a esta dirección una vez al día
   (ver "crons" en vercel.json) y ella lee una fila de la tabla.

   Usa la misma URL y la misma clave pública «anon» de
   js/comentarios.js. Si las cambias allá, cámbialas aquí.
   ============================================================ */

const URL_BD = 'https://hjeyqjenrpqlrghejmvo.supabase.co';
const CLAVE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZXlxamVucnBxbHJnaGVqbXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MTk2NjAsImV4cCI6MjEwOTQ5NTY2MH0.1RsYI0_foV1bhgwnRJZin7BIYL0qesn8zJKfbWRMHS0';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const control = new AbortController();
    const limite = setTimeout(() => control.abort(), 8000);
    const r = await fetch(`${URL_BD}/rest/v1/comentarios?select=creado&limit=1`, {
      signal: control.signal,
      headers: { apikey: CLAVE_ANON, Authorization: `Bearer ${CLAVE_ANON}` }
    });
    clearTimeout(limite);
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, estado: r.status });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'sin respuesta de la base de datos' });
  }
};

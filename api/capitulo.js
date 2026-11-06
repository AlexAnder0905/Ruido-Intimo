/* ============================================================
   RUIDO ÍNTIMO — /api/capitulo
   Puente para "Leer el capítulo completo".

   El navegador le pide el capítulo a este sitio (mismo dominio)
   y esta función lo trae de bolls.life. Así funciona aunque el
   servicio bíblico bloquee pedidos directos desde otros sitios,
   y queda guardado en la caché de Vercel: el segundo lector
   lo recibe al instante.

   Uso: /api/capitulo?v=RV1960&libro=24&cap=29
   ============================================================ */

const VERSIONES = new Set(['RV1960', 'LBLA', 'NTV', 'PDT']);

module.exports = async (req, res) => {
  const { v, libro, cap } = req.query || {};
  const nLibro = Number(libro), nCap = Number(cap);

  if (!VERSIONES.has(v) || !Number.isInteger(nLibro) || nLibro < 1 || nLibro > 66 ||
      !Number.isInteger(nCap) || nCap < 1 || nCap > 150) {
    res.status(400).json({ error: 'Pedido no válido' });
    return;
  }

  try {
    const control = new AbortController();
    const limite = setTimeout(() => control.abort(), 8000);
    const r = await fetch(`https://bolls.life/get-text/${v}/${nLibro}/${nCap}/`, {
      signal: control.signal,
      headers: { 'User-Agent': 'RuidoIntimo/1.0 (+https://ruido-intimo.vercel.app)' }
    });
    clearTimeout(limite);
    if (!r.ok) throw new Error('respuesta ' + r.status);

    const datos = await r.json();
    if (!Array.isArray(datos) || !datos.length) throw new Error('vacío');

    const versiculos = datos.map(d => ({ verse: d.verse, text: d.text }));
    // El texto bíblico no cambia: se guarda un año en la caché de Vercel
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400');
    res.status(200).json(versiculos);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'No se pudo obtener el capítulo' });
  }
};

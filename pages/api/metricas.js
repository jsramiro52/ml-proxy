export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://n8n-ml-produccion-production.up.railway.app/webhook/metricas-7dias',
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (!response.ok) throw new Error('Error consultando métricas');
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(200).json({ dias: [], error: e.message });
  }
}

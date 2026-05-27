export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { q = '', limit = 50, offset = 0 } = req.query;
  const r = await fetch(`https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`);
  const data = await r.json();
  res.json(data);
}

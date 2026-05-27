module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const q = req.query.q;
  const limit = req.query.limit || 50;
  const offset = req.query.offset || 0;

  if (!q) {
    res.status(400).json({ error: 'Falta el parámetro q' });
    return;
  }

  const url = `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;
  
  const response = await fetch(url);
  const data = await response.json();
  res.status(200).json(data);
};

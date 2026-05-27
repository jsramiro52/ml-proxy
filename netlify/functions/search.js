exports.handler = async (event) => {
  const { q = '', limit = 50, offset = 0 } = event.queryStringParameters || {};

  if (!q) return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Falta el parámetro q' })
  };

  const url = `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-MX,es;q=0.9'
    }
  });
  
  const data = await res.json();

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
};

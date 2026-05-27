

exports.handler = async (event) => {
  const { q = '', limit = 50, offset = 0 } = event.queryStringParameters || {};

  if (!q) return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Falta el parámetro q' })
  };

  const url = `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const data = await res.json();

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
};

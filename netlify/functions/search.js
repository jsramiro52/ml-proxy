exports.handler = async (event) => {
  const { q = '', limit = 50, offset = 0, code = '' } = event.queryStringParameters || {};

  if (code) {
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&client_id=3842307979853353&client_secret=lRZQjSW2cdcwCalC0jswZbVCvAQz8dB2&code=${code}&redirect_uri=https://sprightly-nasturtium-0189de.netlify.app`
    });
    const tokenData = await tokenRes.json();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(tokenData)
    };
  }

  if (!q) return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Falta el parámetro q' })
  };

  const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&client_id=3842307979853353&client_secret=lRZQjSW2cdcwCalC0jswZbVCvAQz8dB2'
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  const url = `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
};

export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://n8n-ml-produccion-production.up.railway.app/webhook/coef-publicidad",
      { next: { revalidate: 300 } }
    );
    if (!response.ok) throw new Error(`n8n error ${response.status}`);
    const json = await response.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

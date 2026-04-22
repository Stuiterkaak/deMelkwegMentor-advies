export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { locatie, specialisme } = req.query;
  const query = encodeURIComponent(`advocaat ${specialisme || 'juridisch'} ${locatie}`);
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&type=lawyer&language=nl&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    const kantoren = (data.results || []).slice(0, 8).map(p => ({
      place_id: p.place_id,
      naam: p.name,
      adres: p.formatted_address,
      rating: p.rating,
      reviews: p.user_ratings_total,
      open: p.opening_hours?.open_now,
      locatie: p.geometry?.location,
    }));
    return res.status(200).json({ kantoren });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}

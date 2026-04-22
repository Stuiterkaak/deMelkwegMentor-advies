import Stripe from 'stripe';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { type, dossier_id, gebruiker_email } = req.body;
  const prijzen = { brief_email: 995, tegenreactie: 1995, jurist_verwijzing: 4995 };
  const namen = { brief_email: 'Brief per e-mail versturen', tegenreactie: 'Tegenreactie analyse & brief', jurist_verwijzing: 'Jurist verwijzing & dossier' };
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'],
      line_items: [{ price_data: { currency: 'eur', product_data: { name: namen[type], description: 'RechtsKompas Advies' }, unit_amount: prijzen[type] }, quantity: 1 }],
      mode: 'payment',
      customer_email: gebruiker_email,
      success_url: `${req.headers.origin}/betaling-geslaagd?type=${type}&dossier=${dossier_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/dossier/${dossier_id}`,
      metadata: { type, dossier_id },
    });
    return res.status(200).json({ url: session.url });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}

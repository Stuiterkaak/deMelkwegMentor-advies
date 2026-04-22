import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRIJZEN = {
  email: 995,        // €9,95
  tegenreactie: 1995, // €19,95
  jurist: 4995,      // €49,95
};

const LABELS = {
  email: 'Brief per e-mail verzenden',
  tegenreactie: 'Tegenreactie analyse & brief',
  jurist: 'Jurist verwijzing & dossier',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, dossier_id, user_email } = req.body;
  if (!type || !PRIJZEN[type]) return res.status(400).json({ error: 'Ongeldig betalingstype' });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PRIJZEN[type],
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: { type, dossier_id: dossier_id || '', user_email: user_email || '' },
      description: LABELS[type],
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { to, subject, body, from_name } = req.body;
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}` },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL, name: from_name || 'RechtsKompas Advies' },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
    });
    if (!response.ok) throw new Error(`SendGrid: ${response.status}`);
    return res.status(200).json({ success: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}

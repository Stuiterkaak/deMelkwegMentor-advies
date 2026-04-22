export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { naar, onderwerp, brief, afzender_naam, type } = req.body;
  if (!naar || !onderwerp || !brief) return res.status(400).json({ error: 'Ontbrekende velden' });

  const emailOnderwerp = type === 'jurist'
    ? `[RechtsKompas] Nieuwe zaak – ${onderwerp}`
    : `${onderwerp}`;

  const html = `
    <div style="font-family:Georgia,serif;max-width:680px;margin:0 auto;color:#1a1a2e">
      <div style="background:#0a1628;padding:20px 28px;border-bottom:3px solid #b49650">
        <span style="color:#b49650;font-size:20px;font-weight:700;letter-spacing:1px">RECHTS</span><span style="color:#ddd4bc;font-size:20px;letter-spacing:1px">KOMPAS</span>
        ${type === 'jurist' ? '<div style="color:rgba(220,210,185,.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:4px">Jurist Verwijzing</div>' : ''}
      </div>
      <div style="padding:32px 28px;background:#f9f8f5;border:1px solid #e8e0d0">
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.9;color:#2a2a3e">${brief.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      </div>
      <div style="padding:16px 28px;background:#f0ede6;border:1px solid #e8e0d0;border-top:none">
        <p style="font-size:11px;color:#888;margin:0;font-family:sans-serif">
          Verzonden via RechtsKompas Advies · rechtskompas.nl · Dit bericht is gegenereerd op verzoek van ${afzender_naam||'een gebruiker'}.
          ${type === 'jurist' ? '<br><strong>Let op:</strong> RechtsKompas ontvangt een introductievergoeding bij succesvolle intake.' : ''}
        </p>
      </div>
    </div>`;

  try {
    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@rechtskompas.nl', name: 'RechtsKompas Advies' },
        to: [{ email: naar }],
        reply_to: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@rechtskompas.nl' },
        subject: emailOnderwerp,
        html,
        text: brief,
      }),
    });

    if (!sgRes.ok) {
      const err = await sgRes.text();
      return res.status(500).json({ error: 'SendGrid fout: ' + err });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'E-mail mislukt: ' + err.message });
  }
}

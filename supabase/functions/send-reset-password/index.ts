import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { username, email } = await req.json();
  if (!username || !email) return new Response('missing params', { status: 400, headers: cors });

  const { data: token, error } = await sb.rpc('richiedi_reset_password', {
    p_username: username,
    p_email: email,
  });

  if (error || !token) {
    // Rispondiamo sempre OK per non rivelare se username/email esistono
    return new Response('ok', { headers: cors });
  }

  const resetUrl = `https://mazz-e-panel.vercel.app?reset=${token}`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Mazz e Panell <notifiche@mazzepanell.com>',
      to: email,
      subject: 'Reimposta la tua password',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2a5c3f">🏓 Mazz e Panell</h2>
        <p>Hai richiesto di reimpostare la password per l'account <strong>${username}</strong>.</p>
        <p>Clicca il pulsante qui sotto. Il link è valido per <strong>1 ora</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin-top:1rem;padding:0.6rem 1.4rem;background:#2a5c3f;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Reimposta password</a>
        <hr style="margin-top:2rem;border:none;border-top:1px solid #eee"/>
        <p style="font-size:0.75rem;color:#999">Se non hai richiesto questo reset, ignora questa email.</p>
      </div>`,
    }),
  });

  return new Response('ok', { headers: cors });
});

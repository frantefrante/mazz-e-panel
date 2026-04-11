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

  const { title, body, excludeGiocatoreId } = await req.json();

  const { data: subs } = await sb.from('email_subscriptions').select('*');
  if (!subs?.length) return new Response('ok', { headers: cors });

  const toSend = excludeGiocatoreId
    ? subs.filter(s => s.giocatore_id !== excludeGiocatoreId)
    : subs;

  await Promise.allSettled(toSend.map(sub =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mazz e Panell <notifiche@mazzepanell.com>',
        to: sub.email,
        subject: title,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#2a5c3f">🏓 Mazz e Panell</h2>
          <p>${body}</p>
          <a href="https://mazz-e-panel.vercel.app" style="display:inline-block;margin-top:1rem;padding:0.6rem 1.2rem;background:#2a5c3f;color:#fff;border-radius:6px;text-decoration:none">Vai al sito</a>
          <hr style="margin-top:2rem;border:none;border-top:1px solid #eee"/>
          <p style="font-size:0.75rem;color:#999">Per disiscriverti accedi al sito e clicca su "✉️ Notifiche email".</p>
        </div>`
      })
    })
  ));

  return new Response('ok', { headers: cors });
});

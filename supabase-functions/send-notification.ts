import webpush from 'npm:web-push';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VAPID_PUBLIC = 'BNpENlZ6La6fSb_rgc6Db17h-hT_gsqRi6pU-QY61VX8z1kWnBzPWRWLJ0hZPFkQaVPho-NfxmoHiSRM2rdMyPg';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE')!;

webpush.setVapidDetails('https://mazz-e-panel.vercel.app', VAPID_PUBLIC, VAPID_PRIVATE);

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
  const { data: subs } = await sb.from('push_subscriptions').select('*');
  if (!subs?.length) return new Response('ok', { headers: cors });

  const toSend = excludeGiocatoreId
    ? subs.filter(s => s.giocatore_id !== excludeGiocatoreId)
    : subs;

  await Promise.allSettled(toSend.map(sub =>
    webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body })
    ).catch(async (err: any) => {
      if (err.statusCode === 410) {
        await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    })
  ));

  return new Response('ok', { headers: cors });
});

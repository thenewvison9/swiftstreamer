
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '0.0.0.0';
  
  return new Response(
    JSON.stringify({
      ip: ip.split(',')[0].trim(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
});

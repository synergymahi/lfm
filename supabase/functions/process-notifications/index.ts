import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch unprocessed notifications
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notification_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;

    for (const notification of notifications || []) {
      try {
        if (notification.notification_type === 'email' && notification.email) {
          // Send email notification
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'orders@lafermedemahi.com',
              to: notification.email,
              subject: `Mise à jour de votre commande - ${notification.status}`,
              html: `<p>Votre commande #${notification.order_id} est maintenant "${notification.status}".</p>`,
            }),
          });
        }

        if (notification.notification_type === 'sms' && notification.phone_number) {
          // Send SMS notification using your preferred SMS gateway
          // Implementation depends on your SMS provider
        }

        // Mark notification as processed
        await supabaseClient
          .from('notification_queue')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', notification.id);

      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ message: 'Notifications processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
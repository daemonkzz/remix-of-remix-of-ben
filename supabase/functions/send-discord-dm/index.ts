import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not configured');
    }

    const { discord_id, message } = await req.json();

    if (!discord_id || !message) {
      return new Response(
        JSON.stringify({ error: 'discord_id and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create DM channel
    const createDmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: discord_id }),
    });

    if (!createDmRes.ok) {
      const error = await createDmRes.text();
      console.error('Create DM channel error:', error);
      throw new Error('Failed to create DM channel');
    }

    const dmChannel = await createDmRes.json();

    // Send message
    const sendRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: message }),
    });

    if (!sendRes.ok) {
      const error = await sendRes.text();
      console.error('Send message error:', error);
      throw new Error('Failed to send message');
    }

    console.log('Discord DM sent successfully to:', discord_id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Discord DM error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

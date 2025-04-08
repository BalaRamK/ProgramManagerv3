import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // More permissive during development
  'Access-Control-Allow-Headers': '*',  // Allow all headers during development
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // This is a preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
      }
    })
  }

  try {
    const { userEmail } = await req.json()

    if (!userEmail) {
      throw new Error('Email is required')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Send verification email
    const { error } = await supabaseClient.auth.admin.sendRawUserActionEmail({
      email: userEmail,
      action: 'signup',
      redirectTo: `${Deno.env.get('SITE_URL')}/auth/callback`,
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ message: 'Verification email sent successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
        },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
        },
        status: 400,
      }
    )
  }
}) 
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const { userEmail } = await req.json()

    if (!userEmail) {
      throw new Error('Email is required')
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete user from auth.users first
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userEmail,
      true // Delete by email
    )

    if (authError) {
      console.error('Auth deletion error:', authError)
      throw new Error('Failed to delete auth user')
    }

    // Then delete from pending_users
    const { error: pendingError } = await supabaseAdmin
      .from('pending_users')
      .delete()
      .eq('email', userEmail)

    if (pendingError) {
      console.error('Pending user deletion error:', pendingError)
      // Don't throw here since auth user is already deleted
    }

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 
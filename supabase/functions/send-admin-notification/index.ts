import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const { adminEmail, userEmail } = await req.json()

    if (!adminEmail || !userEmail) {
      throw new Error('Both admin email and user email are required')
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const SITE_URL = Deno.env.get('SITE_URL')
    if (!SITE_URL) {
      throw new Error('SITE_URL is not configured')
    }

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ProgramMatrix <noreply@programmatrix.com>',
        to: adminEmail,
        subject: 'New User Registration Request',
        html: `
          <h2>New User Registration Request</h2>
          <p>A new user has signed up and is awaiting your approval:</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p>Please log in to the admin dashboard to review this request:</p>
          <p><a href="${SITE_URL}/admin/verification">Review Request</a></p>
        `,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ message: 'Admin notification sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-admin-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 
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
    const { userEmail } = await req.json()

    if (!userEmail) {
      throw new Error('Email is required')
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
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
        to: userEmail,
        subject: 'Program Matrix Registration Status',
        html: `
          <h2>Program Matrix Registration Update</h2>
          <p>Thank you for your interest in Program Matrix.</p>
          <p>After reviewing your registration request, we regret to inform you that we are unable to approve your account at this time.</p>
          <p>If you believe this was in error or would like to discuss this further, please contact our support team.</p>
          <p>Best regards,<br>The Program Matrix Team</p>
        `,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ message: 'Rejection email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-rejection-email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 
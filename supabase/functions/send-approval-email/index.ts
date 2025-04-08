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

    const SITE_URL = Deno.env.get('SITE_URL') || 'https://program-matrix.vercel.app' // Fallback URL

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
        subject: 'Welcome to Program Matrix!',
        html: `
          <h2>Welcome to Program Matrix!</h2>
          <p>We are pleased to inform you that your registration request has been approved.</p>
          <p>You can now log in to your account and start managing your programs.</p>
          <p><a href="${SITE_URL}/login">Login Now</a></p> 
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The Program Matrix Team</p>
        `,
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Resend API Error Response:", errorBody);
      throw new Error(`Failed to send approval email. Status: ${res.status}`);
    }

    return new Response(
      JSON.stringify({ message: 'Approval email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-approval-email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 
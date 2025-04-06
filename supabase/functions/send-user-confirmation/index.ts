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
        subject: 'Thank You for Signing Up - Account Pending Approval',
        html: `
          <h2>Thank You for Signing Up!</h2>
          <p>Your account registration has been received and is pending admin approval.</p>
          <p>What happens next:</p>
          <ol>
            <li>Our admin team will review your registration</li>
            <li>Once approved, you'll receive another email with a verification link</li>
            <li>After verifying your email, you can log in to your account</li>
          </ol>
          <p>This process typically takes 1-2 business days. We appreciate your patience.</p>
          <p>If you have any questions, please contact our support team.</p>
        `,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ message: 'User confirmation email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-user-confirmation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 
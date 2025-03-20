import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userEmail } = await req.json()

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
        subject: 'Account Registration Status Update',
        html: `
          <h2>Account Registration Update</h2>
          <p>Thank you for your interest in ProgramMatrix.</p>
          <p>After careful review, we regret to inform you that we are unable to approve your account registration at this time.</p>
          <p>This decision may be due to various factors, including but not limited to:</p>
          <ul>
            <li>Incomplete or incorrect registration information</li>
            <li>Unable to verify provided details</li>
            <li>Account does not meet our current requirements</li>
          </ul>
          <p>If you believe this decision was made in error or if you would like to submit a new application with additional information, please contact our support team.</p>
          <p>We appreciate your understanding.</p>
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
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 
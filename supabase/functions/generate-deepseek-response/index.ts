import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key is not configured in Edge Function environment variables.')
    }

    // Extract data from the request body (adjust based on what deepseekService actually sends)
    const { query, context } = await req.json() // Assuming query and context are sent

    if (!query) {
      return new Response(JSON.stringify({ error: 'Invalid request body: query is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Prepare the payload for the DeepSeek API
    // Adapt this payload structure based on DeepSeek's requirements and your desired configuration
    const deepseekPayload = {
        model: "deepseek-chat", // Or your preferred deepseek model
        messages: [
            { role: "system", content: "You are a helpful assistant." }, // Example system prompt
            { role: "user", content: query } // Use the query from the request
            // You might want to add context information here as well
        ],
        max_tokens: 1000, // Adjust as needed
        temperature: 0.7, // Adjust as needed
    };

    // Call the DeepSeek API
    const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(deepseekPayload),
    });

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.json();
      console.error('DeepSeek API Error:', errorData);
      // Return a more specific error based on Deepseek's response
      return new Response(JSON.stringify({ error: `DeepSeek API error: ${deepseekResponse.status} - ${errorData.error?.message || JSON.stringify(errorData)}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: deepseekResponse.status,
      });
    }

    // Return the successful response from DeepSeek
    const data = await deepseekResponse.json();
    // IMPORTANT: We need to check what structure `generateDeepseekSuggestions` expects.
    // Assuming the original function expected { suggestions: [...] }
    // We might need to adapt the response here or in the calling function.
    // For now, let's return the raw Deepseek response. The frontend service might need adjustment.
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})

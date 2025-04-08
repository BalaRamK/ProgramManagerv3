// REMOVED: API Key import - This should never be in client-side code.
// const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

// REMOVED: Direct API URL - Calls will go through the Edge Function.
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Supabase Edge Function URL (Update <project-ref>)
const EDGE_FUNCTION_URL = '/functions/v1/generate-deepseek-response'; // Replace with your actual Supabase Function URL if needed

interface DeepseekResponse {
  suggestions: Array<{
    title: string;
    description: string;
    impact: {
      timeline: number;
      budget: number;
      resources: number;
    };
  }>;
}

// This function now calls the secure Edge Function instead of DeepSeek directly.
export async function generateDeepseekSuggestions(
  query: string,
  context: {
    budget: number;
    timeline: number;
    resources: any[];
    risks: any[];
  }
): Promise<DeepseekResponse> {

  // The prompt construction remains largely the same, as it dictates the expected JSON output format.
  const prompt = `You are an AI assistant helping with program management scenario analysis.
Current program context:
- Budget: ${context.budget}%
- Timeline: ${context.timeline} months
- Resources: ${JSON.stringify(context.resources)}
- Known Risks: ${JSON.stringify(context.risks)}

User query: ${query}

Analyze the scenario and provide 2-3 actionable suggestions. Format your response as a JSON object with the following structure:
{
  "suggestions": [
    {
      "title": "string",
      "description": "string",
      "impact": {
        "timeline": number (months, negative means reduction),
        "budget": number (percentage, negative means savings),
        "resources": number (percentage, negative means reduction)
      }
    }
  ]
}

Ensure that:
1. Each suggestion is specific and actionable
2. Impact values are realistic and justified by the description
3. The response is properly formatted as JSON`;

  try {
    // Call the Supabase Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, { // Use the Edge Function URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization is handled by the Edge Function now
        // We might add Supabase Auth token here later if function requires user auth
        // 'Authorization': `Bearer ${supabaseAccessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        // Send the necessary data to the Edge Function
        // The Edge function needs the prompt to pass to DeepSeek
        query: prompt, // Send the fully constructed prompt
        context: context // Send context if needed by the function (currently function uses only query)
      })
    });

    if (!response.ok) {
      // Error handling is now based on the Edge Function's response
      const errorData = await response.json(); // Assume Edge Function returns JSON error
      console.error('Edge Function Error Details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData?.error || errorData // Adapt based on function error format
      });

      // The Edge Function handles API key errors internally.
      // We just throw a generic error here if the function call fails.
      throw new Error(`Edge function error: ${response.status} - ${errorData?.error || 'Unknown error'}`);
    }

    // The Edge Function currently returns the raw DeepSeek API response.
    // We need to parse the expected JSON content from that response, similar to before.
    const deepseekRawResponse = await response.json();

    if (!deepseekRawResponse.choices || !deepseekRawResponse.choices[0] || !deepseekRawResponse.choices[0].message) {
      console.error("Invalid response format from Edge Function (expected DeepSeek format):", deepseekRawResponse);
      throw new Error('Invalid response format received from backend function.');
    }

    const content = deepseekRawResponse.choices[0].message.content;
    try {
      // Parse the JSON string embedded in the content field
      const parsedContent: DeepseekResponse = JSON.parse(content);
      if (!parsedContent.suggestions) { // Basic validation
        throw new Error('Parsed response does not contain suggestions.')
      }
      return parsedContent;
    } catch (parseError) {
      console.error('Error parsing content from Edge Function response:', content, parseError);
      throw new Error('Invalid JSON content received from backend function.');
    }
  } catch (error) {
    console.error('Error calling Edge Function for DeepSeek suggestions:', error);
    // Re-throw the error so the calling service (aiService) can handle the fallback
    throw error;
  }
} 
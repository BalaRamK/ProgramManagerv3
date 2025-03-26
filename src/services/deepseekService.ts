const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

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

export async function generateDeepseekSuggestions(
  query: string,
  context: {
    budget: number;
    timeline: number;
    resources: any[];
    risks: any[];
  }
): Promise<DeepseekResponse> {
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
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a program management AI assistant that provides scenario analysis and suggestions in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // If the API key is invalid, disable DeepSeek integration
      if (response.status === 401) {
        console.warn('Invalid DeepSeek API key - falling back to rule-based suggestions');
        throw new Error('Invalid DeepSeek API key');
      }
      
      throw new Error(`DeepSeek API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const content = data.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing DeepSeek response:', parseError);
      throw new Error('Invalid JSON response from DeepSeek API');
    }
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
} 
import { supabase } from '../lib/supabase';

// WARNING: The VITE_GEMINI_API_KEY should NEVER be exposed to the client-side.
// API calls to Gemini must be routed through a secure backend endpoint (e.g., Supabase Edge Function or Vercel Function)
// which can securely add the API key before forwarding the request.
const MODEL_NAME = 'gemini-2.0-flash';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  created_at: Date;
  user_id: string;
  context?: any;
  updated_at?: Date;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Function to get user's context data
async function getUserContext(userId: string) {
  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('user_id', userId)
    .limit(5);

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('user_id', userId)
    .limit(5);

  return {
    programs: programs || [],
    scenarios: scenarios || [],
  };
}

export async function generateResponse(messages: Message[], userId: string, context?: any): Promise<string> {
  try {
    // Call the Supabase Edge Function using the Supabase client SDK
    const { data: functionResponse, error: functionError } = await supabase.functions.invoke(
      'generate-gemini-response', // Function name
      {
        body: { // Pass data in the 'body' property
          messages: messages,
          userId: userId,
          context: context
        }
      }
    );

    if (functionError) {
      // Handle errors returned by the invoke method itself (e.g., network issues, function not found - though 404 should be caught here)
      console.error('Supabase function invoke Error:', functionError);
      throw new Error(`Failed to invoke Supabase function: ${functionError.message}`);
    }

    // The 'functionResponse' variable now holds the data returned by the Edge Function.
    // The function returns the raw Gemini response structure.
    if (!functionResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
       console.error('Invalid response format from Edge Function:', functionResponse);
       throw new Error('Received unexpected response format from the backend.');
    }

    // Extract the text like before
    return functionResponse.candidates[0].content.parts[0].text;

  } catch (error) {
    // Catch any other errors (including the ones thrown above)
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
}

export async function saveChat(chat: Chat): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .insert([chat]);

  if (error) throw error;
}

export async function loadChats(userId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateChat(chat: Chat): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .update({
      title: chat.title,
      messages: chat.messages,
      context: chat.context
    })
    .eq('id', chat.id);

  if (error) throw error;
}

export async function deleteChat(chatId: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) throw error;
} 
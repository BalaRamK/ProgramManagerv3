import { supabase } from '../lib/supabase';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

export async function generateResponse(messages: Message[], userId: string, context?: Chat['context']): Promise<string> {
  try {
    // Get user's context data
    const userContext = await getUserContext(userId);
    
    // Construct the prompt with context
    const lastMessage = messages[messages.length - 1];
    const contextPrompt = `
      You are an AI assistant for ProgramMatrix, a program management tool.
      Current user context:
      - Programs: ${JSON.stringify(userContext.programs)}
      - Scenarios: ${JSON.stringify(userContext.scenarios)}
      ${context ? `- Active Context: ${JSON.stringify(context)}` : ''}
      
      Please provide responses in a structured format when appropriate, using markdown for formatting.
      User's message: ${lastMessage.content}
    `;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: contextPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
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
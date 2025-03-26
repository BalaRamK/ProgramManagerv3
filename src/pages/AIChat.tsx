import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Send, Loader2 } from 'lucide-react';
import { generateResponse, loadChats, saveChat, updateChat, type Message, type Chat } from '../services/geminiService';

export default function AIChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats().then(setChats).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    saveChat(newChat).catch(console.error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentChat || isLoading) return;

    const updatedChat = {
      ...currentChat,
      messages: [
        ...currentChat.messages,
        { role: 'user' as const, content: input.trim() }
      ]
    };
    setCurrentChat(updatedChat);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateResponse(updatedChat.messages);
      const finalChat = {
        ...updatedChat,
        messages: [
          ...updatedChat.messages,
          { role: 'assistant' as const, content: response }
        ]
      };
      setCurrentChat(finalChat);
      await updateChat(finalChat);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col">
        <button
          onClick={createNewChat}
          className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-800 mb-4"
        >
          <PlusCircle size={20} />
          New Chat
        </button>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setCurrentChat(chat)}
              className={`w-full p-2 text-left rounded mb-2 hover:bg-gray-800 ${
                currentChat?.id === chat.id ? 'bg-gray-800' : ''
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {currentChat ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {currentChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === 'assistant' ? 'bg-white' : 'bg-blue-50'
                  } p-4 rounded-lg max-w-3xl ${
                    message.role === 'assistant' ? 'mr-auto' : 'ml-auto'
                  }`}
                >
                  {message.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat or create a new one to get started
          </div>
        )}
      </div>
    </div>
  );
} 
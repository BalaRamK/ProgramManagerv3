import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Send, Loader2, Trash2, Search, Settings, Menu, Mic, ChevronDown } from 'lucide-react';
import { generateResponse, loadChats, saveChat, updateChat, deleteChat, type Message, type Chat } from '../services/geminiService';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

export default function AIChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadChats(user.id).then(setChats).catch(error => {
          console.error('Error loading chats:', error);
          setError('Failed to load chats');
        });
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  const createNewChat = () => {
    if (!userId) return;
    
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      created_at: new Date(),
      user_id: userId,
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    saveChat(newChat).catch(error => {
      console.error('Error saving chat:', error);
      setError('Failed to create new chat');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentChat || isLoading || !userId) return;

    const newMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage]
    };
    setCurrentChat(updatedChat);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateResponse(updatedChat.messages, userId, currentChat.context);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      
      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        title: updatedChat.messages.length === 0 ? input.trim().slice(0, 30) : updatedChat.title,
      };
      setCurrentChat(finalChat);
      await updateChat(finalChat);
      
      // Update chat list with new title
      setChats(prev => prev.map(chat => 
        chat.id === finalChat.id ? finalChat : chat
      ));
    } catch (error) {
      console.error('Error generating response:', error);
      setError('Failed to generate response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
      setShowDeleteModal(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat');
    }
  };

  return (
    <div className="flex h-screen bg-[#343541]">
      {/* Sidebar */}
      <div className="w-[260px] bg-[#202123] text-gray-200 flex flex-col">
        {/* New Chat Button */}
        <div className="p-2">
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 border border-gray-600 text-sm"
          >
            <PlusCircle size={16} />
            New chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm ${
                currentChat?.id === chat.id ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              onClick={() => setCurrentChat(chat)}
            >
              <Menu size={16} />
              <span className="flex-1 truncate">{chat.title}</span>
              {currentChat?.id === chat.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatToDelete(chat.id);
                    setShowDeleteModal(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                  aria-label="Delete chat"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* User Section */}
        <div className="p-2 border-t border-gray-600">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 text-sm">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-12 border-b border-gray-600 flex items-center px-4 text-gray-200">
          <div className="flex-1">
            {currentChat ? currentChat.title : 'New Chat'}
          </div>
          <button className="p-2 hover:bg-gray-700 rounded-md" title="Chat options">
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {currentChat ? (
            <div className="max-w-3xl mx-auto py-4 px-4">
              {currentChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`py-6 ${
                    message.role === 'assistant' ? 'bg-[#444654]' : ''
                  }`}
                >
                  <div className="max-w-3xl mx-auto flex gap-6 px-4">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
                      message.role === 'assistant' ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {message.role === 'assistant' ? 'AI' : 'U'}
                    </div>
                    <div className="flex-1 text-gray-200">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                          code: ({ children }) => (
                            <code className="bg-gray-800 rounded px-1 py-0.5">{children}</code>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <h1 className="text-4xl font-bold mb-8">ProgramMatrix AI</h1>
              <div className="max-w-2xl w-full space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-6 rounded-lg border border-gray-600 hover:bg-gray-700">
                    <h2 className="text-lg font-medium mb-2">Program Analysis</h2>
                    <p className="text-sm">Get insights about your program performance and metrics</p>
                  </button>
                  <button className="p-6 rounded-lg border border-gray-600 hover:bg-gray-700">
                    <h2 className="text-lg font-medium mb-2">Risk Assessment</h2>
                    <p className="text-sm">Analyze potential risks and get mitigation strategies</p>
                  </button>
                  <button className="p-6 rounded-lg border border-gray-600 hover:bg-gray-700">
                    <h2 className="text-lg font-medium mb-2">Resource Planning</h2>
                    <p className="text-sm">Optimize resource allocation and scheduling</p>
                  </button>
                  <button className="p-6 rounded-lg border border-gray-600 hover:bg-gray-700">
                    <h2 className="text-lg font-medium mb-2">Budget Forecasting</h2>
                    <p className="text-sm">Get budget predictions and recommendations</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-600 p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message ProgramMatrix AI..."
                className="w-full bg-[#40414f] text-gray-200 rounded-lg pl-4 pr-12 py-3 focus:outline-none"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {!isLoading && (
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-600 rounded-md text-gray-400"
                    aria-label="Voice input"
                  >
                    <Mic size={20} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-1 hover:bg-gray-600 rounded-md text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </form>
            <p className="text-xs text-center text-gray-500 mt-2">
              ProgramMatrix AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#2a2b32] rounded-lg p-6 max-w-sm w-full text-gray-200">
            <h3 className="text-lg font-semibold mb-4">Delete Chat</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setChatToDelete(null);
                }}
                className="px-4 py-2 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
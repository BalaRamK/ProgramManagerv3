import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Send, Loader2, Trash2, Menu, ArrowLeft, Sparkles, Bot, User, Pencil, Check, X } from 'lucide-react';
import { generateResponse, loadChats, saveChat, updateChat, deleteChat, type Message, type Chat } from '../services/geminiService';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/ProgramMatrix_logo.png';
import { Navbar } from '../components/Navbar';

export default function AIChat() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
          navigate('/login');
          return;
        }
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          navigate('/login');
          return;
        }

        setUserId(user.id);

        // Fetch chats with proper error handling
        const { data: chats, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (chatsError) {
          if (chatsError.code === 'PGRST301' || chatsError.message.includes('JWT')) {
            navigate('/login');
            return;
          }
          throw chatsError;
        }

        setChats(chats || []);
      } catch (error: any) {
        console.error('Error checking session:', error);
        if (error.message?.includes('JWT') || error.message?.includes('token')) {
          navigate('/login');
          return;
        }
        setError('Failed to load chats. Please try refreshing the page.');
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    checkSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      // Check session before making the request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        navigate('/login');
        return;
      }

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

      // Update chat in Supabase
      const { error: updateError } = await supabase
        .from('chats')
        .update({
          title: finalChat.title,
          messages: finalChat.messages,
          context: finalChat.context
        })
        .eq('id', finalChat.id);

      if (updateError) {
        if (updateError.code === 'PGRST301' || updateError.message.includes('JWT')) {
          navigate('/login');
          return;
        }
        throw updateError;
      }

      setCurrentChat(finalChat);
      setChats(prev => prev.map(chat => 
        chat.id === finalChat.id ? finalChat : chat
      ));
    } catch (error: any) {
      console.error('Error generating response:', error);
      if (error.message?.includes('API key')) {
        setError('AI service is currently unavailable. Please try again later.');
      } else if (error.message?.includes('JWT') || error.message?.includes('token')) {
        navigate('/login');
      } else {
        setError('Failed to generate response. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      // Check session before making the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { error: deleteError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (deleteError) {
        if (deleteError.code === 'PGRST301' || deleteError.message.includes('JWT')) {
          navigate('/login');
          return;
        }
        throw deleteError;
      }

      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
      setShowDeleteModal(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat. Please try again.');
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const trimmedTitle = newTitle.trim();
      if (!trimmedTitle) return;

      const { error: updateError } = await supabase
        .from('chats')
        .update({ title: trimmedTitle })
        .eq('id', chatId);

      if (updateError) {
        if (updateError.code === 'PGRST301' || updateError.message.includes('JWT')) {
          navigate('/login');
          return;
        }
        throw updateError;
      }

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: trimmedTitle } : chat
      ));

      if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, title: trimmedTitle } : null);
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
      setError('Failed to rename chat. Please try again.');
    } finally {
      setEditingChatId(null);
      setEditingTitle('');
    }
  };

  const startEditing = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    // Focus the input after it's rendered
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  };

  // Show error message if there's an error
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="h-16 border-b border-gray-200 flex items-center px-4 bg-white">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <img 
              src={logo} 
              alt="ProgramMatrix Logo" 
              className="h-8"
            />
        </div>
            
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col shadow-sm">
          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <PlusCircle size={20} />
              <span className="font-medium">New Chat</span>
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  currentChat?.id === chat.id 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Bot size={18} className={currentChat?.id === chat.id ? 'text-blue-600' : 'text-gray-500'} />
                
                {editingChatId === chat.id ? (
                  <form 
                    className="flex-1 flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameChat(chat.id, editingTitle);
                    }}
                  >
                    <label className="sr-only" htmlFor={`chat-title-${chat.id}`}>Chat title</label>
                    <input
                      ref={editInputRef}
                      id={`chat-title-${chat.id}`}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Enter chat title"
                      className="flex-1 bg-white px-2 py-1 rounded border border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingChatId(null);
                          setEditingTitle('');
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="p-1 text-green-600 hover:text-green-700"
                      title="Save"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingChatId(null);
                        setEditingTitle('');
                      }}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <>
                    <span 
                      className="flex-1 truncate font-medium"
                      onClick={() => setCurrentChat(chat)}
                    >
                      {chat.title}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(chat);
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600"
                        title="Rename chat"
                      >
                        <Pencil size={14} />
                      </button>
                      {currentChat?.id === chat.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatToDelete(chat.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600"
                          title="Delete chat"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {currentChat ? (
              <div className="max-w-4xl mx-auto py-6 px-4">
                {currentChat.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-6 animate-fadeIn ${
                      message.role === 'assistant' 
                        ? 'bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-2xl p-4 shadow-sm' 
                        : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                        message.role === 'assistant' 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
                          : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
                      }`}>
                        {message.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                      </div>
                      <div className="flex-1">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="text-gray-700 mb-4 last:mb-0 leading-relaxed">{children}</p>,
                            code: ({ children }) => (
                              <code className="bg-gray-800 text-gray-100 px-2 py-1 rounded-md font-mono text-sm">{children}</code>
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
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-lg">
                  <Sparkles size={32} />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Welcome to ProgramMatrix AI</h1>
                <p className="text-gray-600 mb-12 text-center max-w-lg">Your intelligent assistant for program management insights and analysis</p>
                <p className="text-gray-600 mb-12 text-center max-w-lg">Click on "New Chat" or open any of your previous chats to get started</p>
                <div className="max-w-3xl w-full grid grid-cols-2 gap-6">
                  <button className="flex flex-col p-6 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group bg-white">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Program Analysis</h2>
                    <p className="text-gray-600">Get insights about your program performance and metrics</p>
                  </button>
                  <button className="flex flex-col p-6 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group bg-white">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Risk Assessment</h2>
                    <p className="text-gray-600">Analyze potential risks and get mitigation strategies</p>
                  </button>
                  <button className="flex flex-col p-6 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group bg-white">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Resource Planning</h2>
                    <p className="text-gray-600">Optimize resource allocation and scheduling</p>
                  </button>
                  <button className="flex flex-col p-6 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group bg-white">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Budget Forecasting</h2>
                    <p className="text-gray-600">Get budget predictions and recommendations</p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message ProgramMatrix AI..."
                  className="w-full px-5 py-4 pr-12 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900 shadow-sm transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <Send size={24} />
                  )}
                </button>
              </form>
              <p className="text-xs text-center text-gray-500 mt-3">
                ProgramMatrix AI can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Chat</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setChatToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200"
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
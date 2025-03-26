import React, { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Save, RefreshCw } from 'lucide-react';
import ScenarioAnalysisService from '../services/scenarioAnalysisService';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  impact: {
    timeline: number;
    budget: number;
    resources: number;
  };
  confidence: number;
  risks: string[];
}

interface ScenarioAnalysisAssistantProps {
  programContext: {
    id: string;
    budget: number;
    timeline: number;
    resources: any[];
    risks: any[];
  };
}

export function ScenarioAnalysisAssistant({ programContext }: ScenarioAnalysisAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const newSuggestions = await ScenarioAnalysisService.generateSuggestions(
        input.trim(),
        {
          budget: programContext.budget,
          timeline: programContext.timeline,
          resources: programContext.resources,
          risks: programContext.risks
        }
      );

      setSuggestions(newSuggestions);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'ve analyzed your scenario and generated some suggestions. Please review them below.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while analyzing your scenario. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScenario = async (suggestion: Suggestion) => {
    setIsSaving(true);
    try {
      console.log('Saving scenario with program ID:', programContext.id);
      console.log('Current user:', await supabase.auth.getUser());
      
      const { data: programAccess } = await supabase
        .from('programs')
        .select('id, organization_id')
        .eq('id', programContext.id)
        .single();
      
      console.log('Program access check:', programAccess);

      await ScenarioAnalysisService.saveScenario({
        program_id: programContext.id,
        title: suggestion.title,
        description: suggestion.description,
        parameter_changes: {
          timeline: suggestion.impact.timeline,
          budget: suggestion.impact.budget,
          resources: suggestion.impact.resources
        },
        predicted_outcomes: {
          timeline: suggestion.impact.timeline,
          budget: suggestion.impact.budget,
          resources: suggestion.impact.resources
        }
      });

      const savedMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Scenario "${suggestion.title}" has been saved successfully.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, savedMessage]);
    } catch (error) {
      console.error('Error saving scenario:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to save the scenario. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the conversation? This will clear all messages and suggestions.')) {
      // Clear all state
      setMessages([]);
      setSuggestions([]);
      setInput('');
      setIsLoading(false);
      setIsSaving(false);
      
      // Add a system message to indicate reset
      const resetMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Conversation has been reset. You can start a new scenario analysis.',
        timestamp: new Date()
      };
      setMessages([resetMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Scenario Analysis Assistant</h2>
        <button
          onClick={handleReset}
          className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
          title="Reset conversation"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="p-4 border-t">
          <h3 className="text-lg font-semibold mb-2">Suggested Scenarios</h3>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-gray-50 rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600">{suggestion.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveScenario(suggestion)}
                      disabled={isSaving}
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                      title="Save scenario"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                      title="Like suggestion"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                      title="Dislike suggestion"
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Timeline:</span>{' '}
                    <span className={suggestion.impact.timeline < 0 ? 'text-green-600' : 'text-red-600'}>
                      {suggestion.impact.timeline < 0 ? '+' : ''}{-suggestion.impact.timeline} months
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Budget:</span>{' '}
                    <span className={suggestion.impact.budget < 0 ? 'text-green-600' : 'text-red-600'}>
                      {suggestion.impact.budget < 0 ? '+' : ''}{-suggestion.impact.budget}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Resources:</span>{' '}
                    <span className={suggestion.impact.resources < 0 ? 'text-green-600' : 'text-red-600'}>
                      {suggestion.impact.resources < 0 ? '+' : ''}{-suggestion.impact.resources}%
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Confidence:</span>{' '}
                  {Math.round(suggestion.confidence * 100)}%
                </div>
                <div className="text-sm">
                  <span className="font-medium">Risks:</span>
                  <ul className="list-disc list-inside text-gray-600">
                    {suggestion.risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your scenario or ask for analysis..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 
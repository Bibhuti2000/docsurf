'use client';

import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatWidget = ({ editor }: { editor: Editor | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your DocSurf AI Assistant. Ask me anything about this document!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!editor) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Extract full text content from the editor
      const docContent = editor.getText();
      const chatHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docContent,
          messages: chatHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.text || 'Sorry, I got an empty response.'
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Error: Failed to fetch response from AI provider.'
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Error: Connection failed.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />;
      
      let content: React.ReactNode = line;
      if (line.includes('**')) {
        const parts = line.split('**');
        content = parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="font-semibold text-zinc-900 dark:text-zinc-100">{part}</strong> : part);
      }

      if (line.trim().startsWith('- ')) {
        return (
          <li key={i} className="ml-4 list-disc text-sm text-zinc-800 dark:text-zinc-200">
            {line.trim().slice(2)}
          </li>
        );
      }

      return <p key={i} className="text-sm leading-relaxed mb-1.5 text-zinc-800 dark:text-zinc-200">{content}</p>;
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none"
        title="Ask AI Assistant"
      >
        <Sparkles className="w-5.5 h-5.5 animate-pulse group-hover:rotate-12 transition-transform duration-300" />
      </button>

      {/* Chat Window Container */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-50 w-[340px] sm:w-[380px] h-[480px] bg-background border border-zinc-200 dark:border-zinc-850 shadow-2xl rounded-2xl flex flex-col transition-all duration-300 overflow-hidden animate-in slide-in-from-bottom-6 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white select-none">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5" />
              <span className="font-semibold text-sm tracking-wide">DocSurf AI Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border dark:border-indigo-900/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div 
                  className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm border ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-tr-none border-transparent' 
                      : 'bg-background text-foreground rounded-tl-none border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{m.content}</p>
                  ) : (
                    <div className="space-y-1">{renderMarkdown(m.content)}</div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950/60 border dark:border-purple-900/40 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border dark:border-indigo-900/40 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-background text-zinc-400 dark:text-zinc-500 rounded-2xl rounded-tl-none px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-1.5 text-xs font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Panel */}
          <form 
            onSubmit={handleSend}
            className="p-3 border-t bg-background flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this document..."
              disabled={isLoading}
              className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none px-3.5 py-2 rounded-xl transition-all disabled:opacity-50 text-foreground"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shrink-0 hover:scale-105 active:scale-95 transition-all w-9 h-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

import React, { useState } from 'react';
import { 
  Bot, Sparkles, Send, FileText, Table, AlertTriangle, 
  Key, RefreshCw, MessageSquare, CheckCircle, ChevronUp, ChevronDown 
} from 'lucide-react';

const PRESETS = [
  {
    id: 'summarize',
    label: 'Summarize Document',
    icon: FileText,
    prompt: 'Provide a concise, high-level executive summary of this document, highlighting main takeaways and key metadata.',
    color: 'from-blue-500/20 to-indigo-500/20 text-indigo-300 border-indigo-500/30'
  },
  {
    id: 'entities',
    label: 'Extract Key Entities',
    icon: Key,
    prompt: 'Extract all key entities (dates, names, addresses, reference numbers, monetary amounts) into a clean JSON key-value format.',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'table',
    label: 'Table & Line Items',
    icon: Table,
    prompt: 'Analyze all tables in the document. Summarize table headers, row counts, calculate total values, and flag any discrepancies.',
    color: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30'
  },
  {
    id: 'compliance',
    label: 'Audit & Compliance',
    icon: AlertTriangle,
    prompt: 'Perform a compliance audit. Check for missing required signature fields, dates, vendor details, or calculations.',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30'
  }
];

export default function LLMAnalyst({ markdownContext, onAskLLM, llmResponse, isLLMLoading }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Gemma 4 Multimodal Intelligence assistant (Curiosity localOCR). I have analyzed your document output. Select a preset action below or ask any question about this document!'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [expanded, setExpanded] = useState(true);

  const handleSend = async (queryText, presetIntent = null) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLLMLoading) return;

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    if (!queryText) setInputQuery('');

    // Trigger LLM call with explicit intent and markdown context
    const result = await onAskLLM(textToSend, markdownContext, presetIntent);
    
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: result || 'Successfully analyzed document context.'
      }
    ]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl shadow-2xl transition-all duration-300">
      {/* Header Bar */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="px-6 py-2.5 flex items-center justify-between cursor-pointer border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 p-0.5 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-200">Local LLM Document Intelligence</span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Qwen2.5 @ RTX 5090
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-xs">{expanded ? 'Minimize Panel' : 'Open LLM Analyst'}</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col space-y-4 max-h-[360px]">
          {/* Preset Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSend(preset.prompt, preset.id)}
                  disabled={isLLMLoading}
                  className={`p-2.5 rounded-xl border bg-gradient-to-r ${preset.color} hover:brightness-125 transition-all text-left flex items-start space-x-2.5 group disabled:opacity-50`}
                >
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-none">{preset.label}</div>
                    <div className="text-[10px] opacity-75 truncate mt-1">Run AI analysis prompt</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat / Analysis Output Stream */}
          <div className="flex-1 overflow-auto rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-3 font-sans text-xs">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex space-x-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-indigo-300" />
                  </div>
                )}
                <div 
                  className={`max-w-[82%] p-3 rounded-xl border leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500/40 rounded-tr-none' 
                      : 'bg-slate-900/90 text-slate-200 border-slate-800 rounded-tl-none font-mono whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLLMLoading && (
              <div className="flex items-center space-x-2 text-indigo-400 p-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs font-mono">Qwen2.5 LLM is reasoning over PaddleOCR markdown...</span>
              </div>
            )}
          </div>

          {/* Input Prompt Box */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask any question about this document (e.g. 'What is the payment due date and total amount?')..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isLLMLoading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-all shadow-md"
            >
              <span>Analyze</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

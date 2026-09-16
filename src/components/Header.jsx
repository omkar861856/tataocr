import React from 'react';
import { Cpu, Sparkles, Activity, FileText, Sliders } from 'lucide-react';

export default function Header({ status, activeDocName, activeView, onToggleView }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <FileText className="h-5 w-5 text-indigo-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-100 tracking-tight m-0 leading-none">
              localOCR <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">Gemma 4</span> Studio
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Gemma 4 Vision
            </span>
          </div>
          <p className="text-xs text-slate-400 m-0 mt-0.5">Vision OCR & Multimodal Intelligence (Curiosity-Ai localOCR)</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {activeDocName && activeView === 'studio' && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <span className="text-slate-500 font-mono">Active:</span>
            <span className="font-medium text-slate-200 truncate max-w-[180px]">{activeDocName}</span>
          </div>
        )}

        <button
          onClick={onToggleView}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 shadow-md ${
            activeView === 'admin'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/50 shadow-purple-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-indigo-500/50'
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-indigo-400" />
          <span>{activeView === 'admin' ? 'Studio View' : 'Admin & Autoscaling Panel'}</span>
        </button>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
          <div className="flex items-center space-x-1.5 border-r border-slate-700/60 pr-3">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">RTX 5090</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">32GB VRAM</span>
          </div>
          <div className="flex items-center space-x-1.5 pl-1">
            <Activity className={`h-3.5 w-3.5 ${status === 'online' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-xs text-slate-300 font-medium">
              {status === 'online' ? '5090 Ready' : 'Processing'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

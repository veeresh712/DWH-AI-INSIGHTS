
import React from 'react';
import { HistoryItem } from '../types';

interface SidebarProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onNewChat: () => void;
  onOpenSources: () => void;
  tableCount: number;
  dbCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  history, 
  onSelectHistory, 
  onNewChat, 
  onOpenSources, 
  tableCount,
  dbCount
}) => {
  return (
    <div className="w-72 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-10">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-500/20">I</div>
          <h1 className="text-xl font-extrabold tracking-tight">Insight Pro</h1>
        </div>

        <div className="space-y-3 mb-8">
          <button 
            onClick={onNewChat}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Analysis
          </button>
          
          <button 
            onClick={onOpenSources}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-100 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-700"
          >
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Data Sources
          </button>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">History</h2>
            <div className="space-y-1">
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm px-2 italic font-medium">No previous queries</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectHistory(item)}
                    className="w-full text-left px-3 py-3 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all truncate group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 mr-1 transition-opacity text-indigo-400">•</span>
                    {item.query}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Knowledge Graph</h2>
            <div className="space-y-2 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              <div className="text-sm text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Databases
                </span>
                <span className="font-bold text-white">{dbCount}</span>
              </div>
              <div className="text-sm text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Total Tables
                </span>
                <span className="font-bold text-white">{tableCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
            AU
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">Analyst User</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Workspace: Global Prod</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

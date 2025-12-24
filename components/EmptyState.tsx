
import React from 'react';
import { SAMPLE_QUESTIONS } from '../mockData';

interface EmptyStateProps {
  onSelectSample: (question: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onSelectSample }) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">How can I help you today?</h2>
        <p className="text-slate-500 text-lg">Ask me anything about your sales, stock, or module usage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSample(q)}
            className="group p-6 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-indigo-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example Query</span>
            </div>
            <p className="text-slate-700 font-medium group-hover:text-indigo-600 transition-colors">{q}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyState;

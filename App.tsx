
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { queryDWH } from './services/geminiService';
import { HistoryItem, InsightResult, ChartType, TableDefinition } from './types';
import Sidebar from './components/Sidebar';
import Visualizer from './components/Visualizer';
import EmptyState from './components/EmptyState';
import SchemaModal from './components/SchemaModal';

const INITIAL_TABLES: TableDefinition[] = [
  {
    id: '1',
    name: 'Sales',
    database: 'Core_DWH',
    schema: `- id (INT)\n- product_name (STRING)\n- category (STRING)\n- amount (FLOAT)\n- quantity (INT)\n- timestamp (DATE)\n- region (STRING)`
  },
  {
    id: '2',
    name: 'Inventory',
    database: 'Core_DWH',
    schema: `- product_id (INT)\n- product_name (STRING)\n- stock_available (INT)\n- warehouse_location (STRING)\n- min_threshold (INT)`
  },
  {
    id: '3',
    name: 'UsageLogs',
    database: 'Monitoring',
    schema: `- user_id (INT)\n- module_name (STRING)\n- duration_seconds (INT)\n- status (STRING: success, fail)\n- timestamp (DATE)`
  }
];

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<InsightResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [tables, setTables] = useState<TableDefinition[]>(() => {
    const saved = localStorage.getItem('dwh_tables_v2');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('dwh_tables_v2', JSON.stringify(tables));
  }, [tables]);

  const fullSchemaString = useMemo(() => {
    const groupedByDb = tables.reduce((acc, table) => {
      if (!acc[table.database]) acc[table.database] = [];
      acc[table.database].push(table);
      return acc;
    }, {} as Record<string, TableDefinition[]>);

    // Fix: Explicitly cast Object.entries to ensure 'tbls' is not inferred as 'unknown'
    const tablesText = (Object.entries(groupedByDb) as [string, TableDefinition[]][]).map(([db, tbls]) => 
      `DATABASE: ${db}\n${tbls.map(t => `  TABLE: ${t.name}\n${t.schema.split('\n').map(l => `    ${l}`).join('\n')}`).join('\n\n')}`
    ).join('\n\n');

    return `
      ENVIRONMENT SCHEMA:
      ${tablesText}

      CONTEXT:
      Today's date is 2024-05-20.
      Primary Currency: USD.
      Top selling product is "Cloud Engine X".
      Stock alert: "Edge Router v2" is below threshold (5 units left).
      Overall usage trend is up 12% from last month.
    `;
  }, [tables]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (currentResult) {
      scrollToBottom();
    }
  }, [currentResult]);

  const handleAnalyze = useCallback(async (textQuery: string) => {
    if (!textQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setActiveQuery(textQuery);

    try {
      const result = await queryDWH(textQuery, fullSchemaString);
      setCurrentResult(result);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        query: textQuery,
        result: result,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newHistoryItem, ...prev]);
      setQuery('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong while analyzing the data.');
    } finally {
      setLoading(false);
    }
  }, [fullSchemaString]);

  const handleNewChat = () => {
    setCurrentResult(null);
    setActiveQuery(null);
    setQuery('');
    setError(null);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setActiveQuery(item.query);
    setCurrentResult(item.result);
    setError(null);
  };

  const handleAddTable = (table: TableDefinition) => {
    setTables(prev => [...prev, table]);
  };

  const handleUpdateTable = (updatedTable: TableDefinition) => {
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
  };

  const handleRemoveTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
  };

  const dbCount = useMemo(() => new Set(tables.map(t => t.database)).size, [tables]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar 
        history={history} 
        onSelectHistory={handleSelectHistory}
        onNewChat={handleNewChat}
        onOpenSources={() => setIsSchemaModalOpen(true)}
        tableCount={tables.length}
        dbCount={dbCount}
      />

      <main className="flex-1 ml-72 flex flex-col relative">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Insight Explorer</h2>
            {activeQuery && <span className="text-slate-400 mx-2">/</span>}
            {activeQuery && <span className="text-slate-500 font-medium truncate max-w-md">"{activeQuery}"</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Engine
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-32">
          {!activeQuery && !loading ? (
            <EmptyState onSelectSample={handleAnalyze} />
          ) : (
            <div className="max-w-4xl mx-auto p-8 space-y-8">
              {activeQuery && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="bg-slate-100 rounded-2xl px-6 py-4 max-w-[80%]">
                    <p className="text-slate-800 font-medium">{activeQuery}</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-6 h-6 bg-indigo-200 rounded-full"></div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-[200px] bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3">
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{error}</p>
                </div>
              )}

              {currentResult && !loading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-indigo-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="space-y-6 flex-1">
                    {currentResult.metadata && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentResult.metadata.total !== undefined && (
                          <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Impact</p>
                            <div className="flex items-end gap-3">
                              <h3 className="text-3xl font-extrabold text-slate-900">{currentResult.metadata.total.toLocaleString()}</h3>
                              {currentResult.metadata.delta && (
                                <span className={`text-sm font-bold flex items-center gap-1 mb-1 ${
                                  currentResult.metadata.trend === 'up' ? 'text-green-500' : 
                                  currentResult.metadata.trend === 'down' ? 'text-red-500' : 'text-slate-400'
                                }`}>
                                  {currentResult.metadata.trend === 'up' ? '↑' : currentResult.metadata.trend === 'down' ? '↓' : ''} 
                                  {currentResult.metadata.delta}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-lg text-slate-700 leading-relaxed bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      {currentResult.answer}
                    </div>

                    {currentResult.chartType !== ChartType.NONE && currentResult.data && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-slate-800 tracking-tight">Data Visualization</h4>
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold uppercase">{currentResult.chartType} CHART</span>
                        </div>
                        <Visualizer type={currentResult.chartType} data={currentResult.data} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-72 right-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-10 pb-8 px-8 z-20">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyze(query);
            }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about sales, stock levels, or cross-database analytics..."
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-5 pr-16 focus:outline-none focus:border-indigo-500 transition-all text-lg shadow-xl shadow-slate-200/50 group-hover:border-slate-300"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center mt-3 text-slate-400 text-xs font-medium uppercase tracking-widest">
              Enterprise AI Data Assistant
            </p>
          </form>
        </div>
      </main>

      <SchemaModal 
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        tables={tables}
        onAddTable={handleAddTable}
        onUpdateTable={handleUpdateTable}
        onRemoveTable={handleRemoveTable}
      />
    </div>
  );
};

export default App;

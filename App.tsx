
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { queryDWH } from './services/geminiService';
import { HistoryItem, InsightResult, ChartType, TableDefinition, DataPoint } from './types';
import Sidebar from './components/Sidebar';
import Visualizer from './components/Visualizer';
import EmptyState from './components/EmptyState';
import SchemaModal from './components/SchemaModal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const INITIAL_TABLES: TableDefinition[] = [
  {
    id: '1',
    name: 'Sales',
    database: 'Core_DWH',
    schema: `- id (INT)\n- product_name (STRING)\n- category (STRING)\n- amount (FLOAT)\n- quantity (INT)\n- timestamp (DATE)\n- region (STRING)`,
    type: 'manual'
  },
  {
    id: '2',
    name: 'Inventory',
    database: 'Core_DWH',
    schema: `- product_id (INT)\n- product_name (STRING)\n- stock_available (INT)\n- warehouse_location (STRING)\n- min_threshold (INT)`,
    type: 'manual'
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
    const saved = localStorage.getItem('dwh_tables_v3');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('dwh_tables_v3', JSON.stringify(tables));
  }, [tables]);

  const fullSchemaString = useMemo(() => {
    const groupedByDb = tables.reduce((acc, table) => {
      if (!acc[table.database]) acc[table.database] = [];
      acc[table.database].push(table);
      return acc;
    }, {} as Record<string, TableDefinition[]>);

    const tablesText = (Object.entries(groupedByDb) as [string, TableDefinition[]][]).map(([db, tbls]) => 
      `DATABASE: ${db}\n${tbls.map(t => `  TABLE: ${t.name} (Source: ${t.type})\n${t.schema.split('\n').map(l => `    ${l}`).join('\n')}`).join('\n\n')}`
    ).join('\n\n');

    return `ENVIRONMENT SCHEMA:\n${tablesText}\n\nCONTEXT: Today is 2024-05-20. USD is local currency.`;
  }, [tables]);

  const handleAnalyze = useCallback(async (textQuery: string) => {
    if (!textQuery.trim()) return;
    setLoading(true);
    setError(null);
    setActiveQuery(textQuery);
    try {
      const result = await queryDWH(textQuery, fullSchemaString);
      setCurrentResult(result);
      setHistory(prev => [{ id: Date.now().toString(), query: textQuery, result, timestamp: Date.now() }, ...prev]);
      setQuery('');
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }, [fullSchemaString]);

  const exportCSV = (data: DataPoint[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Insight_Data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = (data: DataPoint[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Insight Data");
    XLSX.writeFile(workbook, `Insight_Report_${Date.now()}.xlsx`);
  };

  const exportPDF = async () => {
    if (!resultRef.current) return;
    const canvas = await html2canvas(resultRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Dashboard_Report_${Date.now()}.pdf`);
  };

  const dbCount = useMemo(() => new Set(tables.map(t => t.database)).size, [tables]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar 
        history={history} 
        onSelectHistory={(item) => { setActiveQuery(item.query); setCurrentResult(item.result); }}
        onNewChat={() => { setCurrentResult(null); setActiveQuery(null); setQuery(''); }}
        onOpenSources={() => setIsSchemaModalOpen(true)}
        tableCount={tables.length}
        dbCount={dbCount}
      />

      <main className="flex-1 ml-72 flex flex-col relative">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Insight Explorer</h2>
            {activeQuery && <span className="text-slate-400 font-medium truncate max-w-md ml-4 text-sm bg-slate-100 px-3 py-1 rounded-lg">"{activeQuery}"</span>}
          </div>
          <div className="flex items-center gap-3">
             {currentResult && (
               <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={exportPDF} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 font-bold text-xs uppercase flex items-center gap-1">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                   Dashboard (PDF)
                 </button>
                 <button onClick={() => exportExcel(currentResult.data || [])} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 font-bold text-xs uppercase flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Data (Excel)
                 </button>
               </div>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-32">
          {!activeQuery && !loading ? (
            <EmptyState onSelectSample={handleAnalyze} />
          ) : (
            <div ref={resultRef} className="max-w-4xl mx-auto p-8 space-y-8 bg-slate-50">
              {/* Question */}
              {activeQuery && (
                <div className="flex gap-4 no-print">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm"><p className="text-slate-800 font-medium">{activeQuery}</p></div>
                </div>
              )}

              {loading && <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-4 bg-slate-200 rounded w-3/4"></div><div className="h-[300px] bg-slate-200 rounded-3xl w-full"></div></div>}

              {currentResult && !loading && (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                    <div className="flex-1 space-y-6">
                      {currentResult.metadata?.total && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Impact Metric</p>
                           <h3 className="text-4xl font-black text-slate-900">{currentResult.metadata.total.toLocaleString()}</h3>
                        </div>
                      )}
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-lg text-slate-700 leading-relaxed prose max-w-none">
                        {currentResult.answer}
                      </div>
                      {currentResult.chartType !== ChartType.NONE && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                             Intelligence Dashboard
                          </h4>
                          <Visualizer type={currentResult.chartType} data={currentResult.data || []} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-72 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-8 px-8 z-20 no-print">
          <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(query); }} className="max-w-4xl mx-auto">
            <div className="relative group shadow-2xl rounded-3xl overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query your DWH or imported files..."
                className="w-full bg-white px-8 py-6 pr-20 focus:outline-none text-lg"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !query.trim()} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 shadow-lg">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
              </button>
            </div>
          </form>
        </div>
      </main>

      <SchemaModal 
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        tables={tables}
        onAddTable={(t) => setTables(p => [...p, t])}
        onUpdateTable={(t) => setTables(p => p.map(x => x.id === t.id ? t : x))}
        onRemoveTable={(id) => setTables(p => p.filter(x => x.id !== id))}
      />
    </div>
  );
};

export default App;

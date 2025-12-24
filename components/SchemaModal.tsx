
import React, { useState, useMemo, useRef } from 'react';
import { TableDefinition } from '../types';
import * as XLSX from 'xlsx';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableDefinition[];
  onAddTable: (table: TableDefinition) => void;
  onUpdateTable: (table: TableDefinition) => void;
  onRemoveTable: (id: string) => void;
}

const SchemaModal: React.FC<SchemaModalProps> = ({ 
  isOpen, 
  onClose, 
  tables, 
  onAddTable, 
  onUpdateTable, 
  onRemoveTable 
}) => {
  const [mode, setMode] = useState<'list' | 'edit' | 'add'>('list');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [name, setName] = useState('');
  const [database, setDatabase] = useState('');
  const [schema, setSchema] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groupedTables = useMemo(() => {
    return tables.reduce((acc, table) => {
      if (!acc[table.database]) acc[table.database] = [];
      acc[table.database].push(table);
      return acc;
    }, {} as Record<string, TableDefinition[]>);
  }, [tables]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setName('');
    setDatabase('');
    setSchema('');
    setMode('add');
  };

  const handleStartEdit = (table: TableDefinition) => {
    setEditingTableId(table.id);
    setName(table.name);
    setDatabase(table.database);
    setSchema(table.schema);
    setMode('edit');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (data.length > 0) {
          const headers = data[0] as string[];
          const sampleRow = data[1] as any[];
          
          let inferredSchema = '';
          headers.forEach((h, i) => {
            const val = sampleRow ? sampleRow[i] : null;
            const type = typeof val === 'number' ? 'NUMBER' : typeof val === 'boolean' ? 'BOOLEAN' : 'STRING';
            inferredSchema += `- ${h} (${type})\n`;
          });

          setName(file.name.split('.')[0]);
          setDatabase('Imported_Files');
          setSchema(inferredSchema);
          setMode('add');
        }
      } catch (err) {
        alert("Failed to parse file. Please ensure it's a valid CSV or Excel file.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !database || !schema) return;

    if (mode === 'add') {
      onAddTable({
        id: Date.now().toString(),
        name,
        database,
        schema,
        type: database === 'Imported_Files' ? 'file' : 'manual'
      });
    } else if (mode === 'edit' && editingTableId) {
      const existing = tables.find(t => t.id === editingTableId);
      onUpdateTable({
        id: editingTableId,
        name,
        database,
        schema,
        type: existing?.type || 'manual'
      });
    }

    setMode('list');
    setEditingTableId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {mode === 'list' ? 'Data Sources' : mode === 'add' ? 'New Source' : 'Edit Source'}
            </h2>
            <p className="text-slate-500 text-sm">
              Manage databases and file imports
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {mode === 'list' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleStartAdd}
                  className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 border-dashed rounded-3xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-700">Add Table</p>
                    <p className="text-xs text-slate-400">Define manual schema</p>
                  </div>
                </button>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 border-dashed rounded-3xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
                >
                  <div className={`w-12 h-12 ${isImporting ? 'animate-pulse bg-slate-100' : 'bg-emerald-100 text-emerald-600'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-700">{isImporting ? 'Parsing...' : 'Import File'}</p>
                    <p className="text-xs text-slate-400">CSV, Excel, Text</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.xlsx,.xls,.txt" 
                    onChange={handleFileUpload}
                  />
                </button>
              </div>

              {(Object.entries(groupedTables) as [string, TableDefinition[]][]).map(([dbName, tbls]) => (
                <div key={dbName} className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{dbName}</h4>
                  </div>
                  <div className="grid gap-3">
                    {tbls.map(table => (
                      <div key={table.id} className="group bg-white p-4 border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${table.type === 'file' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} rounded-lg flex items-center justify-center`}>
                              {table.type === 'file' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                              )}
                            </div>
                            <span className="font-bold text-slate-800">{table.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleStartEdit(table)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => onRemoveTable(table.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Database/Group</label>
                  <input 
                    type="text" 
                    value={database}
                    onChange={e => setDatabase(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 transition-all text-sm shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Table Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 transition-all text-sm shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Schema Definition</label>
                <textarea 
                  value={schema}
                  onChange={e => setSchema(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-4 py-4 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md py-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200">
                  {mode === 'add' ? 'Add Table' : 'Update Table'}
                </button>
                <button type="button" onClick={() => setMode('list')} className="px-6 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaModal;

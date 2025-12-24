
import React, { useState, useMemo } from 'react';
import { TableDefinition } from '../types';

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
  
  const [name, setName] = useState('');
  const [database, setDatabase] = useState('');
  const [schema, setSchema] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !database || !schema) return;

    if (mode === 'add') {
      onAddTable({
        id: Date.now().toString(),
        name,
        database,
        schema
      });
    } else if (mode === 'edit' && editingTableId) {
      onUpdateTable({
        id: editingTableId,
        name,
        database,
        schema
      });
    }

    setMode('list');
    setEditingTableId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {mode === 'list' ? 'Data Sources' : mode === 'add' ? 'New Table Source' : 'Edit Table Source'}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === 'list' ? 'Define schemas for databases and tables' : 'Configure columns and metadata'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {mode === 'list' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Loaded Tables ({tables.length})</h3>
                <button 
                  onClick={handleStartAdd}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Source
                </button>
              </div>

              {tables.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-400">No tables loaded. Add one to start analyzing data.</p>
                </div>
              ) : (
                // Fix: Explicitly cast Object.entries to ensure 'tbls' is not inferred as 'unknown'
                (Object.entries(groupedTables) as [string, TableDefinition[]][]).map(([dbName, tbls]) => (
                  <div key={dbName} className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                      <h4 className="text-sm font-bold text-slate-700">{dbName}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Database</span>
                    </div>
                    <div className="grid gap-3">
                      {tbls.map(table => (
                        <div key={table.id} className="group bg-white p-4 border border-slate-200 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">{table.name}</span>
                                <p className="text-[10px] text-slate-400 font-mono">ID: {table.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStartEdit(table)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit Schema"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => onRemoveTable(table.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Table"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Database Name</label>
                  <input 
                    type="text" 
                    value={database}
                    onChange={e => setDatabase(e.target.value)}
                    placeholder="e.g. Sales_Production"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Table Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Transactions"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Schema Definition</label>
                <div className="relative">
                  <textarea 
                    value={schema}
                    onChange={e => setSchema(e.target.value)}
                    placeholder="- column_name (TYPE)&#10;- description (STRING)"
                    rows={10}
                    className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-4 py-4 focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed"
                    required
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    MARKDOWN / YAML
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400 italic">Be descriptive! The AI uses these definitions to understand your business logic.</p>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md py-4">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200"
                >
                  {mode === 'add' ? 'Add Table Source' : 'Update Source'}
                </button>
                <button 
                  type="button"
                  onClick={() => { setMode('list'); setEditingTableId(null); }}
                  className="px-6 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold transition-all hover:bg-slate-50"
                >
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


export interface DataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

export enum ChartType {
  BAR = 'BAR',
  LINE = 'LINE',
  PIE = 'PIE',
  AREA = 'AREA',
  SCATTER = 'SCATTER',
  NONE = 'NONE'
}

export interface InsightResult {
  answer: string;
  data?: DataPoint[];
  chartType: ChartType;
  metadata?: {
    total?: number;
    delta?: string;
    trend?: 'up' | 'down' | 'neutral';
  };
  tablesUsed?: string[];
}

export interface HistoryItem {
  id: string;
  query: string;
  result: InsightResult;
  timestamp: number;
}

export interface TableDefinition {
  id: string;
  name: string;
  database: string;
  schema: string;
}

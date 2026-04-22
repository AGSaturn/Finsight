export interface FinancialData {
  company: string;
  ticker: string;
  period: string;
  content: string;
  sections: { title: string; id: string }[];
}

export interface Note {
  id: string;
  fileId: string;
  text: string;
  selection: string;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

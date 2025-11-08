// src/lib/types/query.ts
// Core types and interfaces for the Query & Synthesis Engine

export interface Citation {
  source: string;
  url: string;
  title?: string;
  relevance: number; // 0-1 score
}

export interface QueryRequest {
  query: string;
  sourceIds?: string[];
  limit?: number;
}

export interface SynthesizedResult {
  id: string;
  query: string;
  synthesis: string;
  citations: Citation[];
  confidence: number; // 0-1 score
  timestamp: Date;
  processingTimeMs: number;
}

export interface QueryHistoryRecord {
  id: string;
  userId: string;
  query: string;
  synthesis: string;
  citations: Citation[];
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryResponse {
  success: boolean;
  data?: SynthesizedResult;
  error?: string;
  timestamp: Date;
}

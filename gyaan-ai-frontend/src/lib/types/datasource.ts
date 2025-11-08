// Purpose: Types for managing user data source connections

export interface DataSourceConfig {
  endpoint?: string;
  // NOTE: In a real system, apiKey/dbConnection would be encrypted outside of this client type.
  // Here, we treat them as configuration strings for the manager.
  apiKey?: string; 
  dbConnection?: string; 
  filePath?: string;
  headers?: Record<string, string>;
}

export interface DataSource {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  type: 'api' | 'database' | 'file' | 'web';
  config: DataSourceConfig;
  isPrivate: boolean; // Determines if only the user can query it
  isActive: boolean; // Can be toggled on/off by the user
  lastTested: Date;
  testStatus: 'success' | 'failed' | 'pending';
  createdAt: Date;
}

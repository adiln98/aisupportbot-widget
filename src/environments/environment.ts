export const environment = {
  production: false,
  
  // API URLs
  apiUrl: 'http://localhost:8000/api/agent/query',
  docsUrl: 'http://localhost:8000/api/documents',
  parentOrigin: 'http://localhost:4200',

  
  // Basic settings
  retryAttempts: 3,
  timeout: 30000,
  
  // Logging
  enableLogging: true
}; 
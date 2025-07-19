export const environment = {
  production: false,

  // API URLs
  apiUrl: 'http://localhost:8000/api/agent/query',
  docsUrl: 'http://localhost:8000/api/documents',
  docsKeywordSearchUrl: 'http://localhost:8000/api/documents/search-by-keywords',
  parentOrigin: 'http://localhost:4200',


  // Basic settings
  retryAttempts: 3,
  timeout: 30000,

  // Logging
  enableLogging: true
};

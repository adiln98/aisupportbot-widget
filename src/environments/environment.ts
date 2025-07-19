export const environment = {
  production: false,

  // API URLs
  apiUrl: 'http://localhost:8000/api/agent/query',
  docsUrl: 'http://localhost:8000/api/documents',
  docsKeywordSearchUrl: 'http://localhost:8000/api/documents/search-by-keywords',
  docNowPlatformUrl: 'http://localhost:4200',

  // Widget URLs
  widgetUrl: 'http://localhost:3100/browser/',
  widgetOrigin: 'http://localhost:3100',

  // Basic settings
  retryAttempts: 3,
  timeout: 30000,

  // Logging
  enableLogging: true
};

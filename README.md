# Chatbot Widget

A simple Angular chatbot widget that can be embedded in any website. This widget communicates with a backend API and supports JWT authentication.


## Project Structure

```
chatbot-widget/
├── src/
│   ├── app/chatbot/          # Main chatbot component
│   │   ├── chatbot.ts        # Component logic
│   │   ├── chatbot.html      # Template
│   │   ├── chatbot.scss      # Styles
│   │   └── chatbotservice.ts # API service
│   ├── environments/         # Environment configuration
│   │   ├── environment.ts    # Development
│   │   ├── environment.prod.ts # Production
│   │   
│   └── assets/              # Images and static files
```

## Environment Configuration

The widget uses different environment files for different deployment stages:

### Development
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/agent/query',
  parentOrigin: 'http://localhost:4200',
  retryAttempts: 3,
  timeout: 30000
};
```

### Production

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '',
  parentOrigin: 'https://docnow.com',
  retryAttempts: 2,
  timeout: 20000
};
```

## Development

### Prerequisites
- Node.js (v18 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Installation
```bash
npm install
```

### Start Development Server
```bash
ng serve or npm start
```
Navigate to `http://localhost:3000/` to see the widget.

## Building

### Development Build
```bash
ng build
```

### Production Build
```bash
ng build --configuration=production
npx serve dist/chatbot-widget/browser --single
```


##################### Integration

### 1. Build the Widget
```bash
ng build --configuration=production
```

### 2. Copy Build Files
Copy the contents of `dist/chatbot-widget/browser/` to your web server.

### 3. Include in Your Website of Parent Company Code
```html
<!-- Add this to your HTML -->
<script src=""></script>
```

### 4. Send Messages to Widget
```javascript
// Send page context
window.postMessage({
  type: 'PAGE_CONTEXT',
  page_context: 'I am on the pricing page'
}, 'https://your-domain.com');

// Send access token
window.postMessage({
  type: 'ACCESS_TOKEN',
  accessToken: 'your-jwt-token'
}, 'https://your-domain.com');
```

## Configuration


### Widget Settings
- **Position**: Bottom-right corner
- **Size**: 400px width, 600px height
- **Theme**: Light mode (configurable)
- **Z-index**: 9999

## API Communication

The widget sends POST requests to the configured API endpoint with:

```typescript
{
  query: string,
  n_results: number,
  conversation_id: string | null,
  access_token: string | null,
  page_context: string | null
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your API allows requests from the widget domain
2. **Authentication**: Make sure JWT tokens are valid and not expired
3. **Build Errors**: Check that all environment files are properly configured

### Debug Mode
Enable debug logging by setting `enableDebug: true` in environment files.

## Customization

### Styling
Edit `src/app/chatbot/chatbot.scss` to customize the widget appearance.

### Configuration
Modify environment files to change API endpoints, timeouts, and other settings.

### Features
Add new features by extending the `ChatbotService` and `ChatbotComponent`.

## License

This project is part of the DocNow platform integration.
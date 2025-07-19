# Chatbot Widget

## 🚀 Quick Start

### Development
```bash
npm install
npm start
```
**Access**: `http://localhost:3100/`

### Production
```bash
npm run build:prod
npx serve dist/chatbot-widget/browser --single
```

## ⚙️ Environment Configuration

### Development (`src/environments/environment.ts`)

### Production (`src/environments/environment.prod.ts`)

```

## 🔗 Integration

### 1. Build
```bash
# Development
npm run build

# Production
npm run build:prod
```

### 2. Include in Website
```html
<!-- Development -->
<script src="http://localhost:3100/loader.js"></script>

<!-- Production -->
<script src="https://widget.doctornow.io/loader.js"></script>
```

## 🐛 Troubleshooting

- **CORS Errors**: Check API domain settings
- **Build Errors**: Verify environment configuration
- **URL Issues**: Ensure `loader.js` has correct URLs (not placeholders)

## 📄 License

Part of the DocNow platform integration.
# Removing Replit Dependencies

This document provides step-by-step instructions on how to remove Replit-specific dependencies from your project for deployment on any platform.

## Automated Removal

The project includes a script that automates the process of removing Replit dependencies and preparing the project for external deployment:

```bash
# On Linux/Mac
node scripts/prepare-for-external.js

# On Windows
node scripts\prepare-for-external.js
```

This script will:
1. Backup the original Vite configuration
2. Create a new Vite config without Replit dependencies
3. Set up environment variables
4. Add custom theme handling
5. Add custom error handling
6. Create platform-specific startup scripts

## Manual Removal Process

If you prefer to remove Replit dependencies manually, follow these steps:

### 1. Remove Replit-specific packages

```bash
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-shadcn-theme-json
```

### 2. Replace Vite Configuration

Create a new `vite.config.ts` file:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

### 3. Setup Environment Variables

Install dotenv:

```bash
npm install dotenv
```

Create a `.env` file based on the provided `.env.example`:

```
# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_secure_session_secret

# Google Sheets API (if using)
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_MENU_SPREADSHEET_ID=your_menu_spreadsheet_id
VITE_TOURISM_SPREADSHEET_ID=your_tourism_spreadsheet_id
VITE_ORDERS_SPREADSHEET_ID=your_orders_spreadsheet_id
```

### 4. Update Server Code

Update `server/index.ts` to use environment variables:

```typescript
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(import.meta.dirname, "..", ".env") });
```

### 5. Implement Custom Theme Handling

Create `client/src/contexts/ThemeContext.tsx` as described in `docs/THEME_HANDLER.md`.

### 6. Implement Custom Error Handling

Create `client/src/utils/errorHandler.ts` as described in `docs/ERROR_HANDLING.md`.

### 7. Update Main Entry Point

Update `client/src/main.tsx` to use the new context providers:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { setupErrorHandlers } from './utils/errorHandler';

// Setup runtime error handlers
setupErrorHandlers();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

## Additional Platform-Specific Setup

### Linux/Mac Setup

1. Make the start script executable:
   ```bash
   chmod +x scripts/start.sh
   ```

2. Run the application:
   ```bash
   ./scripts/start.sh
   ```

### Windows Setup

Run the application using the Windows script:
```
scripts\start.bat
```

## Using Docker (Optional)

Create a `Dockerfile` in the root directory:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

Build and run with Docker:
```bash
docker build -t rai-guest-house .
docker run -p 5000:5000 -e NODE_ENV=production -e SESSION_SECRET=your_secret -e PORT=5000 rai-guest-house
```

## Troubleshooting

### Missing Dependencies
If you encounter errors about missing dependencies, try:
```bash
npm install
```

### Vite Configuration Errors
If you get Vite configuration errors, make sure your updated configuration doesn't reference any Replit plugins.

### Environment Variable Issues
Make sure your `.env` file contains all required environment variables as listed in `.env.example`.

## Verification

After removing the dependencies, verify that your application works as expected:

1. The website loads correctly
2. The theme functions properly (light/dark mode)
3. Error handling works
4. API requests work correctly
5. All features work as expected

## Additional Resources

- See `docs/DEPLOYMENT.md` for detailed deployment instructions
- See `docs/DOTENV_SETUP.md` for more information on environment variables
- See `docs/THEME_HANDLER.md` for theme handling details
- See `docs/ERROR_HANDLING.md` for error handling implementation
# Running Rai Guest House Management System on Any Platform

This guide will help you run the Rai Guest House Management System on any platform (Windows, macOS, Linux) or hosting service outside of Replit.

## Prerequisites

- Node.js v16.x or later
- npm v8.x or later

## Setup Instructions

### Option 1: Automatic Setup (Recommended)

1. Run the portable setup script:

```bash
# On Linux/macOS
node scripts/make-portable.js

# On Windows
node scripts\make-portable.js
```

2. After running the script, you'll have:
   - A portable Vite configuration (vite.config.portable.ts)
   - A basic .env file (if one didn't exist)
   - Custom theme handling (client/src/contexts/ThemeContext.tsx)
   - Custom error handling (client/src/utils/errorHandler.ts)
   - Platform-specific startup scripts (scripts/start.sh and scripts/start.bat)

3. When deploying outside of Replit, rename `vite.config.portable.ts` to `vite.config.ts`:

```bash
# On Linux/macOS
mv vite.config.portable.ts vite.config.ts

# On Windows
ren vite.config.portable.ts vite.config.ts
```

4. Start the application using the provided scripts:

```bash
# On Linux/macOS (development mode)
./scripts/start.sh

# On Linux/macOS (production mode)
./scripts/start.sh prod

# On Windows (development mode)
scripts\start.bat

# On Windows (production mode)
scripts\start.bat prod
```

### Option 2: Manual Setup

If you prefer to set things up manually:

1. Create a new `vite.config.ts` file without Replit dependencies:

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

2. Create a `.env` file:

```
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_secret_here
```

3. Start the application:

```bash
npm run dev   # For development
npm run build # For production build
npm start     # To run production server
```

## Environment Variables

The following environment variables should be configured in your `.env` file:

- `PORT`: Port for the server (default: 5000)
- `NODE_ENV`: Environment mode ('development' or 'production')
- `SESSION_SECRET`: Secret for session encryption
- `VITE_GOOGLE_API_KEY`: Your Google API key (for Sheets API)
- `VITE_ORDERS_SPREADSHEET_ID`: ID of the spreadsheet for orders
- `VITE_MENU_SPREADSHEET_ID`: ID of the spreadsheet for menu items
- `VITE_TOURISM_SPREADSHEET_ID`: ID of the spreadsheet for tourism information

## Running in Production

For production deployments:

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## Troubleshooting

- **Missing dependencies**: Run `npm install` to install all required dependencies
- **Port already in use**: Change the PORT in your .env file
- **Blank page**: Check browser console for errors; might be related to missing environment variables

## Notes About Platform Independence

This application has been designed to:

1. Use standard Node.js and browser APIs that work across all platforms
2. Not rely on Replit-specific services or plugins
3. Provide equivalent replacements for any Replit-specific features:
   - Theme handling (was previously using @replit/vite-plugin-shadcn-theme-json)
   - Error display (was previously using @replit/vite-plugin-runtime-error-modal)
   - Environment variable management
4. Use relative paths throughout the codebase for platform independence
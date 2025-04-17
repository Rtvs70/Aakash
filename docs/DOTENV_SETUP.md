# Environment Variables Setup Guide

This guide explains how to set up environment variables to replace Replit-specific functionality.

## Overview

Replit automatically provides environment variables and secrets management. To make the project portable, we need to implement our own environment variables solution using `dotenv`.

## Creating Environment Files

1. Create a `.env` file in the root directory of your project. This file will be used for local development.
2. Create a `.env.example` file to serve as a template for other developers (without actual secret values).

## Example .env File Structure

Here's what your `.env` file should look like:

```
# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_strong_random_secret_key

# Database Configuration (if using PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Google Sheets API (if using)
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_MENU_SPREADSHEET_ID=your_menu_spreadsheet_id
VITE_TOURISM_SPREADSHEET_ID=your_tourism_spreadsheet_id
VITE_ORDERS_SPREADSHEET_ID=your_orders_spreadsheet_id

# Other Application Settings
PUBLIC_URL=http://localhost:5000
```

## Using Environment Variables

### In Server Code (Node.js)

Update `server/index.ts` to load environment variables:

```typescript
import express from "express";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(import.meta.dirname, "..", ".env") });

// Now you can access environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const SESSION_SECRET = process.env.SESSION_SECRET || "default_secret_not_for_production";

// Continue with server setup
const app = express();
// ...
```

### In Client Code (Vite)

Vite automatically loads environment variables prefixed with `VITE_` from your `.env` file.

Example usage in a React component:

```tsx
function GoogleMapsComponent() {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  return (
    <div>
      {apiKey ? (
        <GoogleMap apiKey={apiKey} />
      ) : (
        <div className="error-message">
          Google Maps API key is missing. Please set VITE_GOOGLE_API_KEY in your environment.
        </div>
      )}
    </div>
  );
}
```

## Handling Different Environments

For different environments (development, testing, production), you can create multiple .env files:

- `.env.development` - Used when NODE_ENV=development
- `.env.test` - Used when NODE_ENV=test
- `.env.production` - Used when NODE_ENV=production

## Securing Environment Variables

1. **NEVER commit .env files to version control**
   - Add `.env*` to your `.gitignore` file
   - Only commit the `.env.example` template

2. **Handling secrets in production**
   - For cloud platforms, use their built-in secrets/environment variables management
   - For self-hosted scenarios, ensure proper file permissions on .env files

## Migrating from Replit Secrets

If you were using Replit Secrets:

1. Retrieve all current secrets from Replit
2. Add them to your new `.env` file
3. Update any code that accessed `process.env.REPL_` variables

## Environment Variables for Deployment

Different deployment platforms handle environment variables differently:

### Vercel
```
# Set through Vercel UI or using vercel.json
{
  "env": {
    "SESSION_SECRET": "your-secret-value"
  }
}
```

### Netlify
```
# Set through Netlify UI or netlify.toml
[build.environment]
  SESSION_SECRET = "your-secret-value"
```

### Docker
```
# Pass as environment variables when running container
docker run -e SESSION_SECRET=your-secret-value your-image
```

## Checking for Required Variables

Add a validation function to ensure all required environment variables are present:

```typescript
function validateEnv() {
  const required = [
    'SESSION_SECRET',
    'VITE_GOOGLE_API_KEY',
    // Add other required variables
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please add them to your .env file or environment');
    
    // In development, just warn; in production, exit
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Call this function early in your application startup
validateEnv();
```

## Example .env.example File

```
# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_secret_key_here

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Google Sheets API
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_MENU_SPREADSHEET_ID=your_menu_spreadsheet_id_here
VITE_TOURISM_SPREADSHEET_ID=your_tourism_spreadsheet_id_here
VITE_ORDERS_SPREADSHEET_ID=your_orders_spreadsheet_id_here

# Other Settings
PUBLIC_URL=http://localhost:5000
```

This setup ensures your application can run in any environment without relying on Replit-specific features.
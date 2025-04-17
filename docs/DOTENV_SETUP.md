# Environment Variables Guide

This document explains how to set up and use environment variables for the Rai Guest House Management System when running the application outside of Replit.

## Environment Variables Used

The application uses the following environment variables:

| Variable | Purpose | Required | Default |
|----------|---------|:--------:|:-------:|
| `PORT` | Port for the Express server | No | 5000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `SESSION_SECRET` | Secret for session encryption | Yes | - |
| `VITE_GOOGLE_API_KEY` | Google API key for Sheets API | Yes | - |
| `VITE_ORDERS_SPREADSHEET_ID` | Google Sheet ID for orders | Yes | - |
| `VITE_MENU_SPREADSHEET_ID` | Google Sheet ID for menu items | Yes | - |
| `VITE_TOURISM_SPREADSHEET_ID` | Google Sheet ID for tourism places | Yes | - |

## Setting Up Environment Variables

### Local Development

1. Create a `.env` file in the project root (if it doesn't exist already)
2. Add your environment variables:

```
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_session_secret_here

# Google API keys and spreadsheet IDs
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_ORDERS_SPREADSHEET_ID=your_orders_spreadsheet_id
VITE_MENU_SPREADSHEET_ID=your_menu_spreadsheet_id
VITE_TOURISM_SPREADSHEET_ID=your_tourism_spreadsheet_id
```

### Production Deployment

For production environments, you should set environment variables according to your hosting provider's recommendations:

- **Node.js hosting**: Set environment variables through the hosting dashboard
- **Docker**: Use environment variables in your Dockerfile or docker-compose.yml
- **Traditional hosting**: Configure environment variables in your server setup

## Obtaining Required Values

### Google API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to APIs & Services > Credentials
4. Create an API key
5. Enable the Google Sheets API for your project

### Google Spreadsheet IDs

The spreadsheet ID is the value between `/d/` and `/edit` in the Google Sheets URL.

For example, in the URL:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```

The spreadsheet ID is: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## Accessing Environment Variables

### In Server Code (Node.js)

```javascript
// Access using process.env
const port = process.env.PORT || 5000;
const sessionSecret = process.env.SESSION_SECRET;
```

### In Client Code (React)

Variables that need to be accessible in the browser must be prefixed with `VITE_`:

```javascript
// Access using import.meta.env
const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const menuSpreadsheetId = import.meta.env.VITE_MENU_SPREADSHEET_ID;
```

## Troubleshooting

### Environment Variables Not Available in Client

- Make sure they are prefixed with `VITE_`
- Restart the development server after changing .env files
- Verify the values are correctly set in your .env file

### Server Can't Read Environment Variables

- Check that the .env file is in the project root
- Ensure there are no syntax errors in your .env file
- Verify that the application is loading the .env file correctly

## Security Best Practices

1. **Never commit** your .env file to version control
2. Use different environment variable values for development and production
3. Regularly rotate secrets and API keys
4. Use least-privilege access for API keys (restrict to only the APIs needed)
5. Consider using a secure environment variable management service for production
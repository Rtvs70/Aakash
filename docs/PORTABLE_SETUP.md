# Making the Project Portable

This guide explains how to set up the Rai Guest House Management System to run on any platform without Replit dependencies.

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_session_secret_here

# Google Sheets API (if using Google Sheets)
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_MENU_SPREADSHEET_ID=your_menu_spreadsheet_id
VITE_TOURISM_SPREADSHEET_ID=your_tourism_spreadsheet_id
VITE_ORDERS_SPREADSHEET_ID=your_orders_spreadsheet_id
```

### 3. Customize Theme

Create or modify the `theme.json` file in the root directory:

```json
{
  "primary": "#e11d48",
  "variant": "vibrant",
  "appearance": "system",
  "radius": 0.5
}
```

### 4. Development Mode

Start the development server:

```bash
npm run dev
```

### 5. Build for Production

Build the project for production:

```bash
npm run build
```

### 6. Run Production Server

Start the production server:

```bash
npm run start
```

## Platform-Specific Instructions

### Windows

- Modify the npm scripts in package.json to use Windows-compatible syntax:
  ```json
  "scripts": {
    "dev": "set NODE_ENV=development&& tsx server/index.ts",
    "start": "set NODE_ENV=production&& node dist/index.js"
  }
  ```

### Linux/Mac

- The default scripts work as-is

### Docker (Optional)

- Create a Dockerfile in the root directory:

```Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start"]
```

- Build and run with Docker:
```bash
docker build -t rai-guest-house .
docker run -p 5000:5000 rai-guest-house
```

## Troubleshooting

### Vite Configuration Issues

If you encounter issues with Vite configuration due to missing Replit plugins:

1. Create a custom theme handler in `client/src/utils/theme-handler.ts`
2. Implement a custom error overlay component
3. Update imports in affected files

### Database Setup

The application uses an in-memory database by default. To use a persistent database:

1. Set up a PostgreSQL database
2. Update connection settings in `.env`
3. Run the migration script:
```bash
npm run db:push
```

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [Express Documentation](https://expressjs.com/en/4x/api.html)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
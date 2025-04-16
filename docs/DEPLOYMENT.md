# Deployment Guide

This document provides instructions for deploying the Rai Guest House Management System to various hosting environments.

## Table of Contents

1. [Deployment Prerequisites](#deployment-prerequisites)
2. [Building for Production](#building-for-production)
3. [Deployment Options](#deployment-options)
   - [Traditional Hosting](#traditional-hosting)
   - [Docker Deployment](#docker-deployment)
   - [Serverless Deployment](#serverless-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Post-Deployment Steps](#post-deployment-steps)
6. [Troubleshooting](#troubleshooting)

## Deployment Prerequisites

Before deploying, ensure you have:

- Node.js v16 or higher installed
- npm or yarn package manager
- Access to your hosting environment
- Domain name (optional but recommended)
- SSL certificate for HTTPS (recommended for security)

## Building for Production

To prepare the application for deployment:

1. Install dependencies if you haven't already:
   ```
   npm install
   ```

2. Build the application:
   ```
   npm run build
   ```

3. The build process will:
   - Compile the React frontend and generate static files in the `dist` folder
   - Bundle the server-side code using esbuild

## Deployment Options

### Traditional Hosting

#### Standard Node.js Hosting

1. Upload the following to your server:
   - The entire `dist` directory
   - `package.json` and `package-lock.json` files
   - `.env` file (configured for production)

2. Install production dependencies:
   ```
   npm install --production
   ```

3. Start the application:
   ```
   NODE_ENV=production node dist/index.js
   ```

4. For keeping the application running, use a process manager like PM2:
   ```
   npm install -g pm2
   pm2 start dist/index.js --name "rai-guesthouse"
   pm2 save
   ```

### Docker Deployment

If you prefer Docker deployment, create a Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist/ ./dist/

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

Build and run the Docker container:

```bash
docker build -t rai-guesthouse .
docker run -p 5000:5000 -e NODE_ENV=production rai-guesthouse
```

### Serverless Deployment

For serverless environments (AWS Lambda, Vercel, Netlify), different configurations are needed:

#### Vercel Deployment

1. Create a `vercel.json` file in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

2. Install the Vercel CLI and deploy:
```
npm install -g vercel
vercel
```

#### Netlify Deployment

1. Create a `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "dist/functions"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

2. Adapt the server code for Netlify Functions (not covered in this guide)

## Environment Configuration

Configure these environment variables for production:

```
NODE_ENV=production
PORT=5000 (or your preferred port)
DATABASE_URL=your_database_url (if using a database)
```

For security in production:

1. Use strong, unique passwords
2. Enable HTTPS
3. Set up proper CORS configuration
4. Implement rate limiting

## Post-Deployment Steps

After deployment:

1. Test all functionality in the production environment
2. Set up monitoring (uptime monitoring, error tracking)
3. Configure backups if using a database
4. Set up analytics (optional)

## Troubleshooting

Common issues and solutions:

### Application Won't Start

- Check if the port is already in use
- Verify environment variables are correctly set
- Ensure all dependencies are installed correctly
- Check server logs for specific error messages

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check if the database server is accessible from your hosting
- Confirm firewall rules allow the connection

### Static Assets Not Loading

- Check paths and routing configuration
- Verify the build process completed successfully

### WebSocket Connection Failures

- Ensure your hosting supports WebSocket connections
- Check proxy configurations if using a reverse proxy

For additional help, check the GitHub issues or create a new one.
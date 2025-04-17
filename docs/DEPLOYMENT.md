# Deployment Guide

This guide provides instructions for deploying the Rai Guest House Management System on various platforms without relying on Replit-specific features.

## Prerequisites

Before deploying, ensure you have:

1. Built the application using `npm run build`
2. Set up all necessary environment variables
3. Tested the application locally

## Environment Variables

The following environment variables should be configured in your deployment environment:

```
NODE_ENV=production
PORT=5000 (or any port your hosting platform requires)
SESSION_SECRET=your_secure_session_secret

# Google Sheets API (if using)
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_MENU_SPREADSHEET_ID=your_menu_spreadsheet_id
VITE_TOURISM_SPREADSHEET_ID=your_tourism_spreadsheet_id
VITE_ORDERS_SPREADSHEET_ID=your_orders_spreadsheet_id
```

## Deployment Options

### Option 1: Traditional Node.js Hosting

#### Platform Examples:
- DigitalOcean
- AWS EC2
- Linode
- Heroku

#### Steps:

1. **Set up your server**:
   ```bash
   # Install Node.js
   curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Deploy your application**:
   ```bash
   # Clone your repository
   git clone your-repository-url
   cd your-repository-folder

   # Install dependencies
   npm install --production

   # Build the client
   npm run build

   # Start with PM2
   pm2 start dist/index.js --name rai-guest-house
   pm2 save
   pm2 startup
   ```

3. **Set up a reverse proxy** (Nginx example):
   ```
   server {
     listen 80;
     server_name yourdomain.com;

     location / {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

### Option 2: Docker Deployment

1. **Create a Dockerfile**:
   ```dockerfile
   FROM node:16-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install --production

   COPY . .
   RUN npm run build

   EXPOSE 5000

   CMD ["node", "dist/index.js"]
   ```

2. **Build and run your Docker container**:
   ```bash
   docker build -t rai-guest-house .
   docker run -p 5000:5000 -e NODE_ENV=production -e SESSION_SECRET=your_secret docker run -p 5000:5000 rai-guest-house
   ```

3. **Using Docker Compose** (optional):
   ```yaml
   # docker-compose.yml
   version: '3'
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - NODE_ENV=production
         - SESSION_SECRET=your_secret
         - PORT=5000
   ```

### Option 3: Platform as a Service (PaaS)

#### Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set the build command: `npm install && npm run build`
4. Set the start command: `node dist/index.js`
5. Add your environment variables
6. Deploy

#### Railway

1. Create a new project
2. Connect your GitHub repository
3. Add required environment variables
4. Railway will automatically detect Node.js and deploy your app

#### Netlify with Serverless Functions

1. Create a `netlify.toml` file:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist/public"
     functions = "netlify/functions"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api/:splat"
     status = 200
   ```

2. Create a serverless function in `netlify/functions/api.js` that uses your Express app

### Option 4: Static Hosting with Separate API

If you want to separate the frontend and backend:

1. **Frontend** (Static hosting on Vercel, Netlify, GitHub Pages etc.):
   - Configure the build to output only the client files
   - Set up environment variables for API URL
   - Deploy the static files

2. **Backend** (Any Node.js hosting):
   - Deploy only the server portion
   - Set up CORS to allow requests from your frontend domain
   - Configure environment variables

## Database Considerations

If using a persistent database instead of in-memory storage:

### PostgreSQL Setup

1. Create a PostgreSQL database on your preferred provider (AWS RDS, DigitalOcean, etc.)
2. Add the database connection string to your environment variables:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database
   ```
3. Run migrations before starting the application:
   ```bash
   npm run db:push
   ```

## Progressive Web App (PWA) Considerations

The admin PWA component will work on any hosting platform. Ensure:

1. The service worker is properly registered
2. HTTPS is enabled for PWA features to work
3. Manifest file is properly configured

## Monitoring and Maintenance

Consider setting up:

1. Application monitoring (e.g., New Relic, Sentry)
2. Automated backups for your database
3. CI/CD pipeline for automated deployments
4. Health check endpoints for your application

## Troubleshooting Common Deployment Issues

### CORS Issues
If experiencing CORS issues, ensure your server has the appropriate headers:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'your-frontend-domain');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
```

### WebSocket Connection Issues
For WebSocket issues, ensure:

1. Your hosting platform supports WebSockets
2. Proper proxy configuration if using Nginx/Apache
3. Correct WebSocket URL in the client (using relative URLs is recommended)

### Static File Serving
Ensure proper configuration for serving static files:

```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

## Conclusion

With these changes, your Rai Guest House Management System should now run on any standard hosting platform without any Replit-specific dependencies.
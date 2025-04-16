# Rai Guest House Management System Manual

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Project Structure](#project-structure)
4. [Key Files and Their Functions](#key-files-and-their-functions)
    - [Server Files](#server-files)
    - [Client Files](#client-files)
    - [Shared Files](#shared-files)
    - [PWA Admin Files](#pwa-admin-files)
    - [Configuration Files](#configuration-files)
5. [Data Model](#data-model)
6. [Authentication System](#authentication-system)
7. [Customization Guide](#customization-guide)
8. [Extension Points](#extension-points)
9. [Troubleshooting](#troubleshooting)
10. [Frequently Asked Questions](#frequently-asked-questions)

## Introduction

The Rai Guest House Management System is a comprehensive web application designed for guest house administration. It features room service ordering, tourism information, and admin management capabilities. The system is built as a Progressive Web App (PWA) for mobile installation and offline capabilities.

### Key Features

- Guest-facing menu and ordering system
- Tourism information display with photos and maps
- Admin panel for menu management and order processing
- Real-time order notifications via WebSockets
- Mobile-responsive design for all device types
- Progressive Web App (PWA) for admin users
- Multi-language support

## System Architecture

The application follows a full-stack JavaScript architecture:

- **Frontend**: React with TypeScript
- **Backend**: Express.js with TypeScript
- **Database**: In-memory storage with option for PostgreSQL
- **State Management**: React Context and React Query
- **Real-time Communication**: WebSockets
- **Styling**: Tailwind CSS with Shadcn UI components

The application is structured as a monorepo with the following components:

- **Server**: Express.js backend handling API requests and WebSocket connections
- **Client**: React frontend for guest-facing interfaces
- **PWA Admin**: Progressive Web App for administrators
- **Shared**: Common code and types shared between components

## Project Structure

```
rai-guest-house/
├── client/                 # Main web application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── ...
├── server/                 # Backend Express server
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data storage implementation
│   └── vite.ts             # Vite configuration for server
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Data schemas and types
├── pwa-admin/              # Progressive Web App for admins
│   ├── public/             # Public assets and service worker
│   └── src/                # PWA source code
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── ...                     # Configuration files
```

## Key Files and Their Functions

### Server Files

#### server/index.ts

This is the entry point for the server application. It:
- Sets up the Express server
- Configures middleware (CORS, body parsing, session handling)
- Imports and registers API routes from routes.ts
- Handles error logging
- Starts the HTTP server

To modify server initialization or add global middleware, edit this file.

```typescript
// Example: Adding custom middleware
import express from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';

async function main() {
  const app = express();
  
  // Add your custom middleware here
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
  
  // ... existing code
}
```

#### server/routes.ts

This file defines all API endpoints. It:
- Registers RESTful API routes for all resources
- Sets up the WebSocket server for real-time communication
- Implements authentication middleware
- Connects routes to storage methods

To add new API endpoints or modify existing ones, edit this file. Each endpoint follows a consistent pattern:

```typescript
// Example: Adding a new API endpoint
app.get("/api/new-endpoint", async (req, res) => {
  try {
    // Implement your logic here
    res.json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: "Error occurred" });
  }
});
```

#### server/storage.ts

This file implements data storage. It:
- Defines the `IStorage` interface that all storage implementations must follow
- Implements `MemStorage` for in-memory data storage
- Could be extended to add database-backed storage

To modify data storage or add new data models:
1. Update the `IStorage` interface with new methods
2. Implement the methods in the `MemStorage` class
3. Initialize default data in the `initializeData` method

```typescript
// Example: Adding a new data model
export interface IStorage {
  // Existing methods...
  
  // New methods for your model
  getYourModels(): Promise<YourModel[]>;
  getYourModel(id: number): Promise<YourModel | undefined>;
  createYourModel(model: InsertYourModel): Promise<YourModel>;
  // ...
}

export class MemStorage implements IStorage {
  // Existing properties...
  private yourModels: Map<number, YourModel>;
  private yourModelCurrentId: number;
  
  constructor() {
    // Initialize maps...
    this.yourModels = new Map();
    this.yourModelCurrentId = 1;
    this.initializeData();
  }
  
  // Implement the methods...
  async getYourModels(): Promise<YourModel[]> {
    return Array.from(this.yourModels.values());
  }
  
  // ...
}
```

#### server/vite.ts

This file configures Vite for development. It:
- Sets up Vite middleware for development
- Handles static file serving
- Provides a logging utility

You typically don't need to modify this file unless you're changing the Vite configuration or static file serving behavior.

### Client Files

#### client/src/App.tsx

The main React component that:
- Sets up application routing
- Provides global context providers
- Defines the main layout structure

To modify the application's overall structure or add new routes, edit this file.

```typescript
// Example: Adding a new route
function Router() {
  return (
    <Switch>
      <Route path="/" exact>
        <HomePage />
      </Route>
      
      {/* Add your new route here */}
      <Route path="/your-new-page">
        <YourNewPage />
      </Route>
      
      {/* ... existing routes */}
    </Switch>
  );
}
```

#### client/src/components/

This directory contains reusable UI components. Key components include:
- `admin-login.tsx`: Authentication form for admins
- `menu-item.tsx`: Display for menu items
- `order-form.tsx`: Form for creating orders
- UI components from shadcn (buttons, forms, dialogs, etc.)

To add new components:
1. Create a new file in the appropriate subdirectory
2. Define your component using React functional components
3. Export the component
4. Import and use it in your pages

#### client/src/hooks/

Custom React hooks that encapsulate reusable logic:
- `use-api.ts`: Data fetching for menu items, tourism places, etc.
- `use-auth.tsx`: Authentication state and methods
- `use-cart.tsx`: Shopping cart functionality
- `use-authenticated-api.ts`: API requests with authentication

To add a new hook:
1. Create a new file named `use-your-hook.ts`
2. Implement the hook using React's built-in hooks
3. Export the hook function
4. Import and use it in your components

```typescript
// Example: Creating a new hook
import { useState, useEffect } from 'react';

export function useYourHook(initialValue) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Your effect logic
  }, []);
  
  const yourMethod = () => {
    // Your method implementation
  };
  
  return { state, yourMethod };
}
```

#### client/src/pages/

Contains page-level components for different routes:
- `home.tsx`: Landing page
- `menu.tsx`: Food ordering page
- `tourism.tsx`: Tourism information page
- `admin.tsx`: Admin panel
- `order-status.tsx`: Order tracking page

To add a new page:
1. Create a new file in this directory
2. Define your page component
3. Add the route in `App.tsx`

#### client/src/types.ts

Contains TypeScript interfaces for the application:
- `MenuItem`: Food item definition
- `Order`: Customer order details
- `TourismPlace`: Tourist attraction details
- `OrderItem`: Individual item in an order

To add or modify types:
1. Add or edit interfaces in this file
2. Ensure they match with the corresponding types in `shared/schema.ts`

```typescript
// Example: Adding a new type
export interface YourNewType {
  id: number;
  name: string;
  // ... other properties
}
```

#### client/src/config/constants.ts

Contains application constants:
- Menu categories
- Tourism tags
- Order status options
- Default admin credentials

Modify this file to change these constants.

### Shared Files

#### shared/schema.ts

Defines the database schema and shared types:
- Database table definitions using Drizzle ORM
- Zod schemas for validation
- TypeScript type definitions derived from the schemas

To add a new data model:
1. Define the table using Drizzle's `pgTable`
2. Create a Zod schema for validation using `createInsertSchema`
3. Export TypeScript types using `z.infer` and `$inferSelect`

```typescript
// Example: Adding a new model
export const yourModels = pgTable("your_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // ... other fields
});

export const insertYourModelSchema = createInsertSchema(yourModels).pick({
  name: true,
  description: true,
  // ... other fields to include
});

export type InsertYourModel = z.infer<typeof insertYourModelSchema>;
export type YourModel = typeof yourModels.$inferSelect;
```

### PWA Admin Files

#### pwa-admin/public/service-worker.js

Implements the Service Worker for the PWA:
- Caches static assets for offline use
- Handles background synchronization
- Manages push notifications
- Provides offline fallback pages

To modify offline behavior or notification handling, edit this file.

#### pwa-admin/src/App.js

Main React component for the PWA that:
- Sets up routing
- Provides theme configuration
- Wraps the application in context providers

#### pwa-admin/src/context/

Context providers for the PWA:
- `AuthContext.js`: Authentication state and methods
- `NotificationContext.js`: Notification settings and methods

#### pwa-admin/src/hooks/

Custom hooks for the PWA:
- `useApi.js`: API request utilities
- `useWebSocket.js`: WebSocket connection management

#### pwa-admin/src/pages/

Page components for the PWA:
- `LoginPage.js`: Authentication page
- `DashboardPage.js`: Main dashboard
- `OrdersPage.js`: Order management
- `SettingsPage.js`: Application settings

### Configuration Files

#### package.json

Defines project dependencies and npm scripts:
- Development dependencies
- Runtime dependencies
- Build and start scripts

#### vite.config.ts

Configures Vite for frontend development:
- Plugin configuration
- Build options
- Alias definitions

#### tailwind.config.ts

Configures Tailwind CSS:
- Theme customization
- Plugin configuration
- Content paths

#### theme.json

Defines the UI theme:
- Primary color
- Theme variant
- Appearance mode
- Border radius

Modify this file to change the visual appearance of the application.

#### drizzle.config.ts

Configures Drizzle ORM:
- Database connection
- Schema location
- Migration options

## Data Model

The application uses the following data models:

### Users

Admin users who can access the system:
- `id`: Unique identifier
- `username`: Login username
- `password`: Login password (Plain text - consider hashing for production)
- `isAdmin`: Whether user has admin privileges
- `lastLogin`: Timestamp of last login

### Menu Items

Food and beverage items available for ordering:
- `id`: Unique identifier
- `name`: Item name
- `price`: Selling price
- `purchasePrice`: Cost price (for profit calculation)
- `category`: Item category (Breakfast, Lunch, etc.)
- `details`: Item description
- `disabled`: Whether the item is temporarily unavailable

### Orders

Customer food orders:
- `id`: Unique identifier
- `timestamp`: Order creation time
- `status`: Order status (Pending, Preparing, Delivered)
- `name`: Customer name
- `roomNumber`: Room number for delivery
- `mobileNumber`: Contact number
- `items`: List of ordered items with quantities
- `total`: Total order amount
- `settled`: Whether payment has been received
- `restaurantPaid`: Whether the restaurant has been paid (for outsourced items)

### Tourism Places

Information about local tourist attractions:
- `id`: Unique identifier
- `title`: Attraction name
- `description`: Detailed description
- `distance`: Distance from guest house
- `tags`: Categorization tags
- `mapsLink`: Google Maps link
- `photoLinks`: Photos of the attraction

### Admin Settings

System configuration settings:
- `id`: Unique identifier
- `key`: Setting name
- `value`: Setting value (as JSON string)

### Activity Logs

System activity audit trail:
- `id`: Unique identifier
- `userId`: User who performed the action
- `action`: Type of action performed
- `details`: Additional details
- `timestamp`: When the action occurred

## Authentication System

The application uses a simple session-based authentication system:

1. **Login Process**:
   - User submits username/password to `/api/auth/login`
   - Server validates credentials against the users in storage
   - On success, returns user data
   - Client stores user ID for authenticated requests

2. **Authentication for API Requests**:
   - Client includes `X-User-ID` header with user ID
   - Server validates user existence via the `requireAuth` middleware
   - If invalid, returns 401 Unauthorized response

3. **Session Management**:
   - PWA stores authentication in localStorage and IndexedDB
   - Main client maintains auth state in React context

To modify the authentication system:
- For password hashing, modify the login logic in `server/routes.ts`
- For token-based auth, implement JWT generation and validation
- For third-party authentication, add OAuth providers

## Customization Guide

### Changing the Theme

1. Edit `theme.json`:
   ```json
   {
     "primary": "#your-color-hex",
     "variant": "vibrant", // or "professional" or "tint"
     "appearance": "light", // or "dark" or "system"
     "radius": 0.5 // border radius factor
   }
   ```

### Adding Menu Categories

Edit `client/src/config/constants.ts`:
```typescript
export const MENU_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Your New Category",
  // ...
];
```

### Adding Tourism Tags

Edit `client/src/config/constants.ts`:
```typescript
export const TOURISM_TAGS = [
  "Historical",
  "Religious",
  "Your New Tag",
  // ...
];
```

### Changing Logo

Replace the logo component in `client/src/components/logo.tsx`.

### Adding a New Page

1. Create a new page component in `client/src/pages/`
2. Add a route in `client/src/App.tsx`
3. Add navigation links to the new page

### Adding a New Data Model

1. Define the model in `shared/schema.ts`
2. Update the storage interface in `server/storage.ts`
3. Implement storage methods in `MemStorage`
4. Add API routes in `server/routes.ts`
5. Create UI components and hooks as needed

## Extension Points

### Adding Database Support

1. Create a new class implementing `IStorage` in `server/storage.ts`
2. Implement all required methods using your database of choice
3. Update the storage export to use your implementation:
   ```typescript
   export const storage = process.env.DATABASE_URL
     ? new YourDatabaseStorage()
     : new MemStorage();
   ```

### Adding OAuth Authentication

1. Install required packages:
   ```
   npm install passport passport-google-oauth20
   ```
2. Configure Passport.js in `server/index.ts`
3. Add OAuth routes in `server/routes.ts`
4. Update the auth context in the client

### Adding Payment Processing

1. Install a payment processing library:
   ```
   npm install stripe
   ```
2. Create payment service in `server/services/payment.ts`
3. Add payment routes in `server/routes.ts`
4. Create payment UI components in the client

### Adding Email Notifications

1. Install email library:
   ```
   npm install nodemailer
   ```
2. Create email service in `server/services/email.ts`
3. Integrate email sending with order processing

## Troubleshooting

### Common Issues

#### Application Won't Start

**Possible causes:**
- Port conflict
- Missing dependencies
- Environment variables not set

**Solutions:**
- Change the port in `.env` or kill the process using the port
- Run `npm install` to ensure all dependencies are installed
- Check `.env` file exists with required variables

#### API Requests Failing

**Possible causes:**
- Authentication issues
- CORS configuration
- Network connectivity

**Solutions:**
- Check authentication headers
- Verify CORS settings in `server/index.ts`
- Check network connectivity and server logs

#### WebSocket Connection Issues

**Possible causes:**
- Connection URL incorrect
- Server not initialized correctly
- Client-side error handling

**Solutions:**
- Verify WebSocket URL construction
- Check WebSocket server initialization in `server/routes.ts`
- Implement proper error handling and reconnection logic

#### Database Migration Issues

**Possible causes:**
- Schema mismatch
- Database connection issues
- Missing tables

**Solutions:**
- Verify database schema matches `shared/schema.ts`
- Check database connection string
- Run the database initialization script

## Frequently Asked Questions

### How do I add a new admin user?

Use the API endpoint:
```
POST /api/users
```
With body:
```json
{
  "username": "newadmin",
  "password": "password123",
  "isAdmin": true
}
```

### How do I enable offline support for guests?

The PWA already supports offline capabilities for admins. To extend this to guests:
1. Create a service worker for the main client
2. Configure cache strategies for static assets and API responses
3. Implement offline UI components

### How do I connect to a real database?

1. Set up a PostgreSQL database
2. Add the connection string to `.env`:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database
   ```
3. Run the database initialization script:
   ```
   node scripts/init-database.js
   ```
4. Update `server/storage.ts` to use a database implementation

### How do I deploy to production?

See the [DEPLOYMENT.md](DEPLOYMENT.md) guide for detailed instructions on deploying to various environments.

### How do I add multilingual support?

1. Install i18n library:
   ```
   npm install i18next react-i18next
   ```
2. Create translation files in `client/src/locales/`
3. Configure i18n in `client/src/i18n.ts`
4. Wrap the application with the i18n provider
5. Use translation hooks in components

### How do I customize notification sounds?

1. Add audio files to `pwa-admin/public/static/media/`
2. Update the sound options in `pwa-admin/src/pages/SoundSettingsPage.js`
# Database Guide

This document provides information about database options, migration, and data management for the Rai Guest House Management System.

## Table of Contents

1. [Database Options](#database-options)
2. [Migrating from In-Memory to Persistent Database](#migrating-from-in-memory-to-persistent-database)
3. [Database Schema](#database-schema)
4. [Data Backup and Restore](#data-backup-and-restore)
5. [Performance Optimization](#performance-optimization)

## Database Options

The Rai Guest House Management System supports multiple storage options:

### In-Memory Storage (Default)

By default, the application uses in-memory storage via the `MemStorage` class in `server/storage.ts`. This is suitable for:

- Development and testing
- Small installations with minimal data requirements
- Scenarios where data persistence between restarts is not critical

Note that in-memory storage does not persist data when the application restarts.

### PostgreSQL Database

For production use, the application supports PostgreSQL as a persistent database using Drizzle ORM. This is recommended for:

- Production deployments
- Scenarios requiring data persistence
- Multiple concurrent users
- Larger data volumes

### Google Sheets Integration (Optional)

The application also includes optional Google Sheets integration for specific use cases:

- Menu data management
- Tourism information
- Order history export

## Migrating from In-Memory to Persistent Database

To migrate from the default in-memory storage to a PostgreSQL database:

1. Install PostgreSQL on your server or use a cloud provider (AWS RDS, Google Cloud SQL, etc.)

2. Create a new database:
   ```sql
   CREATE DATABASE raiguesthouse;
   ```

3. Add the database connection URL to your `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/raiguesthouse
   ```

4. Run the database initialization script:
   ```
   node scripts/init-database.js
   ```

5. Update the storage implementation in `server/storage.ts` to use the PostgreSQL storage implementation. 

   Edit `server/storage.ts` and change the last line from:
   ```typescript
   export const storage = new MemStorage();
   ```
   
   To:
   ```typescript
   export const storage = process.env.DATABASE_URL 
     ? new PostgresStorage() 
     : new MemStorage();
   ```

6. Restart the application

## Database Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM. The main tables are:

### Users
Stores admin users who can access the system.
- `id`: Auto-incremented primary key
- `username`: Unique username
- `password`: Password (stored in plaintext - consider implementing password hashing for production)
- `isAdmin`: Boolean flag for admin privileges
- `lastLogin`: Timestamp of last login

### Menu Items
Stores food and beverage items available for ordering.
- `id`: Auto-incremented primary key
- `name`: Item name
- `price`: Sale price
- `purchasePrice`: Cost price (for profit calculation)
- `category`: Category (e.g., Breakfast, Lunch, Dinner)
- `details`: Additional item details
- `disabled`: Boolean to temporarily disable items

### Orders
Stores customer orders.
- `id`: Auto-incremented primary key
- `timestamp`: Order creation time
- `status`: Order status (Pending, Preparing, Delivered)
- `name`: Customer name
- `roomNumber`: Room number
- `mobileNumber`: Contact number
- `items`: JSON array of ordered items
- `total`: Total order amount
- `settled`: Whether the order has been paid for
- `restaurantPaid`: Whether the restaurant has been paid (for outsourced items)

### Tourism Places
Stores information about local attractions.
- `id`: Auto-incremented primary key
- `title`: Attraction name
- `description`: Description text
- `distance`: Distance from the guest house
- `tags`: Array of tags (e.g., Historical, Religious)
- `mapsLink`: Link to Google Maps
- `photoLinks`: Array of photo URLs

### Admin Settings
Stores configuration settings.
- `id`: Auto-incremented primary key
- `key`: Setting key
- `value`: Setting value

### Activity Logs
Tracks admin actions in the system.
- `id`: Auto-incremented primary key
- `userId`: Reference to user who performed the action
- `action`: Action type
- `details`: Additional details
- `timestamp`: When the action occurred

## Data Backup and Restore

### PostgreSQL Backup

To back up your PostgreSQL database:

```bash
pg_dump -U username -h hostname -d raiguesthouse > backup.sql
```

### PostgreSQL Restore

To restore from a backup:

```bash
psql -U username -h hostname -d raiguesthouse < backup.sql
```

### In-Memory Data Export

For in-memory storage, you can implement export functionality to save data to JSON files:

```javascript
// Example export code
const data = {
  users: Array.from(storage.users.values()),
  menuItems: Array.from(storage.menuItems.values()),
  orders: Array.from(storage.orders.values()),
  tourismPlaces: Array.from(storage.tourismPlaces.values()),
  settings: Array.from(storage.adminSettings.values())
};

fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
```

## Performance Optimization

For larger installations:

1. **Index Critical Fields**:
   - Add indexes to frequently queried fields like `roomNumber` and `mobileNumber` in the orders table
   - Index the `timestamp` field for faster date range queries

2. **Connection Pooling**:
   - Configure PostgreSQL connection pooling for better resource utilization

3. **Query Optimization**:
   - Use pagination for large result sets
   - Optimize JOIN operations
   - Use appropriate WHERE clauses to filter data early
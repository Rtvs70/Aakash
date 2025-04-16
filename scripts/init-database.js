/**
 * Database Initialization Script
 * 
 * This script helps migrate from in-memory storage to a persistent database.
 * It sets up the database schema and populates it with initial data.
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const readline = require('readline');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function initDatabase() {
  console.log('\n\x1b[1;36m=======================================================\x1b[0m');
  console.log('\x1b[1;36m       Rai Guest House - Database Initialization\x1b[0m');
  console.log('\x1b[1;36m=======================================================\x1b[0m\n');
  
  // Get database connection string
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('\x1b[33mNo DATABASE_URL found in environment variables.\x1b[0m');
    dbUrl = await new Promise(resolve => {
      rl.question('Enter PostgreSQL connection URL (e.g. postgresql://user:pass@localhost:5432/dbname): ', answer => {
        resolve(answer.trim());
      });
    });
    
    if (!dbUrl) {
      console.error('\x1b[31mDatabase URL is required to continue.\x1b[0m');
      rl.close();
      return;
    }
  }
  
  try {
    // Connect to the database
    console.log('\x1b[33mConnecting to database...\x1b[0m');
    const sql = postgres(dbUrl, { max: 1 });
    const db = drizzle(sql);
    
    // Confirm database setup
    const confirmSetup = await new Promise(resolve => {
      rl.question('\n\x1b[33mWARNING: This will create database tables. Continue? (y/N): \x1b[0m', answer => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (!confirmSetup) {
      console.log('\nDatabase initialization cancelled.');
      rl.close();
      return;
    }
    
    // Run migrations
    console.log('\n\x1b[33mRunning database migrations...\x1b[0m');
    await migrate(db, { migrationsFolder: './drizzle' });
    
    // Create initial admin user
    console.log('\n\x1b[33mCreating initial admin user...\x1b[0m');
    
    const username = await new Promise(resolve => {
      rl.question('Enter admin username (default: admin): ', answer => {
        resolve(answer.trim() || 'admin');
      });
    });
    
    const password = await new Promise(resolve => {
      rl.question('Enter admin password (default: superman123): ', answer => {
        resolve(answer.trim() || 'superman123');
      });
    });
    
    // Import the schema
    const { users } = require('../shared/schema');
    
    // Insert admin user
    await db.insert(users).values({
      username,
      password,
      isAdmin: true,
      lastLogin: null,
    });
    
    console.log('\n\x1b[32m✓ Admin user created successfully!\x1b[0m');
    console.log('\n\x1b[32m=======================================================\x1b[0m');
    console.log('\x1b[32m                 Database Initialized!\x1b[0m');
    console.log('\x1b[32m=======================================================\x1b[0m');
    
    // Add the DATABASE_URL to .env if it's not there
    if (!process.env.DATABASE_URL) {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      if (!envContent.includes('DATABASE_URL=')) {
        fs.appendFileSync(envPath, `\n# Database connection URL\nDATABASE_URL=${dbUrl}\n`);
        console.log('\n✓ Added DATABASE_URL to .env file');
      }
    }
    
    console.log('\nYou can now start the application with:');
    console.log('\x1b[36m  npm run dev\x1b[0m');
    
  } catch (error) {
    console.error('\n\x1b[31mError during database initialization:\x1b[0m', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

initDatabase();
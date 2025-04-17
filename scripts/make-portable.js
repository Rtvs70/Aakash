/**
 * Make Portable Script
 * 
 * This script prepares the project to run outside of Replit by:
 * 1. Creating a custom vite.config.ts file without Replit dependencies
 * 2. Setting up a basic .env file
 * 3. Adding necessary theme handling
 * 4. Creating platform-specific startup scripts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const VITE_CONFIG_PATH = path.join(ROOT_DIR, 'vite.config.portable.ts');
const ENV_TEMPLATE_PATH = path.join(ROOT_DIR, '.env.example');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const THEME_CONTEXT_DIR = path.join(ROOT_DIR, 'client', 'src', 'contexts');
const THEME_CONTEXT_PATH = path.join(THEME_CONTEXT_DIR, 'ThemeContext.tsx');
const ERROR_UTILS_DIR = path.join(ROOT_DIR, 'client', 'src', 'utils');
const ERROR_HANDLER_PATH = path.join(ERROR_UTILS_DIR, 'errorHandler.ts');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');
const START_SCRIPT_LINUX = path.join(SCRIPTS_DIR, 'start.sh');
const START_SCRIPT_WINDOWS = path.join(SCRIPTS_DIR, 'start.bat');

// New Vite config without Replit dependencies
const NEW_VITE_CONFIG = `import { defineConfig } from "vite";
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
`;

// Theme Context Component
const THEME_CONTEXT_CONTENT = `import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = {
  primary: string;
  variant: 'professional' | 'tint' | 'vibrant';
  appearance: 'light' | 'dark' | 'system';
  radius: number;
};

const defaultTheme: Theme = {
  primary: '#e11d48',
  variant: 'vibrant',
  appearance: 'system',
  radius: 0.5,
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Partial<Theme>) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    try {
      // Try to load theme from localStorage
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        setThemeState(JSON.parse(savedTheme));
      } else {
        // Try to load from theme.json if available
        fetch('/theme.json')
          .then(res => res.json())
          .then(data => {
            setThemeState({ ...defaultTheme, ...data });
            localStorage.setItem('app-theme', JSON.stringify({ ...defaultTheme, ...data }));
          })
          .catch(() => {
            // Use default theme if theme.json is not available
            localStorage.setItem('app-theme', JSON.stringify(defaultTheme));
          });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Partial<Theme>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setThemeState(updatedTheme);
    localStorage.setItem('app-theme', JSON.stringify(updatedTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: Theme) {
  // Apply primary color
  document.documentElement.style.setProperty('--primary', theme.primary);
  
  // Apply border radius
  document.documentElement.style.setProperty('--radius', \`\${theme.radius}rem\`);
  
  // Apply color variant
  document.documentElement.classList.remove('theme-professional', 'theme-tint', 'theme-vibrant');
  document.documentElement.classList.add(\`theme-\${theme.variant}\`);
  
  // Apply appearance (light/dark mode)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (theme.appearance === 'system') {
    document.documentElement.classList.toggle('dark', prefersDark);
  } else {
    document.documentElement.classList.toggle('dark', theme.appearance === 'dark');
  }
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
`;

// Error Handler Utility
const ERROR_HANDLER_CONTENT = `
type ErrorEventHandler = (event: ErrorEvent) => void;
type PromiseRejectionHandler = (event: PromiseRejectionEvent) => void;

let errorModalShown = false;
let errorStack: string[] = [];

// Function to create and show the error modal
function showErrorModal(message: string, stack?: string): void {
  if (errorModalShown) {
    // Add to stack instead of showing multiple modals
    errorStack.push(message);
    return;
  }
  
  errorModalShown = true;
  
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4';
  modalContainer.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'bg-card border shadow-lg rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto';
  modalContent.style.cssText = 'background: white; border-radius: 8px; max-width: 500px; width: 100%; max-height: 90vh; overflow: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.2);';
  
  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'p-4 border-b bg-muted flex items-center justify-between';
  modalHeader.style.cssText = 'padding: 16px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;';
  modalHeader.innerHTML = \`
    <div style="display: flex; align-items: center; gap: 8px; color: #e11d48;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <path d="M12 9v4"></path>
        <path d="M12 17h.01"></path>
      </svg>
      <h2 style="font-size: 18px; font-weight: 600;">Runtime Error</h2>
    </div>
    <button id="error-modal-close" style="border-radius: 9999px; padding: 4px; display: flex;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    </button>
  \`;
  
  // Create modal body
  const modalBody = document.createElement('div');
  modalBody.className = 'p-4';
  modalBody.style.cssText = 'padding: 16px;';
  
  // Add error message
  const errorMessage = document.createElement('p');
  errorMessage.className = 'mb-4';
  errorMessage.style.cssText = 'margin-bottom: 16px;';
  errorMessage.textContent = message;
  modalBody.appendChild(errorMessage);
  
  // Add stack trace if available
  if (stack) {
    const stackContainer = document.createElement('div');
    stackContainer.className = 'mb-4';
    stackContainer.style.cssText = 'margin-bottom: 16px;';
    
    const stackTitle = document.createElement('h3');
    stackTitle.className = 'font-semibold mb-1';
    stackTitle.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
    stackTitle.textContent = 'Stack Trace:';
    stackContainer.appendChild(stackTitle);
    
    const stackContent = document.createElement('pre');
    stackContent.className = 'bg-muted p-2 rounded text-sm overflow-auto max-h-64';
    stackContent.style.cssText = 'background: #f1f5f9; padding: 8px; border-radius: 4px; font-size: 14px; overflow: auto; max-height: 256px;';
    stackContent.textContent = stack;
    stackContainer.appendChild(stackContent);
    
    modalBody.appendChild(stackContainer);
  }
  
  // Create modal footer
  const modalFooter = document.createElement('div');
  modalFooter.className = 'p-4 border-t flex justify-end gap-2';
  modalFooter.style.cssText = 'padding: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;';
  
  // Add dismiss button
  const dismissButton = document.createElement('button');
  dismissButton.className = 'px-4 py-2 border rounded-md hover:bg-muted';
  dismissButton.style.cssText = 'padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer;';
  dismissButton.textContent = 'Dismiss';
  dismissButton.id = 'error-modal-dismiss';
  
  // Add reload button
  const reloadButton = document.createElement('button');
  reloadButton.className = 'px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-1';
  reloadButton.style.cssText = 'padding: 8px 16px; background: #e11d48; color: white; border-radius: 6px; display: flex; align-items: center; gap: 4px; cursor: pointer;';
  reloadButton.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
      <path d="M3 21v-5h5"></path>
    </svg>
    Reload Page
  \`;
  reloadButton.id = 'error-modal-reload';
  
  modalFooter.appendChild(dismissButton);
  modalFooter.appendChild(reloadButton);
  
  // Assemble modal
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);
  modalContainer.appendChild(modalContent);
  
  // Add to body
  document.body.appendChild(modalContainer);
  
  // Add event listeners
  document.getElementById('error-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('error-modal-dismiss')?.addEventListener('click', closeModal);
  document.getElementById('error-modal-reload')?.addEventListener('click', () => {
    window.location.reload();
  });
  
  function closeModal() {
    document.body.removeChild(modalContainer);
    errorModalShown = false;
    
    // Show next error in stack if any
    if (errorStack.length > 0) {
      const nextError = errorStack.shift();
      if (nextError) {
        showErrorModal(nextError);
      }
    }
  }
}

// Global error handler
const handleGlobalError: ErrorEventHandler = (event) => {
  event.preventDefault();
  
  const message = event.message || 'An unknown error occurred';
  const stack = event.error?.stack || '';
  
  console.error('Runtime error:', message);
  console.error(stack);
  
  showErrorModal(message, stack);
};

// Unhandled promise rejection handler
const handlePromiseRejection: PromiseRejectionHandler = (event) => {
  event.preventDefault();
  
  const reason = event.reason;
  const message = reason instanceof Error 
    ? reason.message 
    : typeof reason === 'string' 
      ? reason 
      : 'Unhandled Promise Rejection';
      
  const stack = reason instanceof Error ? reason.stack : '';
  
  console.error('Unhandled Promise Rejection:', message);
  if (stack) console.error(stack);
  
  showErrorModal(message, stack);
};

// Setup error handlers
export function setupErrorHandlers(): void {
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handlePromiseRejection);
  
  console.info('Runtime error handlers installed');
}

// Remove error handlers
export function removeErrorHandlers(): void {
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handlePromiseRejection);
}
`;

// Functions to handle directory and file creation
async function createDirectoryIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function createNewViteConfig() {
  try {
    fs.writeFileSync(VITE_CONFIG_PATH, NEW_VITE_CONFIG);
    console.log(`Created portable vite.config.ts without Replit dependencies at ${VITE_CONFIG_PATH}`);
  } catch (error) {
    console.error(`Error creating portable vite config: ${error.message}`);
  }
}

async function createEnvFileIfNotExists() {
  if (!fs.existsSync(ENV_PATH) && fs.existsSync(ENV_TEMPLATE_PATH)) {
    fs.copyFileSync(ENV_TEMPLATE_PATH, ENV_PATH);
    console.log(`Created .env file from template`);
  } else if (!fs.existsSync(ENV_PATH)) {
    // Create a basic .env file
    const basicEnv = `PORT=5000
NODE_ENV=development
SESSION_SECRET=development_secret_replace_in_production
`;
    fs.writeFileSync(ENV_PATH, basicEnv);
    console.log(`Created basic .env file`);
  }
}

async function createThemeContext() {
  try {
    await createDirectoryIfNotExists(THEME_CONTEXT_DIR);
    fs.writeFileSync(THEME_CONTEXT_PATH, THEME_CONTEXT_CONTENT);
    console.log(`Created ThemeContext.tsx for custom theme handling`);
  } catch (error) {
    console.error(`Error creating ThemeContext: ${error.message}`);
  }
}

async function createErrorHandler() {
  try {
    await createDirectoryIfNotExists(ERROR_UTILS_DIR);
    fs.writeFileSync(ERROR_HANDLER_PATH, ERROR_HANDLER_CONTENT);
    console.log(`Created errorHandler.ts for custom error handling`);
  } catch (error) {
    console.error(`Error creating errorHandler: ${error.message}`);
  }
}

async function createStartScripts() {
  try {
    // Make sure scripts directory exists
    await createDirectoryIfNotExists(SCRIPTS_DIR);
    
    // Create Linux/Mac start script
    fs.writeFileSync(START_SCRIPT_LINUX, `#!/bin/bash

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Created .env file from .env.example. Please edit it with your actual values."
    else
        echo "Error: .env.example not found. Please create a .env file manually."
        exit 1
    fi
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the app in development or production mode
if [ "$1" == "prod" ] || [ "$1" == "production" ]; then
    echo "Starting in production mode..."
    npm run build && npm run start
else
    echo "Starting in development mode..."
    npm run dev
fi
`);
    fs.chmodSync(START_SCRIPT_LINUX, '755'); // Make executable
    console.log(`Created and made executable: ${START_SCRIPT_LINUX}`);
    
    // Create Windows start script
    fs.writeFileSync(START_SCRIPT_WINDOWS, `@echo off
REM Check for Node.js
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js 16.x or higher.
    exit /b 1
)

REM Check if .env file exists
IF NOT EXIST .env (
    echo Warning: .env file not found. Creating from template...
    IF EXIST .env.example (
        copy .env.example .env
        echo Created .env file from .env.example. Please edit it with your actual values.
    ) ELSE (
        echo Error: .env.example not found. Please create a .env file manually.
        exit /b 1
    )
)

REM Check if dependencies are installed
IF NOT EXIST node_modules (
    echo Installing dependencies...
    call npm install
)

REM Start the app in development or production mode
IF "%1"=="prod" (
    echo Starting in production mode...
    call npm run build && npm run start
) ELSE (
    echo Starting in development mode...
    call npm run dev
)
`);
    console.log(`Created: ${START_SCRIPT_WINDOWS}`);
  } catch (error) {
    console.error(`Error creating start scripts: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('Making the Rai Guest House Management System portable...\n');
  
  // Step 1: Create portable vite config (without modifying original one)
  await createNewViteConfig();
  
  // Step 2: Create .env file if it doesn't exist
  await createEnvFileIfNotExists();
  
  // Step 3: Create theme context
  await createThemeContext();
  
  // Step 4: Create error handler
  await createErrorHandler();
  
  // Step 5: Create platform-specific start scripts
  await createStartScripts();
  
  console.log('\nPortable setup complete!');
  console.log('\nTo use this portable configuration:');
  console.log('1. Rename vite.config.portable.ts to vite.config.ts when running outside Replit');
  console.log('2. Edit the .env file with your environment-specific values');
  console.log('3. Use the start scripts to run the application:');
  console.log('   - On Linux/Mac: ./scripts/start.sh');
  console.log('   - On Windows: scripts\\start.bat');
  console.log('\nFor production mode:');
  console.log('   - On Linux/Mac: ./scripts/start.sh prod');
  console.log('   - On Windows: scripts\\start.bat prod');
}

// Run the script
try {
  await main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
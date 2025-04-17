# Custom Error Handling Implementation

Since we've removed the Replit error modal plugin, this document shows how to implement a custom error handling solution for your application.

## Step 1: Create an Error Boundary Component

Create a file `client/src/components/ErrorBoundary.tsx`:

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });
    
    // You can log the error to a service here
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleDismiss = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border shadow-lg rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b bg-muted flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Application Error</h2>
              </div>
              <button
                onClick={this.handleDismiss}
                className="rounded-full p-1 hover:bg-muted-foreground/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-4 text-foreground">
                An error occurred in the application. You can try reloading the page or
                check the details below to troubleshoot the issue.
              </p>
              
              {this.state.error && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Error:</h3>
                  <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}
              
              {this.state.errorInfo && (
                <div>
                  <h3 className="font-semibold mb-1">Stack Trace:</h3>
                  <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={this.handleDismiss}
                className="px-4 py-2 border rounded-md hover:bg-muted"
              >
                Dismiss
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Step 2: Create a Runtime Error Handler

Create a file `client/src/utils/errorHandler.ts`:

```typescript
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
  modalHeader.innerHTML = `
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
  `;
  
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
  reloadButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
      <path d="M3 21v-5h5"></path>
    </svg>
    Reload Page
  `;
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
```

## Step 3: Initialize the Error Handler in Main.tsx

Update `client/src/main.tsx` to include the error handling:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import { setupErrorHandlers } from './utils/errorHandler';

// Setup runtime error handlers
setupErrorHandlers();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

## Step 4: Add a Development Mode Error Test (Optional)

Create a component to test error handling:

```tsx
import React, { useState } from 'react';
import { Button } from './ui/button';

export function ErrorTester() {
  const [showInComponent, setShowInComponent] = useState(false);
  
  const triggerRuntimeError = () => {
    // This will trigger a runtime error
    const obj = null;
    obj.nonExistentMethod();
  };
  
  const triggerPromiseRejection = () => {
    // This will trigger an unhandled promise rejection
    Promise.reject(new Error('Test Promise Rejection'));
  };
  
  if (showInComponent) {
    // This will trigger the ErrorBoundary
    throw new Error('Test Error Boundary');
  }
  
  return (
    <div className="p-4 border rounded-md space-y-4 my-4">
      <h3 className="font-semibold">Error Testing (Development Only)</h3>
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive" onClick={triggerRuntimeError}>
          Test Runtime Error
        </Button>
        <Button variant="destructive" onClick={triggerPromiseRejection}>
          Test Promise Rejection
        </Button>
        <Button variant="destructive" onClick={() => setShowInComponent(true)}>
          Test Error Boundary
        </Button>
      </div>
    </div>
  );
}
```

## Implementation Notes

1. **ErrorBoundary Component**: Catches errors in the React component tree during rendering
2. **Runtime Error Handler**: Catches global JavaScript errors outside of React
3. **Promise Rejection Handler**: Catches unhandled promise rejections
4. **Error Modal**: Shows detailed error information and provides reload option

This implementation provides a comprehensive error handling solution that works on any platform without depending on Replit-specific libraries.

## Usage

1. Wrap your application in the ErrorBoundary component
2. Call setupErrorHandlers() at application startup
3. For development, you can include the ErrorTester component to verify functionality

This approach gives you full control over error handling and allows for customization of error messages and UI to match your application's design.
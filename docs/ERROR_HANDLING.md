# Custom Error Handling Documentation

This document explains the custom error handling implementation that replaces the Replit-specific error modal.

## Overview

The custom error handler captures runtime errors and unhandled promise rejections, displaying them in a user-friendly modal with debugging information. This implementation maintains the same functionality as the Replit error modal but works on any platform.

## Features

- **Runtime Error Capture**: Catches JavaScript runtime errors
- **Promise Rejection Handling**: Captures unhandled promise rejections
- **Error Stacking**: Manages multiple errors without overwhelming the user
- **Custom Modal**: Displays errors in a consistent, styled modal
- **Debugging Tools**: Shows error messages and stack traces
- **Error Recovery**: Provides options to dismiss errors or reload the page

## Implementation

The error handler is implemented in `client/src/utils/errorHandler.ts` and includes:

1. **Global Error Listeners**: Attaches to window error events
2. **Error Modal Component**: Creates a dynamic modal for displaying errors
3. **Error Queue Management**: Handles multiple errors in sequence

## Usage

### Setting Up Error Handling

Add the following code to your main application entry point (`client/src/main.tsx`):

```typescript
import { setupErrorHandlers } from './utils/errorHandler';

// Setup error handlers when the application starts
setupErrorHandlers();
```

### Customizing Error Display

You can modify the error modal appearance by editing the styles in the `errorHandler.ts` file. The modal uses both Tailwind CSS classes and inline styles for maximum compatibility.

## Understanding the Code

### Error Event Handler

```typescript
const handleGlobalError: ErrorEventHandler = (event) => {
  event.preventDefault();
  
  const message = event.message || 'An unknown error occurred';
  const stack = event.error?.stack || '';
  
  console.error('Runtime error:', message);
  console.error(stack);
  
  showErrorModal(message, stack);
};
```

This function captures runtime errors, logs them to the console, and displays them in the modal.

### Promise Rejection Handler

```typescript
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
```

This function captures unhandled promise rejections and displays them in the modal.

### Error Modal Creation

The `showErrorModal` function dynamically creates a modal with:
- Error message
- Stack trace (if available)
- Actions to dismiss the error or reload the page

## Error Stacking Logic

When multiple errors occur:
1. The first error is displayed immediately
2. Subsequent errors are added to a queue
3. When the user dismisses an error, the next one in the queue is shown
4. This prevents overwhelming the user with multiple modals

## Lifecycle Hooks

- `setupErrorHandlers()`: Initializes the error handling system
- `removeErrorHandlers()`: Cleans up event listeners (useful for testing or when unmounting)

## Browser Compatibility

The error handler is designed to work in all modern browsers, with careful attention to:
- Event delegation and handling
- DOM manipulation techniques
- CSS that works across browsers

## Integration with React

This error handler works outside of React's error boundaries, capturing errors that React might miss, such as:
- Asynchronous errors
- Errors in event handlers
- Errors in non-React code
- Network errors
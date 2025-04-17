
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

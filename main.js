/**
 * IFSCee - C Programming Visualization Tool
 * Main entry point for the application
 */

import { AppState } from './state.js';
import { initializeUI } from './ui-components.js';
import { setupEventHandlers } from './event-handlers.js';
import { loadExamples } from './interpreter.js';

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('IFSCee - C Programming Visualization Tool starting...');
  
  try {
    // Initialize application state
    const appState = new AppState();
    
    // Load examples
    loadExamples(appState);
    
    // Initialize the UI
    initializeUI(appState);
    
    // Setup event handlers
    setupEventHandlers(appState);
    
    // Load initial example
    appState.loadExample('basic');
    
    console.log('IFSCee initialization complete');
  } catch (error) {
    console.error('Error during initialization:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; color: #f44336; text-align: center;">
        <h2>Initialization Error</h2>
        <p>${error.message}</p>
        <p>See console for details.</p>
      </div>
    `;
  }
});
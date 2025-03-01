/**
 * IFSCee - C Programming Visualization Tool
 * Event handling module
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';
import { Visualizer } from './visualization.js';

/**
 * Set up event handlers for the application
 * @param {AppState} appState - Application state
 */
export function setupEventHandlers(appState) {
  const { UIElements } = appState;
  
  // Example selector change event
  if (UIElements.exampleSelector) {
    UIElements.exampleSelector.addEventListener('change', function() {
      appState.loadExample(this.value);
    });
  }
  
  // Run button event
  if (UIElements.runBtn) {
    UIElements.runBtn.addEventListener('click', () => executeCode(appState));
  }
  
  // Navigation buttons
  if (UIElements.firstBtn) {
    UIElements.firstBtn.addEventListener('click', () => goToFirstStep(appState));
  }
  
  if (UIElements.prevBtn) {
    UIElements.prevBtn.addEventListener('click', () => goToPreviousStep(appState));
  }
  
  if (UIElements.nextBtn) {
    UIElements.nextBtn.addEventListener('click', () => goToNextStep(appState));
  }
  
  if (UIElements.lastBtn) {
    UIElements.lastBtn.addEventListener('click', () => goToLastStep(appState));
  }
  
  // Play/pause button
  if (UIElements.playBtn) {
    UIElements.playBtn.addEventListener('click', () => toggleAutoExecution(appState));
  }
  
  // Speed control
  if (UIElements.speedControl) {
    UIElements.speedControl.addEventListener('input', () => updateExecutionSpeed(appState));
  }
  
  // Input area
  if (UIElements.inputArea) {
    UIElements.inputArea.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        const input = UIElements.inputArea.value.trim();
        processUserInput(appState, input);
        UIElements.inputArea.value = ''; // Clear input
      }
    });
  }
}

/**
 * Execute code and generate visualizations
 * @param {AppState} appState - Application state
 */
function executeCode(appState) {
  try {
    // Get code from editor
    appState.updateState({ code: appState.UIElements.codeInput.value });
    
    // Reset execution state
    appState.resetExecutionState();
    
    // Create lexer, parser and interpreter instances
    const lexer = new Lexer(appState);
    const parser = new Parser(appState);
    const interpreter = new Interpreter(appState);
    
    // Tokenize the code
    console.log("Starting tokenization...");
    const tokens = lexer.tokenize();
    appState.updateState({ tokens });
    console.log("Tokens generated:", tokens);
    
    // Generate AST
    console.log("Starting AST generation...");
    const ast = parser.parse();
    appState.updateState({ ast });
    console.log("AST generated:", ast);
    
    // Check for AST errors
    const astErrors = checkASTErrors();
    if (astErrors.length > 0) {
      console.warn("Warnings in AST, but continuing execution:", astErrors);
    }
    
    // Generate execution steps
    console.log("Generating execution steps...");
    const executionSteps = interpreter.generateExecutionSteps();
    appState.updateState({ executionSteps });
    console.log("Execution steps:", executionSteps);
    
    // Show first step
    updateControls(appState, true);
    goToFirstStep(appState);
    
  } catch (error) {
    console.error('Execution error:', error);
    showError(appState, error.message);
  }
}

/**
 * Check for errors in the AST
 * @returns {Array} Array of error messages
 */
function checkASTErrors() {
  // In a real implementation, this would analyze the AST for errors
  return [];
}

/**
 * Show error message in output
 * @param {AppState} appState - Application state
 * @param {string} message - Error message
 */
function showError(appState, message) {
  // Create visualizer instance to render error
  const visualizer = new Visualizer(appState);
  visualizer.showError(message);
}

/**
 * Process user input
 * @param {AppState} appState - Application state
 * @param {string} input - User input
 */
function processUserInput(appState, input) {
  try {
    // Try to evaluate as an expression
    const result = eval(input);
    
    // Add execution step
    appState.executionSteps.push({
      type: 'interactive',
      line: 0, // No specific line
      description: `Result: ${result}`,
      changes: {
        saida: `${result}\n`
      }
    });
    
    // Update visualizations
    const visualizer = new Visualizer(appState);
    visualizer.updateVisualizations();
    
    return result;
  } catch (error) {
    // If not an expression, try as a statement
    try {
      // Here you could add more sophisticated parsing
      Function(input)();
      
      appState.executionSteps.push({
        type: 'interactive',
        line: 0,
        description: 'Statement executed successfully',
        changes: {}
      });
      
      const visualizer = new Visualizer(appState);
      visualizer.updateVisualizations();
    } catch (statementError) {
      showError(appState, `Interactive mode error: ${statementError.message}`);
    }
  }
}

/**
 * Update controls state based on execution state
 * @param {AppState} appState - Application state
 * @param {boolean} enabled - Whether controls should be enabled
 */
function updateControls(appState, enabled) {
  const { UIElements, currentStep, executionSteps } = appState;
  
  if (UIElements.firstBtn) {
    UIElements.firstBtn.disabled = !enabled || currentStep === 0;
  }
  
  if (UIElements.prevBtn) {
    UIElements.prevBtn.disabled = !enabled || currentStep === 0;
  }
  
  if (UIElements.nextBtn) {
    UIElements.nextBtn.disabled = !enabled || currentStep >= executionSteps.length - 1;
  }
  
  if (UIElements.lastBtn) {
    UIElements.lastBtn.disabled = !enabled || currentStep >= executionSteps.length - 1;
  }
  
  if (enabled && executionSteps.length > 0) {
    if (UIElements.playBtn) {
      UIElements.playBtn.disabled = false;
    }
    
    if (UIElements.stepCounter) {
      UIElements.stepCounter.textContent = `Step ${currentStep + 1} of ${executionSteps.length}`;
    }
    
    // Update progress bar
    if (UIElements.progressFill) {
      const percentage = ((currentStep + 1) / executionSteps.length) * 100;
      UIElements.progressFill.style.width = `${percentage}%`;
    }
  } else {
    if (UIElements.playBtn) {
      UIElements.playBtn.disabled = true;
    }
    
    if (UIElements.stepCounter) {
      UIElements.stepCounter.textContent = 'Step 0 of 0';
    }
    
    if (UIElements.progressFill) {
      UIElements.progressFill.style.width = '0%';
    }
  }
}

/**
 * Go to the first execution step
 * @param {AppState} appState - Application state
 */
function goToFirstStep(appState) {
  if (appState.goToFirstStep()) {
    const visualizer = new Visualizer(appState);
    visualizer.updateVisualizations();
    updateControls(appState, true);
  }
}

/**
 * Go to the previous execution step
 * @param {AppState} appState - Application state
 */
function goToPreviousStep(appState) {
  if (appState.goToPreviousStep()) {
    const visualizer = new Visualizer(appState);
    visualizer.updateVisualizations();
    updateControls(appState, true);
  }
}

/**
 * Go to the next execution step
 * @param {AppState} appState - Application state
 */
function goToNextStep(appState) {
  if (appState.goToNextStep()) {
    const visualizer = new Visualizer(appState);
    visualizer.updateVisualizations();
    updateControls(appState, true);
  }
}

/**
 * Go to the last execution step
 * @param {AppState} appState - Application state
 */
function goToLastStep(appState) {
  if (appState.goToLastStep()) {
    const visualizer = new Visualizer(appState);
    visualizer.updateVisualizations();
    updateControls(appState, true);
  }
}

/**
 * Toggle automatic execution
 * @param {AppState} appState - Application state
 */
function toggleAutoExecution(appState) {
  const visualizer = new Visualizer(appState);
  
  // Use the method from AppState to handle interval logic
  appState.toggleAutoExecution(() => {
    visualizer.updateVisualizations();
    updateControls(appState, true);
  });
  
  // Update button appearance
  if (appState.UIElements.playBtn) {
    if (appState.isRunning) {
      appState.UIElements.playBtn.textContent = '❚❚ Pause';
      appState.UIElements.playBtn.classList.add('playing');
    } else {
      appState.UIElements.playBtn.textContent = '▶ Play';
      appState.UIElements.playBtn.classList.remove('playing');
    }
  }
}

/**
 * Update execution speed
 * @param {AppState} appState - Application state
 */
function updateExecutionSpeed(appState) {
  if (appState.UIElements.speedControl) {
    const speed = parseInt(appState.UIElements.speedControl.value);
    appState.updateExecutionSpeed(speed);
  }
}
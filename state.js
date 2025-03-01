/**
 * IFSCee - C Programming Visualization Tool
 * State management module
 */

/**
 * Token class for lexical analysis
 */
export class Token {
  /**
   * Create a new token
   * @param {string} type - Token type (keyword, identifier, operator, etc.)
   * @param {string} value - Token value
   * @param {number} line - Line number in source code
   * @param {number} column - Column number in source code
   */
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  /**
   * Convert token value to different number bases
   * @returns {Object|null} Object with decimal, hexadecimal, and binary representations
   */
  convertBase() {
    if (typeof this.value === 'string') {
      // Support 0x (hex), 0b (binary) prefixes
      if (this.value.startsWith('0x')) {
        return {
          decimal: parseInt(this.value, 16),
          hexadecimal: this.value.toUpperCase(),
          binary: parseInt(this.value, 16).toString(2)
        };
      }
      if (this.value.startsWith('0b')) {
        return {
          decimal: parseInt(this.value, 2),
          hexadecimal: parseInt(this.value, 2).toString(16).toUpperCase(),
          binary: this.value
        };
      }
    }
    return null;
  }
}

/**
 * Represents a C type with metadata
 */
export class TypeC {
  /**
   * Create a new C type
   * @param {string} type - Type name (int, char, etc.)
   * @param {*} value - Value of the variable
   */
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }

  /**
   * Get size of the type in bytes
   * @returns {number} Size in bytes
   */
  getSizeof() {
    switch (this.type) {
      case 'int': return 4;
      case 'char': return 1;
      case 'float': return 4;
      case 'double': return 8;
      case 'pointer': return 8; // Pointers in 64-bit systems
      default: return 0;
    }
  }

  /**
   * Get binary representation of the value
   * @returns {string|null} Binary string or null if not applicable
   */
  getBinaryRepresentation() {
    if (typeof this.value === 'number') {
      return this.value.toString(2).padStart(32, '0');
    }
    return null;
  }

  /**
   * Get detailed information about the type
   * @returns {Object} Type details
   */
  getDetails() {
    return {
      type: this.type,
      size: this.getSizeof(),
      value: this.value,
      binaryRepresentation: this.getBinaryRepresentation()
    };
  }
}

/**
 * AST Node for the abstract syntax tree
 */
export class ASTNode {
  /**
   * Create a new AST node
   * @param {string} type - Node type
   * @param {*} value - Node value
   * @param {Array} children - Child nodes
   */
  constructor(type, value = null, children = []) {
    this.type = type;
    this.value = value;
    this.children = children;
  }

  /**
   * Add a child node
   * @param {ASTNode} child - Child node to add
   */
  addChild(child) {
    this.children.push(child);
  }
}

/**
 * Execution step for simulation
 */
export class ExecutionStep {
  /**
   * Create a new execution step
   * @param {string} type - Step type
   * @param {number} line - Line number in source code
   * @param {string} description - Description of the step
   * @param {Object} changes - Changes to state
   */
  constructor(type, line, description, changes = {}) {
    this.type = type;
    this.line = line;
    this.description = description;
    this.changes = changes;
  }
}

/**
 * Stack frame for function calls
 */
export class StackFrame {
  /**
   * Create a new stack frame
   * @param {string} functionName - Function name
   * @param {number} returnAddress - Return address
   */
  constructor(functionName, returnAddress) {
    this.functionName = functionName;
    this.returnAddress = returnAddress;
    this.variables = {};
  }

  /**
   * Add a variable to the stack frame
   * @param {string} name - Variable name
   * @param {*} value - Variable value
   * @param {number} address - Memory address
   * @param {string} type - Variable type
   */
  addVariable(name, value, address, type) {
    this.variables[name] = { value, address, type };
  }

  /**
   * Update a variable in the stack frame
   * @param {string} name - Variable name
   * @param {*} value - New value
   */
  updateVariable(name, value) {
    if (this.variables[name]) {
      this.variables[name].value = value;
    }
  }
}

/**
 * Heap block for dynamic memory allocation
 */
export class HeapBlock {
  /**
   * Create a new heap block
   * @param {number} address - Memory address
   * @param {number} size - Size in bytes
   * @param {*} content - Block content
   */
  constructor(address, size, content) {
    this.address = address;
    this.size = size;
    this.content = content;
    this.freed = false;
  }
}

/**
 * Application state management class
 */
export class AppState {
  /**
   * Initialize the application state
   */
  constructor() {
    // Core state
    this.code = "";
    this.tokens = [];
    this.ast = null;
    this.executionSteps = [];
    this.currentStep = 0;
    this.memory = {};
    this.stack = [];
    this.heap = {};
    this.isRunning = false;
    this.executionSpeed = 5;
    this.userInput = "";
    this.consoleOutput = "";
    this.intervalId = null;
    this.errors = [];
    
    // UI references
    this.UIElements = {};
    
    // Example code repository
    this.examples = {};
    
    // File handling state
    this.openFiles = {};
    
    // Compilation process tracking
    this.compilationProcess = {
      currentPhase: 'none',
      preprocessing: [],
      tokenization: [],
      semanticAnalysis: [],
      codeGeneration: [],
      warnings: [],
      errors: []
    };
    
    // Subscribers for state changes (observer pattern)
    this.subscribers = [];
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function to be called on state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Update state and notify subscribers
   * @param {Object} updates - Object with state updates
   */
  updateState(updates) {
    Object.assign(this, updates);
    this.notifySubscribers();
  }
  
  /**
   * Notify all subscribers of state changes
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this));
  }
  
  /**
   * Load an example code by key
   * @param {string} key - Example key
   */
  loadExample(key) {
    if (this.examples[key]) {
      this.updateState({ code: this.examples[key] });
      
      // Update the code input element if it exists
      if (this.UIElements.codeInput) {
        this.UIElements.codeInput.value = this.examples[key];
      }
    }
  }
  
  /**
   * Reset the execution state
   */
  resetExecutionState() {
    this.updateState({
      tokens: [],
      ast: null,
      executionSteps: [],
      currentStep: 0,
      memory: {},
      stack: [],
      heap: {},
      isRunning: false,
      consoleOutput: "",
      errors: []
    });
    
    // Clear any running execution interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Go to the specified execution step
   * @param {number} stepIndex - Step index
   */
  goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.executionSteps.length) {
      this.updateState({ currentStep: stepIndex });
      return true;
    }
    return false;
  }
  
  /**
   * Go to the first execution step
   * @returns {boolean} Success indicator
   */
  goToFirstStep() {
    return this.goToStep(0);
  }
  
  /**
   * Go to the previous execution step
   * @returns {boolean} Success indicator
   */
  goToPreviousStep() {
    return this.goToStep(this.currentStep - 1);
  }
  
  /**
   * Go to the next execution step
   * @returns {boolean} Success indicator
   */
  goToNextStep() {
    return this.goToStep(this.currentStep + 1);
  }
  
  /**
   * Go to the last execution step
   * @returns {boolean} Success indicator
   */
  goToLastStep() {
    return this.goToStep(this.executionSteps.length - 1);
  }
  
  /**
   * Toggle automatic execution
   * @param {Function} stepRenderer - Function to be called on each step
   */
  toggleAutoExecution(stepRenderer) {
    const newRunningState = !this.isRunning;
    
    if (newRunningState) {
      // Start automatic execution
      this.intervalId = setInterval(() => {
        if (this.currentStep < this.executionSteps.length - 1) {
          this.goToNextStep();
          stepRenderer(this);
        } else {
          // Stop when reaching the end
          this.toggleAutoExecution(stepRenderer);
        }
      }, 1000 / this.executionSpeed);
    } else {
      // Stop automatic execution
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
    
    this.updateState({ isRunning: newRunningState });
  }
  
  /**
   * Update execution speed
   * @param {number} speed - Speed value (1-10)
   */
  updateExecutionSpeed(speed) {
    this.updateState({ executionSpeed: speed });
    
    // Update running interval if auto-execution is active
    if (this.isRunning && this.intervalId) {
      clearInterval(this.intervalId);
      this.toggleAutoExecution(() => {});
    }
  }
  
  /**
   * Add an error message
   * @param {string} message - Error message
   * @param {string} type - Error type (error, warning)
   */
  addError(message, type = 'error') {
    const errors = [...this.errors, { message, type, time: new Date() }];
    this.updateState({ errors });
  }
}
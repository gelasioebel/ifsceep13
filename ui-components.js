/**
 * IFSCee - C Programming Visualization Tool
 * UI components and initialization
 */

/**
 * Initialize the UI components
 * @param {AppState} appState - Application state
 */
export function initializeUI(appState) {
  // Get UI elements
  const elements = {
    codeInput: document.getElementById('code-input'),
    exampleSelector: document.getElementById('example-selector'),
    runBtn: document.getElementById('run-btn'),
    firstBtn: document.getElementById('first-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    lastBtn: document.getElementById('last-btn'),
    playBtn: document.getElementById('play-btn'),
    speedControl: document.getElementById('speed-control'),
    progressFill: document.getElementById('progress-fill'),
    stepCounter: document.getElementById('step-counter'),
    inputArea: document.getElementById('input-area'),
    outputConsole: document.getElementById('output-console'),
    memoryContainer: document.getElementById('memory-container'),
    stackContainer: document.getElementById('stack-container'),
    heapContainer: document.getElementById('heap-container'),
    heapEmptyMessage: document.getElementById('heap-empty-message'),
    tokenContainer: document.getElementById('token-container'),
    astContainer: document.getElementById('ast-container')
  };
  
  // Store UI elements in app state
  appState.UIElements = elements;
  
  // Configure example selector
  configureExampleSelector(appState);
  
  // Add educational buttons
  addEducationalButtons(appState);
}

/**
 * Configure example selector dropdown
 * @param {AppState} appState - Application state
 */
function configureExampleSelector(appState) {
  const selector = appState.UIElements.exampleSelector;
  if (!selector) return;
  
  // Clear existing options
  selector.innerHTML = '';
  
  // Add options for each example
  Object.keys(appState.examples).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.text = formatExampleName(key);
    selector.appendChild(option);
  });
}

/**
 * Format example name to be more readable
 * @param {string} name - Example name
 * @returns {string} Formatted name
 */
function formatExampleName(name) {
  // Convert camelCase or snake_case to readable text
  const formatted = name
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/_/g, ' ')         // Replace underscores with spaces
    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  
  return formatted;
}

/**
 * Add educational buttons to the UI
 * @param {AppState} appState - Application state
 */
function addEducationalButtons(appState) {
  // Create container for educational buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.classList.add('educational-buttons');
  buttonsContainer.style.marginTop = '15px';
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.justifyContent = 'space-between';
  buttonsContainer.style.padding = '10px';
  buttonsContainer.style.backgroundColor = '#f5f5f5';
  buttonsContainer.style.borderRadius = '5px';
  buttonsContainer.style.border = '1px solid #ddd';
  
  // Button for compilation process
  const compilationBtn = document.createElement('button');
  compilationBtn.textContent = '🔍 View Compilation Process';
  compilationBtn.className = 'nav-button';
  compilationBtn.onclick = () => showCompilationProcess(appState);
  
  // Button for pointer explanation
  const pointersBtn = document.createElement('button');
  pointersBtn.textContent = '🔗 Explain Pointers';
  pointersBtn.className = 'nav-button';
  pointersBtn.onclick = () => showPointersExplanation(appState);
  
  // Button for operators guide
  const operatorsBtn = document.createElement('button');
  operatorsBtn.textContent = '⚙️ Operators Guide';
  operatorsBtn.className = 'nav-button';
  operatorsBtn.onclick = () => showOperatorsGuide(appState);
  
  // Button for best practices
  const practicesBtn = document.createElement('button');
  practicesBtn.textContent = '📝 C Best Practices';
  practicesBtn.className = 'nav-button';
  practicesBtn.onclick = () => showBestPractices(appState);
  
  // Add buttons to container
  buttonsContainer.appendChild(compilationBtn);
  buttonsContainer.appendChild(pointersBtn);
  buttonsContainer.appendChild(operatorsBtn);
  buttonsContainer.appendChild(practicesBtn);
  
  // Insert before code editor
  const editorContainer = appState.UIElements.codeInput.parentNode;
  editorContainer.parentNode.insertBefore(buttonsContainer, editorContainer);
}

/**
 * Show compilation process modal
 * @param {AppState} appState - Application state
 */
function showCompilationProcess(appState) {
  // Create modal overlay
  const overlay = createModalOverlay();
  
  // Create modal content
  const modal = createModal('Compilation Process in C');
  
  // Create process sections
  const process = createCompilationProcess();
  
  // Create content for each compilation phase
  const content = document.createElement('div');
  
  // Compilation phases
  const phases = [
    {
      name: 'Preprocessing',
      description: 'In this phase, the preprocessor executes all directives that start with #, such as #include, #define, #ifdef, etc.',
      results: process.preprocessing
    },
    {
      name: 'Tokenization and Syntax Analysis',
      description: 'The compiler breaks the code into tokens and checks if the structure follows the grammatical rules of the C language.',
      results: process.tokenization
    },
    {
      name: 'Semantic Analysis',
      description: 'This checks if the code makes logical sense, such as using variables of the correct type, properly defined functions, etc.',
      results: process.semanticAnalysis
    },
    {
      name: 'Code Generation',
      description: 'Translates C code to machine code or intermediate code that will be executed by the computer.',
      results: process.codeGeneration
    }
  ];
  
  // Add each phase to content
  phases.forEach(phase => {
    const phaseContainer = document.createElement('div');
    phaseContainer.style.marginBottom = '20px';
    phaseContainer.style.padding = '15px';
    phaseContainer.style.backgroundColor = '#f9f9f9';
    phaseContainer.style.borderRadius = '5px';
    phaseContainer.style.border = '1px solid #ddd';
    
    const phaseTitle = document.createElement('h3');
    phaseTitle.textContent = phase.name;
    phaseTitle.style.marginBottom = '10px';
    phaseTitle.style.borderBottom = '1px solid #ddd';
    phaseTitle.style.paddingBottom = '5px';
    
    const phaseDesc = document.createElement('p');
    phaseDesc.textContent = phase.description;
    phaseDesc.style.marginBottom = '10px';
    
    phaseContainer.appendChild(phaseTitle);
    phaseContainer.appendChild(phaseDesc);
    
    // Results of the phase
    if (phase.results.length > 0) {
      const resultsTitle = document.createElement('h4');
      resultsTitle.textContent = 'Results:';
      resultsTitle.style.marginBottom = '5px';
      phaseContainer.appendChild(resultsTitle);
      
      const resultsList = document.createElement('ul');
      resultsList.style.marginLeft = '20px';
      
      phase.results.forEach(result => {
        const item = document.createElement('li');
        item.textContent = result;
        resultsList.appendChild(item);
      });
      
      phaseContainer.appendChild(resultsList);
    } else {
      const noResults = document.createElement('p');
      noResults.textContent = 'No results to show for this phase.';
      noResults.style.fontStyle = 'italic';
      noResults.style.color = '#777';
      phaseContainer.appendChild(noResults);
    }
    
    content.appendChild(phaseContainer);
  });
  
  // Warnings and errors
  if (process.warnings.length > 0 || process.errors.length > 0) {
    const problemsContainer = document.createElement('div');
    problemsContainer.style.marginBottom = '20px';
    problemsContainer.style.padding = '15px';
    problemsContainer.style.backgroundColor = '#fff3e0';
    problemsContainer.style.borderRadius = '5px';
    problemsContainer.style.border = '1px solid #ffcc80';
    
    const problemsTitle = document.createElement('h3');
    problemsTitle.textContent = 'Warnings and Errors';
    problemsTitle.style.marginBottom = '10px';
    problemsTitle.style.borderBottom = '1px solid #ffcc80';
    problemsTitle.style.paddingBottom = '5px';
    
    problemsContainer.appendChild(problemsTitle);
    
    // Warnings
    if (process.warnings.length > 0) {
      const warningsTitle = document.createElement('h4');
      warningsTitle.textContent = 'Warnings:';
      warningsTitle.style.color = '#ff9800';
      problemsContainer.appendChild(warningsTitle);
      
      const warningsList = document.createElement('ul');
      process.warnings.forEach(warning => {
        const item = document.createElement('li');
        item.textContent = warning;
        warningsList.appendChild(item);
      });
      
      problemsContainer.appendChild(warningsList);
    }
    
    // Errors
    if (process.errors.length > 0) {
      const errorsTitle = document.createElement('h4');
      errorsTitle.textContent = 'Errors:';
      errorsTitle.style.color = '#f44336';
      problemsContainer.appendChild(errorsTitle);
      
      const errorsList = document.createElement('ul');
      process.errors.forEach(error => {
        const item = document.createElement('li');
        item.textContent = error;
        errorsList.appendChild(item);
      });
      
      problemsContainer.appendChild(errorsList);
    }
    
    content.appendChild(problemsContainer);
  }
  
  // Add content to modal
  modal.appendChild(content);
  
  // Add modal to overlay
  overlay.appendChild(modal);
  
  // Add to document
  document.body.appendChild(overlay);
}

/**
 * Create a simulated compilation process
 * @returns {Object} Compilation process object
 */
function createCompilationProcess() {
  return {
    preprocessing: [
      'Processing #include directives',
      'Expanding macros defined with #define',
      'Evaluating conditional compilation directives (#ifdef, #ifndef, etc.)'
    ],
    tokenization: [
      'Identifying keywords, identifiers, operators, and literals',
      'Creating a stream of tokens for the parser',
      'Validating token sequence according to C grammar'
    ],
    semanticAnalysis: [
      'Checking variable declarations before use',
      'Validating type compatibility in expressions',
      'Ensuring all functions are properly defined or declared'
    ],
    codeGeneration: [
      'Generating intermediate representation',
      'Performing optimizations',
      'Producing final machine code or object files'
    ],
    warnings: [
      'Using uninitialized variables',
      'Implicit type conversions that may lose precision',
      'Unused variables or functions'
    ],
    errors: [
      'Undeclared variables or functions',
      'Type mismatches in assignments',
      'Missing semicolons or other syntax errors'
    ]
  };
}

/**
 * Show pointers explanation modal
 * @param {AppState} appState - Application state
 */
function showPointersExplanation(appState) {
  // Create modal overlay
  const overlay = createModalOverlay();
  
  // Create modal content
  const modal = createModal('Understanding Pointers in C');
  
  // Create content for pointers explanation
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h3>What are Pointers?</h3>
      <p>Pointers are variables that store memory addresses. They "point" to the location where another variable is stored.</p>
      
      <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
        <code>int *ptr;    // Declaration of a pointer to an integer</code>
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>Pointer Operators</h3>
      <ul>
        <li><strong>&</strong> (address-of operator): Gets the address of a variable</li>
        <li><strong>*</strong> (dereference operator): Accesses the value pointed to by the pointer</li>
      </ul>
      
      <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
        <code>
          int x = 10;<br>
          int *ptr = &x;    // ptr gets the address of x<br>
          printf("%d", *ptr);    // Prints 10 (value pointed to by ptr)
        </code>
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>Visual Representation of Pointers</h3>
      <div style="display: flex; margin: 20px 0;">
        <div style="border: 2px solid #333; padding: 10px; margin-right: 20px; text-align: center;">
          <div style="font-weight: bold;">Variable x</div>
          <div>Value: 10</div>
          <div style="font-size: 0.8em; color: #666;">Address: 0x1000</div>
        </div>
        
        <div style="display: flex; align-items: center; margin-right: 20px;">
          <div style="font-size: 24px;">←</div>
        </div>
        
        <div style="border: 2px solid #4CAF50; padding: 10px; text-align: center;">
          <div style="font-weight: bold;">Pointer ptr</div>
          <div>Value: 0x1000</div>
          <div style="font-size: 0.8em; color: #666;">Address: 0x2000</div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>Why Use Pointers?</h3>
      <ol>
        <li><strong>Pass by reference</strong>: Allows modifying variables inside functions</li>
        <li><strong>Dynamic memory allocation</strong>: Using malloc(), calloc(), etc.</li>
        <li><strong>Efficient data structure manipulation</strong>: Arrays, linked lists, trees</li>
        <li><strong>Hardware access</strong>: Manipulating specific memory addresses</li>
      </ol>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>Pointer Pitfalls</h3>
      <ul>
        <li><strong>Uninitialized pointers</strong>: Cause undefined behavior</li>
        <li><strong>Dangling pointers</strong>: Point to memory that has been freed</li>
        <li><strong>Memory leaks</strong>: When allocated memory is not freed</li>
        <li><strong>Pointer arithmetic</strong>: Be careful with array bounds</li>
      </ul>
    </div>
    
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3>Important Tip</h3>
      <p>Always initialize your pointers, either with a valid address or with NULL. This prevents unpredictable behavior in your program.</p>
      <code>
        int *ptr = NULL;    // Good practice
      </code>
    </div>
  `;
  
  // Add content to modal
  modal.appendChild(content);
  
  // Add modal to overlay
  overlay.appendChild(modal);
  
  // Add to document
  document.body.appendChild(overlay);
}

/**
 * Show operators guide modal
 * @param {AppState} appState - Application state
 */
function showOperatorsGuide(appState) {
  // Create modal overlay
  const overlay = createModalOverlay();
  
  // Create modal content
  const modal = createModal('C Operators Guide');
  
  // Create content for operators guide
  const content = document.createElement('div');
  
  // Operator categories
  const categories = [
    {
      name: 'Arithmetic Operators',
      description: 'Used for basic mathematical operations.',
      operators: [
        {symbol: '+', description: 'Addition', example: 'a + b'},
        {symbol: '-', description: 'Subtraction', example: 'a - b'},
        {symbol: '*', description: 'Multiplication', example: 'a * b'},
        {symbol: '/', description: 'Division', example: 'a / b'},
        {symbol: '%', description: 'Modulo (remainder)', example: 'a % b'},
        {symbol: '++', description: 'Increment', example: 'a++ or ++a'},
        {symbol: '--', description: 'Decrement', example: 'a-- or --a'}
      ]
    },
    {
      name: 'Relational Operators',
      description: 'Used to compare values.',
      operators: [
        {symbol: '==', description: 'Equal to', example: 'a == b'},
        {symbol: '!=', description: 'Not equal to', example: 'a != b'},
        {symbol: '>', description: 'Greater than', example: 'a > b'},
        {symbol: '<', description: 'Less than', example: 'a < b'},
        {symbol: '>=', description: 'Greater than or equal to', example: 'a >= b'},
        {symbol: '<=', description: 'Less than or equal to', example: 'a <= b'}
      ]
    },
    {
      name: 'Logical Operators',
      description: 'Used to combine logical conditions.',
      operators: [
        {symbol: '&&', description: 'Logical AND', example: 'a && b'},
        {symbol: '||', description: 'Logical OR', example: 'a || b'},
        {symbol: '!', description: 'Logical NOT', example: '!a'}
      ]
    },
    {
      name: 'Bitwise Operators',
      description: 'Operate on individual bits of operands.',
      operators: [
        {symbol: '&', description: 'Bitwise AND', example: 'a & b'},
        {symbol: '|', description: 'Bitwise OR', example: 'a | b'},
        {symbol: '^', description: 'Bitwise XOR', example: 'a ^ b'},
        {symbol: '~', description: 'Bitwise complement (NOT)', example: '~a'},
        {symbol: '<<', description: 'Left shift', example: 'a << n'},
        {symbol: '>>', description: 'Right shift', example: 'a >> n'}
      ]
    },
    {
      name: 'Assignment Operators',
      description: 'Used to assign values to variables.',
      operators: [
        {symbol: '=', description: 'Simple assignment', example: 'a = b'},
        {symbol: '+=', description: 'Add and assign', example: 'a += b (equivalent to a = a + b)'},
        {symbol: '-=', description: 'Subtract and assign', example: 'a -= b (equivalent to a = a - b)'},
        {symbol: '*=', description: 'Multiply and assign', example: 'a *= b (equivalent to a = a * b)'},
        {symbol: '/=', description: 'Divide and assign', example: 'a /= b (equivalent to a = a / b)'},
        {symbol: '%=', description: 'Modulo and assign', example: 'a %= b (equivalent to a = a % b)'},
        {symbol: '&=, |=, ^=, <<=, >>=', description: 'Bitwise operation and assign', example: 'a &= b, a |= b, etc.'}
      ]
    },
    {
      name: 'Special Operators',
      description: 'Other operators with specific functions.',
      operators: [
        {symbol: '&', description: 'Address operator', example: '&a (returns the address of a)'},
        {symbol: '*', description: 'Dereference operator', example: '*ptr (accesses the value pointed to by ptr)'},
        {symbol: '->', description: 'Structure member access via pointer', example: 'ptr->member'},
        {symbol: '.', description: 'Structure member access', example: 'structure.member'},
        {symbol: '[]', description: 'Array indexing', example: 'array[i]'},
        {symbol: '?:', description: 'Ternary operator', example: 'condition ? value_if_true : value_if_false'},
        {symbol: 'sizeof', description: 'Size in bytes', example: 'sizeof(int)'}
      ]
    }
  ];
  
  // For each category, create a section
  categories.forEach(category => {
    const categoryContainer = document.createElement('div');
    categoryContainer.style.marginBottom = '25px';
    
    // Category title
    const categoryTitle = document.createElement('h3');
    categoryTitle.textContent = category.name;
    categoryTitle.style.color = '#2196F3';
    categoryTitle.style.borderBottom = '2px solid #2196F3';
    categoryTitle.style.paddingBottom = '5px';
    categoryContainer.appendChild(categoryTitle);
    
    // Category description
    const categoryDesc = document.createElement('p');
    categoryDesc.textContent = category.description;
    categoryDesc.style.marginBottom = '10px';
    categoryContainer.appendChild(categoryDesc);
    
    // Operators table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '15px';
    
    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Operator', 'Description', 'Example'].forEach(column => {
      const th = document.createElement('th');
      th.textContent = column;
      th.style.padding = '8px';
      th.style.backgroundColor = '#f5f5f5';
      th.style.textAlign = 'left';
      th.style.border = '1px solid #ddd';
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    
    category.operators.forEach((op, index) => {
      const row = document.createElement('tr');
      
      // Alternate row colors
      if (index % 2 === 1) {
        row.style.backgroundColor = '#f9f9f9';
      }
      
      // Cells for each column
      [op.symbol, op.description, op.example].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        td.style.padding = '8px';
        td.style.border = '1px solid #ddd';
        row.appendChild(td);
      });
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    categoryContainer.appendChild(table);
    
    content.appendChild(categoryContainer);
  });
  
  // Operator precedence tip
  const precedenceTip = document.createElement('div');
  precedenceTip.style.backgroundColor = '#e8f5e9';
  precedenceTip.style.padding = '15px';
  precedenceTip.style.borderRadius = '5px';
  precedenceTip.style.marginTop = '20px';
  precedenceTip.style.borderLeft = '4px solid #4CAF50';
  
  const tipTitle = document.createElement('h3');
  tipTitle.textContent = 'Operator Precedence';
  tipTitle.style.marginTop = '0';
  
  const tipText = document.createElement('p');
  tipText.innerHTML = 'In complex expressions, operators are evaluated in a specific order. Use parentheses to ensure the desired evaluation order.<br><br>Precedence order (highest to lowest):<br>1. Parentheses ()<br>2. Unary operators (+, -, !, ~, ++, --, &, *, sizeof)<br>3. Multiplication, division, modulo (*, /, %)<br>4. Addition, subtraction (+, -)<br>5. Bitwise shifts (<<, >>)<br>6. Relational (<, <=, >, >=)<br>7. Equality (==, !=)<br>8. Bitwise AND (&)<br>9. Bitwise XOR (^)<br>10. Bitwise OR (|)<br>11. Logical AND (&&)<br>12. Logical OR (||)<br>13. Conditional (?:)<br>14. Assignment (=, +=, -=, etc.)<br>15. Comma (,)';
  
  precedenceTip.appendChild(tipTitle);
  precedenceTip.appendChild(tipText);
  
  content.appendChild(precedenceTip);
  
  // Add content to modal
  modal.appendChild(content);
  
  // Add modal to overlay
  overlay.appendChild(modal);
  
  // Add to document
  document.body.appendChild(overlay);
}

/**
 * Show best practices modal
 * @param {AppState} appState - Application state
 */
function showBestPractices(appState) {
  // Create modal overlay
  const overlay = createModalOverlay();
  
  // Create modal content
  const modal = createModal('C Programming Best Practices');
  
  // Create content for best practices
  const content = document.createElement('div');
  
  // Best practices categories
  const practices = [
    {
      title: 'Memory Management',
      items: [
        'Always free dynamically allocated memory (free() for each malloc())',
        'Check if malloc() returned NULL before using the pointer',
        'Set pointers to NULL after freeing them to avoid dangling pointers',
        'Check all execution paths to prevent memory leaks',
        'Use tools like Valgrind to detect memory issues'
      ]
    },
    {
      title: 'Pointers and Arrays',
      items: [
        'Initialize pointers before use (NULL or valid address)',
        'Check array bounds to avoid buffer overflows',
        'Be careful with pointer arithmetic, especially in arrays',
        'Prefer using sizeof() for calculating sizes to avoid hardcoding',
        'When passing arrays to functions, also pass the size as a parameter'
      ]
    },
    {
      title: 'Code Structure',
      items: [
        'Use small, focused functions (single responsibility principle)',
        'Document your code with clear, meaningful comments',
        'Follow a consistent coding style throughout the project',
        'Avoid global variables when possible',
        'Use meaningful names for variables, functions, and types'
      ]
    },
    {
      title: 'Error Handling',
      items: [
        'Always check return values from functions',
        'Use error codes or structures to propagate error information',
        'Implement consistent error handling throughout the code',
        'Log detailed error messages for easier debugging',
        'Consider all possible failures, especially in I/O operations'
      ]
    }
  ];
  
  // Add each practice category
  practices.forEach(practice => {
    const section = document.createElement('div');
    section.style.marginBottom = '25px';
    
    // Section title
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = practice.title;
    sectionTitle.style.color = '#2196F3';
    sectionTitle.style.borderBottom = '2px solid #2196F3';
    sectionTitle.style.paddingBottom = '5px';
    section.appendChild(sectionTitle);
    
    // List of items
    const list = document.createElement('ul');
    list.style.paddingLeft = '20px';
    
    practice.items.forEach(item => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      listItem.style.marginBottom = '8px';
      listItem.style.lineHeight = '1.4';
      list.appendChild(listItem);
    });
    
    section.appendChild(list);
    content.appendChild(section);
  });
  
  // Example of clean code
  const exampleContainer = document.createElement('div');
  exampleContainer.style.backgroundColor = '#f5f5f5';
  exampleContainer.style.padding = '15px';
  exampleContainer.style.borderRadius = '5px';
  exampleContainer.style.marginTop = '20px';
  
  const exampleTitle = document.createElement('h3');
  exampleTitle.textContent = 'Well-Structured Code Example';
  exampleTitle.style.marginTop = '0';
  
  const exampleCode = document.createElement('pre');
  exampleCode.style.backgroundColor = '#f9f9f9';
  exampleCode.style.padding = '15px';
  exampleCode.style.borderRadius = '5px';
  exampleCode.style.overflow = 'auto';
  exampleCode.style.fontFamily = 'monospace';
  
  exampleCode.textContent = `/**
* linked_list.h - Interface for linked list operations
*/
#ifndef LINKED_LIST_H
#define LINKED_LIST_H

typedef struct Node {
    int value;
    struct Node* next;
} Node;

/**
* Creates a new node with the specified value
* @param value The value to store in the node
* @return Pointer to the new node or NULL if failed
*/
Node* create_node(int value);

/**
* Inserts a value at the end of the list
* @param head Pointer to the first node of the list
* @param value Value to be inserted
* @return Updated pointer to the first node
*/
Node* insert_at_end(Node* head, int value);

/**
* Frees all memory allocated for the list
* @param head Pointer to the first node of the list
*/
void free_list(Node* head);

#endif /* LINKED_LIST_H */

/**
* linked_list.c - Implementation of linked list operations
*/
#include "linked_list.h"
#include <stdlib.h>
#include <stdio.h>

Node* create_node(int value) {
    Node* new_node = (Node*)malloc(sizeof(Node));
    if (new_node == NULL) {
        fprintf(stderr, "Error: Memory allocation failed\\n");
        return NULL;
    }

    new_node->value = value;
    new_node->next = NULL;
    return new_node;
}

Node* insert_at_end(Node* head, int value) {
    Node* new_node = create_node(value);
    if (new_node == NULL) {
        return head; // Node creation failed
    }

    // Empty list
    if (head == NULL) {
        return new_node;
    }

    // Find last node
    Node* current = head;
    while (current->next != NULL) {
        current = current->next;
    }

    current->next = new_node;
    return head;
}

void free_list(Node* head) {
    Node* current = head;
    Node* next = NULL;

    while (current != NULL) {
        next = current->next;
        free(current);
        current = next;
    }
}`;
  
  exampleContainer.appendChild(exampleTitle);
  exampleContainer.appendChild(exampleCode);
  
  content.appendChild(exampleContainer);
  
  // Add content to modal
  modal.appendChild(content);
  
  // Add modal to overlay
  overlay.appendChild(modal);
  
  // Add to document
  document.body.appendChild(overlay);
}

/**
 * Create a modal overlay
 * @returns {HTMLElement} Modal overlay element
 */
function createModalOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '1000';
  
  // Close on click outside
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
  
  return overlay;
}

/**
 * Create a modal element
 * @param {string} title - Modal title
 * @returns {HTMLElement} Modal element
 */
function createModal(title) {
  const modal = document.createElement('div');
  modal.style.backgroundColor = 'white';
  modal.style.padding = '20px';
  modal.style.borderRadius = '5px';
  modal.style.width = '80%';
  modal.style.maxWidth = '800px';
  modal.style.maxHeight = '80%';
  modal.style.overflow = 'auto';
  modal.style.position = 'relative';
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.border = 'none';
  closeButton.style.background = 'none';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    const overlay = closeButton.closest('div').parentNode;
    document.body.removeChild(overlay);
  };
  
  // Title
  const modalTitle = document.createElement('h2');
  modalTitle.textContent = title;
  modalTitle.style.marginBottom = '20px';
  modalTitle.style.color = '#4CAF50';
  
  // Add title and close button
  modal.appendChild(closeButton);
  modal.appendChild(modalTitle);
  
  return modal;
}
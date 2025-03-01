/**
 * IFSCee - C Programming Visualization Tool
 * Interpreter module for execution simulation
 */

import { ExecutionStep, StackFrame, HeapBlock } from './state.js';

/**
 * Load example code into appState
 * @param {AppState} appState - Application state
 */
export function loadExamples(appState) {
  appState.examples = {
    basic: `//Example: Variables and Pointers in C
#include <stdio.h>

int main() {
    int x = 10;
    int y = 20;
    int *ptr = &x;

    printf("x = %d, y = %d\\n", x, y);
    printf("*ptr = %d\\n", *ptr);

    *ptr = 30;
    printf("After *ptr = 30, x = %d\\n", x);

    ptr = &y;
    *ptr = 40;
    printf("After ptr = &y and *ptr = 40, y = %d\\n", y);

    return 0;
}`,
    array: `//Example: Arrays and Pointers
#include <stdio.h>

int main() {
    int numeros[5] = {10, 20, 30, 40, 50};
    int *ptr = numeros;

    printf("Endereço de numeros: %p\\n", numeros);
    printf("Valor de ptr: %p\\n", ptr);

    for(int i = 0; i < 5; i++) {
        printf("numeros[%d] = %d, *(ptr+%d) = %d\\n",
               i, numeros[i], i, *(ptr+i));
    }

    ptr = &numeros[2];
    printf("\\nptr agora aponta para numeros[2]\\n");
    printf("*ptr = %d\\n", *ptr);
    printf("ptr[-1] = %d, ptr[1] = %d\\n", ptr[-1], ptr[1]);

    return 0;
}`,
    malloc: `//Example: Dynamic Memory Allocation
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *ptr;
    int n = 5;

    // Alocação de memória para um array de inteiros
    ptr = (int*)malloc(n * sizeof(int));

    if(ptr == NULL) {
        printf("Erro na alocação de memória\\n");
        return 1;
    }

    // Inicializando valores
    for(int i = 0; i < n; i++) {
        ptr[i] = i * 10;
    }

    // Exibindo valores
    for(int i = 0; i < n; i++) {
        printf("ptr[%d] = %d\\n", i, ptr[i]);
    }

    // Liberando memória
    free(ptr);

    // ptr agora é um ponteiro pendente!
    // ptr = NULL; // Boa prática

    return 0;
}`,
    struct: `//Example: Structures and Complex Data Types
#include <stdio.h>
#include <string.h>

struct Pessoa {
    char nome[50];
    int idade;
    float altura;
};

void exibirPessoa(struct Pessoa p) {
    printf("Nome: %s\\n", p.nome);
    printf("Idade: %d\\n", p.idade);
    printf("Altura: %.2f\\n", p.altura);
}

int main() {
    struct Pessoa pessoa1;

    strcpy(pessoa1.nome, "João");
    pessoa1.idade = 25;
    pessoa1.altura = 1.75;

    printf("Dados da pessoa:\\n");
    exibirPessoa(pessoa1);

    struct Pessoa *ptrPessoa = &pessoa1;

    printf("\\nUsando ponteiro:\\n");
    printf("Nome: %s\\n", ptrPessoa->nome);
    printf("Idade: %d\\n", ptrPessoa->idade);
    printf("Altura: %.2f\\n", ptrPessoa->altura);

    return 0;
}`,
    recursion: `//Example: Recursive Function Calls
#include <stdio.h>

int fatorial(int n) {
    if (n == 0 || n == 1) {
        return 1;
    } else {
        return n * fatorial(n - 1);
    }
}

void contarRegressiva(int n) {
    if (n <= 0) {
        printf("Fim!\\n");
    } else {
        printf("%d\\n", n);
        contarRegressiva(n - 1);
    }
}

int main() {
    int num = 5;

    printf("Fatorial de %d = %d\\n", num, fatorial(num));

    printf("\\nContagem regressiva a partir de %d:\\n", num);
    contarRegressiva(num);

    return 0;
}`,
    custom: `// Type your custom code here
#include <stdio.h>

int main() {
    printf("Hello, world!\\n");
    return 0;
}`
  };

  // Additional advanced examples
  const advancedExamples = {
    fileio: `//Example: File Handling
#include <stdio.h>
#include <stdlib.h>

int main() {
    FILE *arquivo;
    char buffer[100];

    // Opening file for writing
    arquivo = fopen("example.txt", "w");
    if(arquivo == NULL) {
        printf("Error opening file for writing\\n");
        return 1;
    }

    // Writing to file
    fprintf(arquivo, "Test write to file\\n");
    fprintf(arquivo, "Second line of test\\n");

    // Closing file
    fclose(arquivo);

    // Opening file again for reading
    arquivo = fopen("example.txt", "r");
    if(arquivo == NULL) {
        printf("Error opening file for reading\\n");
        return 1;
    }

    // Reading and displaying content
    printf("File content:\\n");
    while(fgets(buffer, 100, arquivo) != NULL) {
        printf("%s", buffer);
    }

    // Closing file
    fclose(arquivo);

    return 0;
}`,
    switchcase: `//Example: Switch-Case in C
#include <stdio.h>

int main() {
    int option;

    printf("Enter a number from 1 to 5: ");
    scanf("%d", &option);

    switch(option) {
        case 1:
            printf("You chose option 1\\n");
            break;
        case 2:
            printf("You chose option 2\\n");
            break;
        case 3:
            printf("You chose option 3\\n");
            break;
        case 4:
            printf("You chose option 4\\n");
            break;
        case 5:
            printf("You chose option 5\\n");
            break;
        default:
            printf("Invalid option!\\n");
    }

    return 0;
}`,
    preprocessor: `//Example: Preprocessor Directives
#include <stdio.h>

#define PI 3.14159
#define CIRCLE_AREA(r) (PI * (r) * (r))
#define MAX(a, b) ((a) > (b) ? (a) : (b))

int main() {
    float radius = 5.0;
    float area = CIRCLE_AREA(radius);

    printf("Area of circle with radius %.2f: %.2f\\n", radius, area);

    int x = 10, y = 20;
    printf("Larger value between %d and %d: %d\\n", x, y, MAX(x, y));

    #ifdef DEBUG
    printf("Debug mode enabled\\n");
    #else
    printf("Debug mode disabled\\n");
    #endif

    return 0;
}`,
    bitwise: `//Example: Bitwise Operations
#include <stdio.h>

// Function to print a number in binary
void printBinary(int n) {
    if (n > 1) {
        printBinary(n >> 1);
    }
    printf("%d", n & 1);
}

int main() {
    int a = 12;  // 1100 in binary
    int b = 10;  // 1010 in binary

    printf("a = %d (", a);
    printBinary(a);
    printf(")\\n");

    printf("b = %d (", b);
    printBinary(b);
    printf(")\\n");

    // Bitwise operations
    printf("\\nBitwise operations:\\n");

    // AND
    int result_and = a & b; // 1000 (8 in decimal)
    printf("a & b = %d (", result_and);
    printBinary(result_and);
    printf(")\\n");

    // OR
    int result_or = a | b; // 1110 (14 in decimal)
    printf("a | b = %d (", result_or);
    printBinary(result_or);
    printf(")\\n");

    // XOR
    int result_xor = a ^ b; // 0110 (6 in decimal)
    printf("a ^ b = %d (", result_xor);
    printBinary(result_xor);
    printf(")\\n");

    // NOT
    int result_not_a = ~a; // Inverts all bits
    printf("~a = %d\\n", result_not_a);

    // Left shift
    int shift_left = a << 2; // 110000 (48 in decimal)
    printf("a << 2 = %d (", shift_left);
    printBinary(shift_left);
    printf(")\\n");

    // Right shift
    int shift_right = a >> 2; // 0011 (3 in decimal)
    printf("a >> 2 = %d (", shift_right);
    printBinary(shift_right);
    printf(")\\n");

    return 0;
}`
  };

  // Merge advanced examples with basic examples
  Object.assign(appState.examples, advancedExamples);
}

/**
 * Interpreter class for simulating code execution
 */
export class Interpreter {
  /**
   * Initialize the interpreter
   * @param {AppState} appState - Application state
   */
  constructor(appState) {
    this.appState = appState;
    this.baseAddress = 0x1000; // Stack base address
    this.heapBase = 0x8000;    // Heap base address
  }
  
  /**
   * Generate execution steps for the current AST
   * @returns {Array} Array of execution steps
   */
  generateExecutionSteps() {
    const steps = [];
    
    try {
      // Determine code type
      const codeType = this.determineCodeType();
      
      // Add initial step
      steps.push(new ExecutionStep(
        'initialization',
        1,
        'Program start',
        {}
      ));
      
      // Generate steps based on code type
      switch (codeType) {
        case 'basic':
          this.generateStepsForVariablesAndPointers(steps);
          break;
        case 'arrays':
          this.generateStepsForArraysAndPointers(steps);
          break;
        case 'dynamic_allocation':
          this.generateStepsForDynamicAllocation(steps);
          break;
        case 'structures':
          this.generateStepsForStructures(steps);
          break;
        case 'recursion':
          this.generateStepsForRecursion(steps);
          break;
        case 'file_io':
          this.generateStepsForFileHandling(steps);
          break;
        case 'switch_case':
          this.generateStepsForSwitchCase(steps);
          break;
        case 'preprocessor':
          this.generateStepsForPreprocessor(steps);
          break;
        case 'bitwise':
          this.generateStepsForBitwise(steps);
          break;
        default:
          // Try to generate steps based on AST for custom code
          this.generateStepsBasedOnAST(steps);
          break;
      }
      
      // Add final step
      steps.push(new ExecutionStep(
        'finalization',
        this.findLastLine(),
        'Program end',
        {}
      ));
      
    } catch (error) {
      console.error('Error generating execution steps:', error);
      this.appState.addError(error.message);
    }
    
    return steps;
  }
  
  /**
   * Determine the type of code being executed
   * @returns {string} Code type
   */
  determineCodeType() {
    const code = this.appState.code.toLowerCase();
    
    // Check for specific patterns to identify code type
    if (code.includes('malloc(') || code.includes('free(')) {
      return 'dynamic_allocation';
    } else if (code.includes('struct ')) {
      return 'structures';
    } else if (code.includes('fopen(') || code.includes('fclose(')) {
      return 'file_io';
    } else if (code.includes('switch(') || code.includes('case ')) {
      return 'switch_case';
    } else if (code.includes('#define ')) {
      return 'preprocessor';
    } else if (code.includes('<<') || code.includes('>>') || code.includes(' & ')) {
      return 'bitwise';
    } else if (this.hasRecursion()) {
      return 'recursion';
    } else if (code.includes('[') && code.includes(']')) {
      return 'arrays';
    } else {
      return 'basic';
    }
  }
  
  /**
   * Check if code contains recursion
   * @returns {boolean} True if recursion is detected
   */
  hasRecursion() {
    // Simplified implementation - check for patterns indicating recursion
    const ast = this.appState.ast;
    if (!ast) return false;
    
    // Get function names
    const functionNames = [];
    const findFunctions = (node) => {
      if (node.type === 'function_definition' && node.value) {
        functionNames.push(node.value);
      }
      
      if (node.children) {
        node.children.forEach(child => findFunctions(child));
      }
    };
    
    findFunctions(ast);
    
    // Check for self-calls
    let hasRecursiveCall = false;
    const findRecursiveCalls = (node, currentFunction) => {
      if (node.type === 'function_definition' && node.value) {
        currentFunction = node.value;
      }
      
      if (node.type === 'call_expression' && 
          node.value && 
          functionNames.includes(node.value) &&
          node.value === currentFunction) {
        hasRecursiveCall = true;
        return;
      }
      
      if (node.children && !hasRecursiveCall) {
        node.children.forEach(child => findRecursiveCalls(child, currentFunction));
      }
    };
    
    findRecursiveCalls(ast, null);
    
    return hasRecursiveCall;
  }
  
  /**
   * Find the last line of code
   * @returns {number} Last line number
   */
  findLastLine() {
    if (this.appState.tokens.length === 0) return 1;
    
    const lines = this.appState.tokens.map(token => token.line);
    return Math.max(...lines);
  }
  
  /**
   * Generate execution steps for variables and pointers example
   * @param {Array} steps - Array to add steps to
   */
  generateStepsForVariablesAndPointers(steps) {
    let currentAddress = this.baseAddress;
    
    // Add main frame to stack
    const mainFrame = new StackFrame('main', 0);
    this.appState.stack.push(mainFrame);
    
    // Step 1: Declare x with value 10
    const xAddress = currentAddress;
    currentAddress += 4; // int size
    
    steps.push(new ExecutionStep(
      'declaration',
      4,
      'Declaration of variable x with value 10',
      {
        memory: {
          [xAddress]: { value: 10, name: 'x', type: 'int' }
        },
        stack: {
          'main': {
            add: { name: 'x', value: 10, address: xAddress, type: 'int' }
          }
        }
      }
    ));
    
    mainFrame.addVariable('x', 10, xAddress, 'int');
    this.appState.memory[xAddress] = { value: 10, name: 'x', type: 'int' };
    
    // Step 2: Declare y with value 20
    const yAddress = currentAddress;
    currentAddress += 4; // int size
    
    steps.push(new ExecutionStep(
      'declaration',
      5,
      'Declaration of variable y with value 20',
      {
        memory: {
          [yAddress]: { value: 20, name: 'y', type: 'int' }
        },
        stack: {
          'main': {
            add: { name: 'y', value: 20, address: yAddress, type: 'int' }
          }
        }
      }
    ));
    
    mainFrame.addVariable('y', 20, yAddress, 'int');
    this.appState.memory[yAddress] = { value: 20, name: 'y', type: 'int' };
    
    // Step 3: Declare pointer ptr pointing to x
    const ptrAddress = currentAddress;
    currentAddress += 8; // pointer size (64-bit)
    
    steps.push(new ExecutionStep(
      'declaration',
      6,
      'Declaration of pointer ptr pointing to x',
      {
        memory: {
          [ptrAddress]: { value: xAddress, name: 'ptr', type: 'int*' }
        },
        stack: {
          'main': {
            add: { name: 'ptr', value: xAddress, address: ptrAddress, type: 'int*' }
          }
        }
      }
    ));
    
    mainFrame.addVariable('ptr', xAddress, ptrAddress, 'int*');
    this.appState.memory[ptrAddress] = { value: xAddress, name: 'ptr', type: 'int*' };
    
    // Step 4: First printf
    steps.push(new ExecutionStep(
      'call',
      8,
      'Printf function call showing x and y values',
      {
        saida: 'x = 10, y = 20\n'
      }
    ));
    
    this.appState.consoleOutput += 'x = 10, y = 20\n';
    
    // Step 5: Second printf
    steps.push(new ExecutionStep(
      'call',
      9,
      'Printf function call showing value pointed by ptr',
      {
        saida: '*ptr = 10\n'
      }
    ));
    
    this.appState.consoleOutput += '*ptr = 10\n';
    
    // Step 6: Change value pointed by ptr
    steps.push(new ExecutionStep(
      'assignment',
      11,
      'Assignment of 30 to the value pointed by ptr (x)',
      {
        memory: {
          [xAddress]: { value: 30, name: 'x', type: 'int' }
        },
        stack: {
          'main': {
            update: { name: 'x', value: 30, address: xAddress, type: 'int' }
          }
        }
      }
    ));
    
    mainFrame.updateVariable('x', 30);
    this.appState.memory[xAddress].value = 30;
    
    // Step 7: Third printf
    steps.push(new ExecutionStep(
      'call',
      12,
      'Printf function call showing x value after change',
      {
        saida: 'After *ptr = 30, x = 30\n'
      }
    ));
    
    this.appState.consoleOutput += 'After *ptr = 30, x = 30\n';
    
    // Step 8: Change ptr to point to y
    steps.push(new ExecutionStep(
      'assignment',
      14,
      'Assignment of y address to ptr',
      {
        memory: {
          [ptrAddress]: { value: yAddress, name: 'ptr', type: 'int*' }
        },
        stack: {
          'main': {
            update: { name: 'ptr', value: yAddress, address: ptrAddress, type: 'int*' }
          }
        }
      }
    ));
    
    mainFrame.updateVariable('ptr', yAddress);
    this.appState.memory[ptrAddress].value = yAddress;
    
    // Step 9: Change value pointed by ptr (now y)
    steps.push(new ExecutionStep(
      'assignment',
      15,
      'Assignment of 40 to the value pointed by ptr (y)',
      {
        memory: {
          [yAddress]: { value: 40, name: 'y', type: 'int' }
        },
        stack: {
          'main': {
            update: { name: 'y', value: 40, address: yAddress, type: 'int' }
          }
        }
      }
    ));
    
    mainFrame.updateVariable('y', 40);
    this.appState.memory[yAddress].value = 40;
    
    // Step 10: Fourth printf
    steps.push(new ExecutionStep(
      'call',
      16,
      'Printf function call showing y value after change',
      {
        saida: 'After ptr = &y and *ptr = 40, y = 40\n'
      }
    ));
    
    this.appState.consoleOutput += 'After ptr = &y and *ptr = 40, y = 40\n';
    
    // Return statement
    steps.push(new ExecutionStep(
      'return',
      18,
      'Return from main function',
      {
        stack: {
          'main': {
            remove: true
          }
        }
      }
    ));
  }
  
  /**
   * Generate execution steps for arrays and pointers example
   * @param {Array} steps - Array to add steps to
   */
  generateStepsForArraysAndPointers(steps) {
    let currentAddress = this.baseAddress;
    
    // Add main frame to stack
    const mainFrame = new StackFrame('main', 0);
    this.appState.stack.push(mainFrame);
    
    // Array declaration
    const arraySize = 5;
    const intSize = 4;
    const arrayAddress = currentAddress;
    currentAddress += arraySize * intSize;
    
    const initialValues = [10, 20, 30, 40, 50];
    const memoryChanges = {};
    
    // Create memory entries for each array element
    for (let i = 0; i < arraySize; i++) {
      const elementAddress = arrayAddress + (i * intSize);
      memoryChanges[elementAddress] = {
        value: initialValues[i],
        name: `numeros[${i}]`,
        type: 'int'
      };
    }
    
    steps.push(new ExecutionStep(
      'declaration',
      5,
      'Declaration and initialization of array numeros with 5 elements',
      {
        memory: memoryChanges,
        stack: {
          'main': {
            add: { name: 'numeros', value: arrayAddress, address: arrayAddress, type: 'int[5]' }
          }
        }
      }
    ));
    
    // Update state
    mainFrame.addVariable('numeros', arrayAddress, arrayAddress, 'int[5]');
    for (const address in memoryChanges) {
      this.appState.memory[address] = memoryChanges[address];
    }
    
    // Pointer declaration
    const ptrAddress = currentAddress;
    currentAddress += 8; // 8 bytes for pointer
    
    steps.push(new ExecutionStep(
      'declaration',
      6,
      'Declaration of pointer ptr initialized with numeros array address',
      {
        memory: {
          [ptrAddress]: { value: arrayAddress, name: 'ptr', type: 'int*' }
        },
        stack: {
          'main': {
            add: { name: 'ptr', value: arrayAddress, address: ptrAddress, type: 'int*' }
          }
        }
      }
    ));
    
    mainFrame.addVariable('ptr', arrayAddress, ptrAddress, 'int*');
    this.appState.memory[ptrAddress] = { value: arrayAddress, name: 'ptr', type: 'int*' };
    
    // First printf - showing addresses
    steps.push(new ExecutionStep(
      'call',
      8,
      'Printf function call showing the array address',
      {
        saida: `Endereço de numeros: 0x${arrayAddress.toString(16)}\n`
      }
    ));
    
    this.appState.consoleOutput += `Endereço de numeros: 0x${arrayAddress.toString(16)}\n`;
    
    // Second printf - pointer value
    steps.push(new ExecutionStep(
      'call',
      9,
      'Printf function call showing pointer ptr value',
      {
        saida: `Valor de ptr: 0x${arrayAddress.toString(16)}\n`
      }
    ));
    
    this.appState.consoleOutput += `Valor de ptr: 0x${arrayAddress.toString(16)}\n`;
    
    // Loop for showing elements
    for (let i = 0; i < arraySize; i++) {
      steps.push(new ExecutionStep(
        'execution',
        11,
        `Loop iteration ${i + 1} - accessing array elements`,
        {}
      ));
      
      steps.push(new ExecutionStep(
        'call',
        13,
        `Printf function call showing array element ${i}`,
        {
          saida: `numeros[${i}] = ${initialValues[i]}, *(ptr+${i}) = ${initialValues[i]}\n`
        }
      ));
      
      this.appState.consoleOutput += `numeros[${i}] = ${initialValues[i]}, *(ptr+${i}) = ${initialValues[i]}\n`;
    }
    
    // Reposition pointer to middle of array
    steps.push(new ExecutionStep(
      'assignment',
      16,
      'Repositioning ptr to the third element of array (numeros[2])',
      {
        memory: {
          [ptrAddress]: { value: arrayAddress + 2 * intSize, name: 'ptr', type: 'int*' }
        },
        stack: {
          'main': {
            update: {
              name: 'ptr',
              value: arrayAddress + 2 * intSize,
              address: ptrAddress,
              type: 'int*'
            }
          }
        }
      }
    ));
    
    mainFrame.updateVariable('ptr', arrayAddress + 2 * intSize);
    this.appState.memory[ptrAddress].value = arrayAddress + 2 * intSize;
    
    // Informative message
    steps.push(new ExecutionStep(
      'call',
      17,
      'Printf function call with informative message',
      {
        saida: '\nptr agora aponta para numeros[2]\n'
      }
    ));
    
    this.appState.consoleOutput += '\nptr agora aponta para numeros[2]\n';
    
    // Show current pointed value
    steps.push(new ExecutionStep(
      'call',
      18,
      'Printf function call showing value pointed by ptr',
      {
        saida: `*ptr = ${initialValues[2]}\n`
      }
    ));
    
    this.appState.consoleOutput += `*ptr = ${initialValues[2]}\n`;
    
    // Demonstrate negative and positive pointer indexing
    steps.push(new ExecutionStep(
      'call',
      19,
      'Printf function call demonstrating pointer indexing',
      {
        saida: `ptr[-1] = ${initialValues[1]}, ptr[1] = ${initialValues[3]}\n`
      }
    ));
    
    this.appState.consoleOutput += `ptr[-1] = ${initialValues[1]}, ptr[1] = ${initialValues[3]}\n`;
    
    // Return statement
    steps.push(new ExecutionStep(
      'return',
      21,
      'Return from main function',
      {
        stack: {
          'main': {
            remove: true
          }
        }
      }
    ));
  }
  
  /**
   * Generate execution steps for dynamic memory allocation example
   * @param {Array} steps - Array to add steps to
   */
  generateStepsForDynamicAllocation(steps) {
    let currentAddress = this.baseAddress;
    let heapAddress = this.heapBase;
    
    // Add main frame to stack
    const mainFrame = new StackFrame('main', 0);
    this.appState.stack.push(mainFrame);
    
    // Pointer declaration
    const ptrAddress = currentAddress;
    currentAddress += 8; // 8 bytes for pointer
    
    steps.push(new ExecutionStep(
      'declaration',
      5,
      'Declaration of pointer ptr (uninitialized)',
      {
        memory: {
          [ptrAddress]: { value: 0, name: 'ptr', type: 'int*' }
        },
        stack: {
          'main': {
            add: { name: 'ptr', value: 0, address: ptrAddress, type: 'int*' }
          }
        }
      }
    ));
    
    mainFrame.addVariable('ptr', 0, ptrAddress, 'int*');
    this.appState.memory[ptrAddress] = { value: 0, name: 'ptr', type: 'int*' };
    
    // Variable n declaration
    const nAddress = currentAddress;
    currentAddress += 4; // 4 bytes for int
    
    steps.push(new ExecutionStep(
      'declaration',
      6,
      'Declaration of variable n with value 5',
      {
        memory: {
          [nAddress]: { value: 5, name: 'n', type: 'int' }
        },
        stack: {
          'main': {
            add: { name: 'n', value: 5, address: nAddress, type: 'int' }
          }
        }
      }
    ));
    
    mainFrame.addVariable('n', 5, nAddress, 'int');
    this.appState.memory[nAddress] = { value: 5, name: 'n', type: 'int' };
    
    // Malloc call
    const allocSize = 5 * 4; // 5 ints, 4 bytes each
    const heapBlockAddress = heapAddress;
    heapAddress += allocSize;
    
    steps.push(new ExecutionStep(
      'call',
      9,
      'Malloc function call to allocate 5 integers on heap',
      {
        memory: {
          [ptrAddress]: { value: heapBlockAddress, name: 'ptr', type: 'int*' }
        },
        stack: {
          'main': {
            update: { name: 'ptr', value: heapBlockAddress, address: ptrAddress, type: 'int*' }
          }
        },
        heap: {
          [heapBlockAddress]: { address: heapBlockAddress, size: allocSize, freed: false }
        }
      }
    ));
    
    mainFrame.updateVariable('ptr', heapBlockAddress);
    this.appState.memory[ptrAddress].value = heapBlockAddress;
    this.appState.heap[heapBlockAddress] = new HeapBlock(heapBlockAddress, allocSize, 'uninitialized');
    
    // Check allocation success
    steps.push(new ExecutionStep(
      'conditional',
      11,
      'Checking if allocation was successful',
      {}
    ));
    
    // Initialize values loop
    const heapValues = {};
    
    for (let i = 0; i < 5; i++) {
      const elementAddress = heapBlockAddress + (i * 4);
      const elementValue = i * 10;
      
      steps.push(new ExecutionStep(
        'assignment',
        16,
        `Initializing ptr[${i}] with value ${elementValue}`,
        {
          memory: {
            [elementAddress]: { value: elementValue, name: `*(ptr+${i})`, type: 'int' }
          }
        }
      ));
      
      this.appState.memory[elementAddress] = { value: elementValue, name: `*(ptr+${i})`, type: 'int' };
      heapValues[i] = elementValue;
    }
    
    // Update heap block content
    this.appState.heap[heapBlockAddress].content = heapValues;
    
    // Display values loop
    for (let i = 0; i < 5; i++) {
      const elementValue = i * 10;
      
      steps.push(new ExecutionStep(
        'call',
        21,
        `Printf function call showing ptr[${i}]`,
        {
          saida: `ptr[${i}] = ${elementValue}\n`
        }
      ));
      
      this.appState.consoleOutput += `ptr[${i}] = ${elementValue}\n`;
    }
    
    // Free memory
    steps.push(new ExecutionStep(
      'call',
      25,
      'Free function call to release allocated memory',
      {
        heap: {
          [heapBlockAddress]: { address: heapBlockAddress, size: allocSize, freed: true }
        }
      }
    ));
    
    this.appState.heap[heapBlockAddress].freed = true;
    
    // Dangling pointer warning
    steps.push(new ExecutionStep(
      'warning',
      28,
      'ptr is now a dangling pointer pointing to freed memory',
      {}
    ));
    
    // Return statement
    steps.push(new ExecutionStep(
      'return',
      30,
      'Return from main function',
      {
        stack: {
          'main': {
            remove: true
          }
        }
      }
    ));
  }
  
  /**
   * Generate steps based on AST for custom or unrecognized code
   * @param {Array} steps - Array to add steps to
   */
  generateStepsBasedOnAST(steps) {
    // Find main function in AST
    let mainNode = null;
    if (this.appState.ast && this.appState.ast.children) {
      mainNode = this.appState.ast.children.find(node => 
        node.type === 'function_definition' && node.value === 'main'
      );
    }
    
    if (mainNode) {
      // Add main frame to stack
      const mainFrame = new StackFrame('main', 0);
      this.appState.stack.push(mainFrame);
      
      steps.push(new ExecutionStep(
        'information',
        2,
        'Found main() function - starting execution',
        {}
      ));
      
      // Find printf calls
      const printfCalls = this.findFunctionCalls(mainNode, 'printf');
      if (printfCalls.length > 0) {
        printfCalls.forEach((call, index) => {
          // Simple simulation of printf calls
          steps.push(new ExecutionStep(
            'call',
            call.line || index + 3,
            'Printf function call',
            {
              saida: 'Simulated output from printf call\n'
            }
          ));
          
          this.appState.consoleOutput += 'Simulated output from printf call\n';
        });
      }
      
      // Return statement
      steps.push(new ExecutionStep(
        'return',
        this.findLastLine() - 1,
        'Return from main function',
        {
          stack: {
            'main': {
              remove: true
            }
          }
        }
      ));
    } else {
      steps.push(new ExecutionStep(
        'error',
        1,
        'Could not find main function for execution',
        {}
      ));
    }
  }
  
  /**
   * Find function calls in AST
   * @param {ASTNode} rootNode - Root node to search from
   * @param {string} functionName - Function name to find
   * @returns {Array} Array of function call nodes
   */
  findFunctionCalls(rootNode, functionName) {
    const calls = [];
    
    const search = (node) => {
      if (node.type === 'call_expression' && node.value === functionName) {
        calls.push(node);
      }
      
      if (node.children) {
        node.children.forEach(child => search(child));
      }
    };
    
    search(rootNode);
    return calls;
  }
  
  // Other simulation methods for different example types would go here
}
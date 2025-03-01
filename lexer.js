/**
 * IFSCee - C Programming Visualization Tool
 * Lexical analysis module for tokenizing C code
 */

import { Token } from './state.js';

/**
 * Lexer class for tokenizing C code
 */
export class Lexer {
  /**
   * Initialize the lexer
   * @param {AppState} appState - Application state
   */
  constructor(appState) {
    this.appState = appState;

    // Token definitions for the C language
    this.tokenDefinitions = {
      // Keywords in C
      keywords: [
        'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
        'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
        'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
        'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
        'unsigned', 'void', 'volatile', 'while', '_Bool', '_Complex', '_Imaginary'
      ],

      // Standard library functions
      stdFunctions: [
        'printf', 'scanf', 'malloc', 'free', 'calloc', 'realloc', 'strlen',
        'strcpy', 'strcat', 'strcmp', 'fopen', 'fclose', 'fread', 'fwrite',
        'fprintf', 'fscanf', 'fgets', 'fputs', 'fseek', 'ftell', 'rewind'
      ],

      // Preprocessor directives
      preprocessor: [
        '#include', '#define', '#ifdef', '#ifndef', '#endif', '#if', '#else',
        '#pragma', '#undef', '#error'
      ],

      // Operators in C
      operators: {
        arithmetic: ['+', '-', '*', '/', '%', '++', '--'],
        relational: ['==', '!=', '>', '<', '>=', '<='],
        logical: ['&&', '||', '!'],
        bitwise: ['&', '|', '^', '~', '<<', '>>'],
        assignment: ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']
      },

      // Punctuation
      punctuation: [
        '{', '}', '(', ')', '[', ']', ';', ',', '.', '->', ':', '?', '<', '>'
      ]
    };
  }

  /**
   * Check if a token is of a specific type
   * @param {string} value - Token value
   * @param {string} type - Token type to check
   * @returns {boolean} True if token is of the specified type
   */
  isTokenOfType(value, type) {
    switch (type) {
      case 'keyword':
        return this.tokenDefinitions.keywords.includes(value);
      case 'stdFunction':
        return this.tokenDefinitions.stdFunctions.includes(value);
      case 'preprocessor':
        return this.tokenDefinitions.preprocessor.some(p => value.startsWith(p));
      case 'operatorArithmetic':
        return this.tokenDefinitions.operators.arithmetic.includes(value);
      case 'operatorRelational':
        return this.tokenDefinitions.operators.relational.includes(value);
      case 'operatorLogical':
        return this.tokenDefinitions.operators.logical.includes(value);
      case 'operatorBitwise':
        return this.tokenDefinitions.operators.bitwise.includes(value);
      case 'operatorAssignment':
        return this.tokenDefinitions.operators.assignment.includes(value);
      case 'punctuation':
        return this.tokenDefinitions.punctuation.includes(value);
      default:
        return false;
    }
  }

  /**
   * Get line and column from position in code
   * @param {number} pos - Position in code
   * @param {Array} newlinePositions - Array of newline positions
   * @returns {Object} Object with line and column
   */
  getLineColumnFromPos(pos, newlinePositions) {
    let line = 0;
    while (line < newlinePositions.length && newlinePositions[line] < pos) {
      line++;
    }

    const lineStartPos = line === 0 ? 0 : newlinePositions[line - 1] + 1;
    const column = pos - lineStartPos;

    return { line: line + 1, column: column + 1 };
  }

  /**
   * Check if a position is within a preprocessor directive
   * @param {number} pos - Position in code
   * @param {Array} directivePositions - Array of directive positions
   * @returns {boolean} True if position is within a directive
   */
  isWithinDirective(pos, directivePositions) {
    for (const { start, end } of directivePositions) {
      if (pos >= start && pos < end) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find exact position of a preprocessor directive in the code
   * @param {string} code - The full source code
   * @param {string} line - The preprocessor directive line
   * @param {number} lineIndex - The line number in the source
   * @returns {number} The starting position of the directive
   */
  findDirectivePosition(code, line, lineIndex) {
    // Calculate the approximate position by counting lines
    const lines = code.split('\n');
    let position = 0;

    for (let i = 0; i < lineIndex; i++) {
      position += lines[i].length + 1; // +1 for the newline character
    }

    // Find the exact position within the line
    const currentLine = lines[lineIndex];
    const indentMatch = currentLine.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0].length : 0;

    return position + indent;
  }

  /**
   * Tokenize the code from appState
   * @returns {Array} Array of tokens
   */
  tokenize() {
    const code = this.appState.code;
    const tokens = [];

    // Map positions of newline characters for line/column tracking
    const newlinePositions = [];
    for (let i = 0; i < code.length; i++) {
      if (code[i] === '\n') {
        newlinePositions.push(i);
      }
    }

    // Process preprocessor directives
    const lines = code.split('\n');
    let directives = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#')) {
        // Use improved position calculation for directives
        const start = this.findDirectivePosition(code, line, i);
        directives.push({
          text: line,
          line: i + 1,
          start: start
        });
      }
    }

    // Mark positions of directives to avoid processing them again
    let directivePositions = [];
    for (const directive of directives) {
      const start = directive.start;
      const end = start + directive.text.length;
      directivePositions.push({ start, end });
    }

    // Process preprocessor directives
    for (const directive of directives) {
      const text = directive.text;
      let type = 'preprocessor';

      // Get specific directive type (#include, #define, etc.)
      const directiveParts = text.split(/\s+/); // Fixed: removed extra backslash
      const command = directiveParts[0];

      // Get line and column
      const { line, column } = this.getLineColumnFromPos(directive.start, newlinePositions);

      // Add token for the directive
      const token = new Token(type, command, line, column);
      tokens.push(token);

      // Process specific directives
      if (command === '#include') {
        // Process include directive
        const rest = text.substring(8).trim();

        // Calculate exact positions based on the text content
        const includePos = column + command.length;

        if (rest.startsWith('<') && rest.includes('>')) {
          // Include with <>
          const fileName = rest.substring(1, rest.indexOf('>'));
          const leftBracketPos = includePos + text.indexOf('<', 8) - 8;
          const fileNamePos = leftBracketPos + 1;
          const rightBracketPos = fileNamePos + fileName.length;

          tokens.push(new Token('punctuation', '<', line, leftBracketPos));
          tokens.push(new Token('identifier', fileName, line, fileNamePos));
          tokens.push(new Token('punctuation', '>', line, rightBracketPos));
        } else if (rest.startsWith('"') && rest.includes('"', 1)) {
          // Include with ""
          const fileName = rest.substring(1, rest.lastIndexOf('"'));
          const leftQuotePos = includePos + text.indexOf('"', 8) - 8;
          const fileNamePos = leftQuotePos + 1;
          const rightQuotePos = fileNamePos + fileName.length;

          tokens.push(new Token('punctuation', '"', line, leftQuotePos));
          tokens.push(new Token('identifier', fileName, line, fileNamePos));
          tokens.push(new Token('punctuation', '"', line, rightQuotePos));
        }
      }
      // Process define directive
      else if (command === '#define') {
        const parts = text.substring(7).trim().split(/\s+/, 2); // Fixed: removed extra backslash
        if (parts.length > 0) {
          const macroName = parts[0];
          const macroNamePos = column + text.indexOf(macroName, 7);
          tokens.push(new Token('identifier', macroName, line, macroNamePos));

          if (parts.length > 1) {
            const macroValue = parts[1];
            const macroValuePos = macroNamePos + macroName.length + 1; // +1 for the space
            tokens.push(new Token('literal', macroValue, line, macroValuePos));
          }
        }
      }
    }

    // Regular expression for tokenization - Fixed version
    const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(\d+\.\d+|\d+|0x[0-9a-fA-F]+)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\+\+|--|==|!=|<=|>=|&&|\|\||<<|>>|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=|->|[+\-*\/%=<>&|^!~.,;:?\[\]{}()])|(\w+)/g;

    // Match groups:
    // 1: Comments (single line or multi-line)
    // 2: Numbers (integers, decimals, hexadecimal)
    // 3: Strings and characters (with escape handling)
    // 4: Operators and punctuation
    // 5: Identifiers, keywords, etc.

    let match;
    while ((match = regex.exec(code)) !== null) {
      // Skip if this position is within a directive already processed
      if (this.isWithinDirective(match.index, directivePositions)) {
        continue;
      }

      // Skip comments
      if (match[1]) continue;

      const value = match[0];
      let type = '';

      // Get line and column
      const { line, column } = this.getLineColumnFromPos(match.index, newlinePositions);

      // Determine token type
      if (match[2]) {
        // Number
        type = 'literal';
      } else if (match[3]) {
        // String or character
        type = 'literal';
      } else if (match[4]) {
        // Operator or punctuation
        if (this.isTokenOfType(value, 'operatorArithmetic') ||
            this.isTokenOfType(value, 'operatorRelational') ||
            this.isTokenOfType(value, 'operatorLogical') ||
            this.isTokenOfType(value, 'operatorBitwise') ||
            this.isTokenOfType(value, 'operatorAssignment')) {
          type = 'operator';
        } else if (this.isTokenOfType(value, 'punctuation')) {
          type = 'punctuation';
        }
      } else if (match[5]) {
        // Identifier or keyword
        if (this.isTokenOfType(value, 'keyword')) {
          type = 'keyword';
        } else if (this.isTokenOfType(value, 'stdFunction')) {
          type = 'function';
        } else {
          type = 'identifier';
        }
      }

      if (type) {
        const token = new Token(type, value, line, column);
        tokens.push(token);
      }
    }

    // Sort tokens by position in code
    tokens.sort((a, b) => {
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      return a.column - b.column;
    });

    return tokens;
  }
}
/**
 * IFSCee - C Programming Visualization Tool
 * Parser module for syntax analysis and AST generation
 */

import { ASTNode } from './state.js';

/**
 * Parser class for generating AST from tokens
 */
export class Parser {
  /**
   * Initialize the parser
   * @param {AppState} appState - Application state
   */
  constructor(appState) {
    this.appState = appState;
    this.tokens = appState.tokens;
    this.currentTokenIndex = 0;
    
    // Operator definitions for parsing precedence
    this.operators = {
      assignment: ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']
    };
  }
  
  /**
   * Parse tokens into an Abstract Syntax Tree
   * @returns {ASTNode} Root node of the AST
   */
  parse() {
    this.currentTokenIndex = 0;
    this.tokens = this.appState.tokens;
    
    if (this.tokens.length === 0) {
      throw new Error('No tokens to parse');
    }
    
    // Start parsing from program root
    return this.parseProgram();
  }
  
  /**
   * Get current token
   * @returns {Token|null} Current token or null if at end
   */
  getCurrentToken() {
    return this.currentTokenIndex < this.tokens.length ? 
      this.tokens[this.currentTokenIndex] : null;
  }
  
  /**
   * Advance to next token
   */
  advance() {
    this.currentTokenIndex++;
  }
  
  /**
   * Check if current token is of specified type
   * @param {string} type - Token type to check
   * @returns {boolean} True if current token is of specified type
   */
  checkType(type) {
    const token = this.getCurrentToken();
    return token && token.type === type;
  }
  
  /**
   * Check if current token has specified value
   * @param {string} value - Token value to check
   * @returns {boolean} True if current token has specified value
   */
  checkValue(value) {
    const token = this.getCurrentToken();
    return token && token.value === value;
  }
  
  /**
   * Consume token of specified type and optionally with specified value
   * @param {string} type - Expected token type
   * @param {string|null} value - Expected token value (optional)
   * @returns {Token} Consumed token
   * @throws {Error} If token doesn't match expectations
   */
  consume(type, value = null) {
    const token = this.getCurrentToken();
    if (!token) {
      throw new Error(`Expected token of type ${type}, but reached end of tokens`);
    }
    
    if (token.type !== type || (value !== null && token.value !== value)) {
      throw new Error(
        `Expected token of type ${type}${value ? ` with value '${value}'` : ''}, ` +
        `but found ${token.type} '${token.value}' at line ${token.line}`
      );
    }
    
    this.advance();
    return token;
  }
  
  /**
   * Try to consume token of specified type and value
   * @param {string} type - Expected token type
   * @param {string|null} value - Expected token value (optional)
   * @returns {Token|null} Consumed token or null if not matching
   */
  tryConsume(type, value = null) {
    const token = this.getCurrentToken();
    if (token && token.type === type && (value === null || token.value === value)) {
      this.advance();
      return token;
    }
    return null;
  }
  
  /**
   * Parse program (root node)
   * @returns {ASTNode} Program node
   */
  parseProgram() {
    const root = new ASTNode('program');
    
    // Process all global declarations and function definitions
    while (this.getCurrentToken()) {
      // Preprocessor directives
      if (this.checkType('preprocessor')) {
        const directive = this.parsePreprocessorDirective();
        root.addChild(directive);
      }
      // Type declarations (variables, functions)
      else if (this.checkType('keyword')) {
        const declaration = this.parseTypeDeclaration();
        root.addChild(declaration);
      } else {
        // Unexpected tokens in global scope
        const token = this.getCurrentToken();
        throw new Error(
          `Unexpected token in global scope: ${token.type} '${token.value}' at line ${token.line}`
        );
      }
    }
    
    return root;
  }
  
  /**
   * Parse preprocessor directive
   * @returns {ASTNode} Preprocessor directive node
   */
  parsePreprocessorDirective() {
    const token = this.consume('preprocessor');
    return new ASTNode('preprocessor_directive', token.value);
  }
  
  /**
   * Parse type declaration (variable or function)
   * @returns {ASTNode} Declaration node
   */
  parseTypeDeclaration() {
    // Get type (int, char, float, etc.)
    const typeToken = this.consume('keyword');
    
    // Look ahead to determine if it's a function or variable declaration
    const initialTokens = this.tokens.slice(this.currentTokenIndex);
    let isFunction = false;
    let nestedParentheses = 0;
    let i = 0;
    
    while (i < initialTokens.length) {
      const t = initialTokens[i];
      if (t.value === '(') nestedParentheses++;
      else if (t.value === ')') nestedParentheses--;
      
      if (nestedParentheses === 0 && t.value === '{') {
        isFunction = true;
        break;
      } else if (nestedParentheses === 0 && t.value === ';') {
        isFunction = false;
        break;
      }
      
      i++;
    }
    
    if (isFunction) {
      return this.parseFunctionDefinition(typeToken.value);
    } else {
      return this.parseVariableDeclaration(typeToken.value);
    }
  }
  
  /**
   * Parse function definition
   * @param {string} returnType - Function return type
   * @returns {ASTNode} Function definition node
   */
  parseFunctionDefinition(returnType) {
    // Function name
    const nameToken = this.consume('identifier');
    const functionName = nameToken.value;
    
    // Opening parenthesis
    this.consume('punctuation', '(');
    
    // Parse parameters
    const parameters = [];
    if (!this.checkValue(')')) {
      do {
        if (this.checkType('keyword')) {
          const paramType = this.consume('keyword').value;
          const paramName = this.checkType('identifier') ? this.consume('identifier').value : '';
          parameters.push({ type: paramType, name: paramName });
          
          // Consume comma if there are more parameters
          if (this.checkValue(',')) {
            this.consume('punctuation', ',');
          }
        }
      } while (!this.checkValue(')'));
    }
    
    // Closing parenthesis
    this.consume('punctuation', ')');
    
    // Create function node
    const functionNode = new ASTNode('function_definition', functionName);
    functionNode.returnType = returnType;
    functionNode.parameters = parameters;
    
    // Parse function body
    const functionBody = this.parseCompoundStatement();
    functionNode.addChild(functionBody);
    
    return functionNode;
  }
  
  /**
   * Parse compound statement (code block)
   * @returns {ASTNode} Compound statement node
   */
  parseCompoundStatement() {
    this.consume('punctuation', '{');
    
    const blockNode = new ASTNode('compound_statement');
    
    // Parse statements within the block
    while (!this.checkValue('}')) {
      if (this.checkType('keyword')) {
        const token = this.getCurrentToken();
        
        if (['if', 'for', 'while', 'do', 'switch', 'return'].includes(token.value)) {
          const controlFlow = this.parseControlFlowStatement();
          blockNode.addChild(controlFlow);
        } else {
          // Likely a variable declaration
          const declaration = this.parseVariableDeclaration(token.value);
          blockNode.addChild(declaration);
        }
      } else if (this.checkType('identifier')) {
        // Assignment or function call
        const expression = this.parseExpressionStatement();
        blockNode.addChild(expression);
      } else {
        // Other statement types
        const expression = this.parseExpressionStatement();
        blockNode.addChild(expression);
      }
    }
    
    this.consume('punctuation', '}');
    return blockNode;
  }
  
  /**
   * Parse variable declaration
   * @param {string} type - Variable type
   * @returns {ASTNode} Variable declaration node
   */
  parseVariableDeclaration(type) {
    const declarationNode = new ASTNode('variable_declaration');
    declarationNode.type = type;
    
    let firstVar = true;
    do {
      if (!firstVar) {
        this.consume('punctuation', ',');
      }
      
      const varNode = new ASTNode('variable');
      
      // Variable name
      if (this.checkType('identifier')) {
        varNode.value = this.consume('identifier').value;
      } else if (this.checkValue('*')) {
        // Pointer
        this.consume('operator', '*');
        varNode.isPointer = true;
        varNode.value = this.consume('identifier').value;
      }
      
      // Check for initialization
      if (this.checkValue('=')) {
        this.consume('operator', '=');
        
        // Parse initialization expression
        const valueNode = this.parseExpression();
        varNode.addChild(valueNode);
      }
      
      declarationNode.addChild(varNode);
      firstVar = false;
      
    } while (this.checkValue(','));
    
    // Semicolon at end of declaration
    this.consume('punctuation', ';');
    
    return declarationNode;
  }
  
  /**
   * Parse control flow statement (if, for, while, etc.)
   * @returns {ASTNode} Control flow statement node
   */
  parseControlFlowStatement() {
    const token = this.getCurrentToken();
    
    if (token.value === 'if') {
      return this.parseIfStatement();
    } else if (token.value === 'for') {
      return this.parseForStatement();
    } else if (token.value === 'while') {
      return this.parseWhileStatement();
    } else if (token.value === 'return') {
      return this.parseReturnStatement();
    }
    
    throw new Error(`Unsupported control flow structure: ${token.value}`);
  }
  
  /**
   * Parse if statement
   * @returns {ASTNode} If statement node
   */
  parseIfStatement() {
    this.consume('keyword', 'if');
    this.consume('punctuation', '(');
    
    // Parse condition
    const condition = this.parseExpression();
    
    this.consume('punctuation', ')');
    
    // Parse if block
    const ifBlock = this.checkValue('{') ?
      this.parseCompoundStatement() :
      this.parseExpressionStatement();
    
    const ifNode = new ASTNode('if_statement');
    ifNode.addChild(condition);
    ifNode.addChild(ifBlock);
    
    // Check for else
    if (this.tryConsume('keyword', 'else')) {
      const elseBlock = this.checkValue('{') ?
        this.parseCompoundStatement() :
        this.parseExpressionStatement();
      
      ifNode.addChild(elseBlock);
    }
    
    return ifNode;
  }
  
  /**
   * Parse for statement
   * @returns {ASTNode} For statement node
   */
  parseForStatement() {
    this.consume('keyword', 'for');
    this.consume('punctuation', '(');
    
    // Initialization
    const initialization = !this.checkValue(';') ?
      this.parseExpression() :
      new ASTNode('empty');
    this.consume('punctuation', ';');
    
    // Condition
    const condition = !this.checkValue(';') ?
      this.parseExpression() :
      new ASTNode('empty');
    this.consume('punctuation', ';');
    
    // Increment
    const increment = !this.checkValue(')') ?
      this.parseExpression() :
      new ASTNode('empty');
    this.consume('punctuation', ')');
    
    // Loop body
    const body = this.checkValue('{') ?
      this.parseCompoundStatement() :
      this.parseExpressionStatement();
    
    const forNode = new ASTNode('for_statement');
    forNode.addChild(initialization);
    forNode.addChild(condition);
    forNode.addChild(increment);
    forNode.addChild(body);
    
    return forNode;
  }
  
  /**
   * Parse while statement
   * @returns {ASTNode} While statement node
   */
  parseWhileStatement() {
    this.consume('keyword', 'while');
    this.consume('punctuation', '(');
    
    // Parse condition
    const condition = this.parseExpression();
    
    this.consume('punctuation', ')');
    
    // Parse loop body
    const body = this.checkValue('{') ?
      this.parseCompoundStatement() :
      this.parseExpressionStatement();
    
    const whileNode = new ASTNode('while_statement');
    whileNode.addChild(condition);
    whileNode.addChild(body);
    
    return whileNode;
  }
  
  /**
   * Parse return statement
   * @returns {ASTNode} Return statement node
   */
  parseReturnStatement() {
    this.consume('keyword', 'return');
    
    const returnNode = new ASTNode('return_statement');
    
    // Check for return value
    if (!this.checkValue(';')) {
      const returnValue = this.parseExpression();
      returnNode.addChild(returnValue);
    }
    
    this.consume('punctuation', ';');
    
    return returnNode;
  }
  
  /**
   * Parse expression statement (with semicolon)
   * @returns {ASTNode} Expression statement node
   */
  parseExpressionStatement() {
    const expression = this.parseExpression();
    this.consume('punctuation', ';');
    return expression;
  }
  
  /**
   * Parse expression
   * @returns {ASTNode} Expression node
   */
  parseExpression() {
    // Basic implementation - prioritizes assignments
    return this.parseAssignment();
  }
  
  /**
   * Parse assignment expression
   * @returns {ASTNode} Assignment expression node
   */
  parseAssignment() {
    const left = this.parseLogicalExpression();
    
    if (this.checkType('operator') && this.operators.assignment.includes(this.getCurrentToken().value)) {
      const operator = this.consume('operator').value;
      const right = this.parseAssignment();
      
      const assignmentNode = new ASTNode('assignment_expression', operator);
      assignmentNode.addChild(left);
      assignmentNode.addChild(right);
      
      return assignmentNode;
    }
    
    return left;
  }
  
  /**
   * Parse logical expression
   * @returns {ASTNode} Logical expression node
   */
  parseLogicalExpression() {
    let left = this.parseRelationalExpression();
    
    while (this.checkType('operator') &&
           (this.getCurrentToken().value === '&&' || this.getCurrentToken().value === '||')) {
      const operator = this.consume('operator').value;
      const right = this.parseRelationalExpression();
      
      const logicalNode = new ASTNode('logical_expression', operator);
      logicalNode.addChild(left);
      logicalNode.addChild(right);
      
      left = logicalNode;
    }
    
    return left;
  }
  
  /**
   * Parse relational expression
   * @returns {ASTNode} Relational expression node
   */
  parseRelationalExpression() {
    let left = this.parseAdditiveExpression();
    
    while (this.checkType('operator') &&
           ['==', '!=', '<', '>', '<=', '>='].includes(this.getCurrentToken().value)) {
      const operator = this.consume('operator').value;
      const right = this.parseAdditiveExpression();
      
      const relationalNode = new ASTNode('relational_expression', operator);
      relationalNode.addChild(left);
      relationalNode.addChild(right);
      
      left = relationalNode;
    }
    
    return left;
  }
  
  /**
   * Parse additive expression
   * @returns {ASTNode} Additive expression node
   */
  parseAdditiveExpression() {
    let left = this.parseMultiplicativeExpression();
    
    while (this.checkType('operator') &&
           (this.getCurrentToken().value === '+' || this.getCurrentToken().value === '-')) {
      const operator = this.consume('operator').value;
      const right = this.parseMultiplicativeExpression();
      
      const additiveNode = new ASTNode('additive_expression', operator);
      additiveNode.addChild(left);
      additiveNode.addChild(right);
      
      left = additiveNode;
    }
    
    return left;
  }
  
  /**
   * Parse multiplicative expression
   * @returns {ASTNode} Multiplicative expression node
   */
  parseMultiplicativeExpression() {
    let left = this.parseUnaryExpression();
    
    while (this.checkType('operator') &&
           (this.getCurrentToken().value === '*' || 
            this.getCurrentToken().value === '/' || 
            this.getCurrentToken().value === '%')) {
      const operator = this.consume('operator').value;
      const right = this.parseUnaryExpression();
      
      const multiplicativeNode = new ASTNode('multiplicative_expression', operator);
      multiplicativeNode.addChild(left);
      multiplicativeNode.addChild(right);
      
      left = multiplicativeNode;
    }
    
    return left;
  }
  
  /**
   * Parse unary expression
   * @returns {ASTNode} Unary expression node
   */
  parseUnaryExpression() {
    if (this.checkType('operator') &&
        ['+', '-', '!', '~', '++', '--', '*', '&'].includes(this.getCurrentToken().value)) {
      const operator = this.consume('operator').value;
      const operand = this.parseUnaryExpression();
      
      const unaryNode = new ASTNode('unary_expression', operator);
      unaryNode.addChild(operand);
      
      return unaryNode;
    }
    
    return this.parsePrimaryFactor();
  }
  
  /**
   * Parse primary factor (literals, identifiers, function calls, parenthesized expressions)
   * @returns {ASTNode} Primary factor node
   */
  parsePrimaryFactor() {
    if (this.checkType('literal')) {
      const literal = this.consume('literal');
      return new ASTNode('literal', literal.value);
    } else if (this.checkType('identifier')) {
      const identifier = this.consume('identifier');
      
      // Check for function call
      if (this.checkValue('(')) {
        this.consume('punctuation', '(');
        
        // Function call node
        const callNode = new ASTNode('call_expression', identifier.value);
        
        // Parse arguments
        if (!this.checkValue(')')) {
          do {
            if (this.checkValue(',')) {
              this.consume('punctuation', ',');
            }
            
            const argument = this.parseExpression();
            callNode.addChild(argument);
            
          } while (this.checkValue(','));
        }
        
        this.consume('punctuation', ')');
        
        return callNode;
      }
      
      // Array access
      if (this.checkValue('[')) {
        this.consume('punctuation', '[');
        const index = this.parseExpression();
        this.consume('punctuation', ']');
        
        const arrayNode = new ASTNode('array_access', identifier.value);
        arrayNode.addChild(index);
        
        return arrayNode;
      }
      
      // Simple identifier
      return new ASTNode('identifier', identifier.value);
    } else if (this.checkValue('(')) {
      this.consume('punctuation', '(');
      const expression = this.parseExpression();
      this.consume('punctuation', ')');
      
      return expression;
    }
    
    // Unexpected token
    const token = this.getCurrentToken();
    throw new Error(`Unexpected token while parsing expression: ${token.type} '${token.value}' at line ${token.line}`);
  }
}
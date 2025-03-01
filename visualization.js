/**
 * IFSCee - C Programming Visualization Tool
 * Visualization module for rendering UI elements
 */

/**
 * Visualizer class for rendering various visualizations
 */
export class Visualizer {
  /**
   * Initialize the visualizer
   * @param {AppState} appState - Application state
   */
  constructor(appState) {
    this.appState = appState;
    this.UIElements = appState.UIElements;
  }

  /**
   * Update all visualizations based on current step
   */
  updateVisualizations() {
    const step = this.appState.executionSteps[this.appState.currentStep];
    if (!step) return;

    this.updateMemoryVisualization(step);
    this.updateStackVisualization(step);
    this.updateHeapVisualization(step);
    this.updateConsoleOutput(step);
    this.highlightSourceCode(step.line);
    this.highlightTokens(step);
    this.highlightASTNode(step);
    this.updateStepDescription(step);
  }

  /**
   * Update memory visualization
   * @param {ExecutionStep} step - Current execution step
   */
  updateMemoryVisualization(step) {
    // Verify if memory container exists
    if (!this.UIElements.memoryContainer) return;

    // Clear container
    this.UIElements.memoryContainer.innerHTML = '';

    // Check if there are memory changes in this step
    if (step.changes && step.changes.memory) {
      // Add title
      const title = document.createElement('div');
      title.classList.add('section-header');
      title.textContent = 'MEMORY (RAM)';
      this.UIElements.memoryContainer.appendChild(title);

      // Add detail view toggle
      const detailsToggle = document.createElement('div');
      detailsToggle.classList.add('memory-detail-toggle');

      const toggleButton = document.createElement('button');
      toggleButton.id = 'toggle-detail-btn';
      toggleButton.textContent = 'Toggle Detailed View';
      toggleButton.onclick = () => this.toggleMemoryDetailView();

      detailsToggle.appendChild(toggleButton);
      this.UIElements.memoryContainer.appendChild(detailsToggle);

      // Container for memory items
      const memoryContainer = document.createElement('div');
      memoryContainer.classList.add('memory-layout-container');
      memoryContainer.id = 'memory-container-items';
      this.UIElements.memoryContainer.appendChild(memoryContainer);

      // Stack memory group
      if (Object.keys(this.appState.memory).length > 0) {
        this.addMemoryGroup(memoryContainer, 'Stack Memory', this.filterStackAddresses());
      }

      // Heap memory group (if exists)
      if (Object.keys(this.appState.heap).length > 0) {
        this.addMemoryGroup(memoryContainer, 'Heap Memory', this.filterHeapAddresses());
      }

      // Add detailed byte view (initially hidden)
      const detailsContainer = document.createElement('div');
      detailsContainer.classList.add('memory-detail-view');
      detailsContainer.id = 'memory-detail-view';
      detailsContainer.style.display = 'none';
      this.UIElements.memoryContainer.appendChild(detailsContainer);

      // Fill detailed byte view
      this.fillDetailedMemoryView(detailsContainer);
    }
  }

  /**
   * Filter stack memory addresses
   * @returns {Array} Array of stack memory addresses
   */
  filterStackAddresses() {
    return Object.keys(this.appState.memory)
      .filter(address => parseInt(address) < 0x8000)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * Filter heap memory addresses
   * @returns {Array} Array of heap memory addresses
   */
  filterHeapAddresses() {
    return Object.keys(this.appState.memory)
      .filter(address => parseInt(address) >= 0x8000)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * Add a memory group
   * @param {HTMLElement} container - Container element
   * @param {string} title - Group title
   * @param {Array} addresses - Memory addresses to display
   */
  addMemoryGroup(container, title, addresses) {
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('memory-group');
    groupContainer.style.marginBottom = '15px';

    const groupTitle = document.createElement('div');
    groupTitle.textContent = title;
    groupTitle.style.fontWeight = 'bold';
    groupTitle.style.marginBottom = '5px';
    groupTitle.style.paddingLeft = '5px';
    groupTitle.style.borderLeft = '3px solid #4CAF50';
    groupContainer.appendChild(groupTitle);

    // Add memory items
    addresses.forEach(address => {
      const item = this.appState.memory[address];
      const memoryItem = document.createElement('div');
      memoryItem.classList.add('memory-item');

      // Check if this item was changed in current step
      const currentStep = this.appState.executionSteps[this.appState.currentStep];
      if (currentStep.changes.memory && currentStep.changes.memory[address]) {
        memoryItem.classList.add('changed');
      }

      const addressElement = document.createElement('div');
      addressElement.classList.add('memory-address');
      addressElement.textContent = `0x${parseInt(address).toString(16).padStart(8, '0')}`;

      const valueElement = document.createElement('div');
      valueElement.classList.add('memory-value');

      // Format value display based on type
      if (typeof item.value === 'object' && item.value !== null) {
        // Object (like a struct)
        valueElement.innerHTML = `<span style="color: #9C27B0;">${JSON.stringify(item.value)}</span> (${item.name}: ${item.type})`;
      } else if (item.type.includes('*')) {
        // Pointer
        let additionalClass = '';
        let additionalInfo = '';

        // Check for dangling pointer
        if (item.value >= 0x8000) {
          const heapBlock = Object.values(this.appState.heap).find(b => b.address === item.value);
          if (heapBlock && heapBlock.freed) {
            additionalClass = 'dangling';
            additionalInfo = ' (dangling pointer)';
          }
        }

        valueElement.innerHTML = `<span class="pointer-arrow ${additionalClass}">${item.value ? '0x' + parseInt(item.value).toString(16).padStart(8, '0') : 'NULL'}</span> (${item.name}: ${item.type})${additionalInfo}`;
      } else {
        // Normal value
        valueElement.textContent = `${item.value} (${item.name}: ${item.type})`;
      }

      memoryItem.appendChild(addressElement);
      memoryItem.appendChild(valueElement);
      groupContainer.appendChild(memoryItem);
    });

    container.appendChild(groupContainer);
  }

  /**
   * Toggle between detailed and simplified memory views
   */
  toggleMemoryDetailView() {
    const detailView = document.getElementById('memory-detail-view');
    const toggleButton = document.getElementById('toggle-detail-btn');
    const memoryItems = document.getElementById('memory-container-items');

    if (detailView.style.display === 'none') {
      detailView.style.display = 'block';
      toggleButton.textContent = 'Show Simplified View';
      memoryItems.style.display = 'none';
    } else {
      detailView.style.display = 'none';
      toggleButton.textContent = 'Toggle Detailed View';
      memoryItems.style.display = 'block';
    }
  }

  /**
   * Fill detailed memory view with byte-level information
   * @param {HTMLElement} container - Container element
   */
  fillDetailedMemoryView(container) {
    // Header
    const header = document.createElement('div');
    header.classList.add('memory-bytes-header');

    const addrHeader = document.createElement('div');
    addrHeader.classList.add('byte-address');
    addrHeader.textContent = 'Address';

    const valueHeader = document.createElement('div');
    valueHeader.classList.add('byte-value');
    valueHeader.textContent = 'Value (Hex)';

    const asciiHeader = document.createElement('div');
    asciiHeader.classList.add('byte-ascii');
    asciiHeader.textContent = 'ASCII';

    header.appendChild(addrHeader);
    header.appendChild(valueHeader);
    header.appendChild(asciiHeader);
    container.appendChild(header);

    // All memory addresses sorted
    const allAddresses = [...Object.keys(this.appState.memory)]
      .map(a => parseInt(a))
      .sort((a, b) => a - b);

    if (allAddresses.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No memory data to display';
      emptyMessage.style.padding = '10px';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#888';
      container.appendChild(emptyMessage);
      return;
    }

    // For each address
    allAddresses.forEach(address => {
      const item = this.appState.memory[address];
      let size = 4; // Default size for int

      if (item.type.includes('*')) size = 8; // Pointers
      else if (item.type.includes('char')) size = 1; // char
      else if (item.type.includes('float')) size = 4; // float
      else if (item.type.includes('double')) size = 8; // double
      else if (item.type.includes('struct')) {
        // For structs, simulate size based on object
        size = Object.keys(item.value).length * 4;
      } else if (item.type.includes('[')) {
        // For arrays, get size from array declaration
        const match = item.type.match(/\[(\d+)\]/);
        if (match) {
          const elementType = item.type.split('[')[0].trim();
          let elementSize = 4; // int by default
          if (elementType.includes('char')) elementSize = 1;
          else if (elementType.includes('double')) elementSize = 8;

          size = parseInt(match[1]) * elementSize;
        }
      }

      // For each byte in item
      for (let i = 0; i < size; i++) {
        const byteRow = document.createElement('div');
        byteRow.classList.add('memory-bytes-row');

        const currentAddress = address + i;

        const byteAddr = document.createElement('div');
        byteAddr.classList.add('byte-address');
        byteAddr.textContent = `0x${currentAddress.toString(16).padStart(8, '0')}`;

        const byteValue = document.createElement('div');
        byteValue.classList.add('byte-value');

        // Simulate byte value based on position
        let byteValueHex;
        if (typeof item.value === 'number') {
          // Simulation for number
          byteValueHex = ((item.value >> (i * 8)) & 0xFF).toString(16).padStart(2, '0');
        } else if (typeof item.value === 'string' && i < item.value.length) {
          // Character from string
          byteValueHex = item.value.charCodeAt(i).toString(16).padStart(2, '0');
        } else if (typeof item.value === 'object' && item.value !== null) {
          // Object (struct) - simulate bytes
          byteValueHex = 'xx';
        } else {
          // Default - unknown bytes
          byteValueHex = 'xx';
        }

        byteValue.textContent = byteValueHex;

        const byteAscii = document.createElement('div');
        byteAscii.classList.add('byte-ascii');

        // Convert byte value to ASCII if possible
        let ascii = '.';
        const byteInt = parseInt(byteValueHex, 16);
        if (!isNaN(byteInt) && byteInt >= 32 && byteInt <= 126) {
          ascii = String.fromCharCode(byteInt);
        }

        byteAscii.textContent = ascii;

        byteRow.appendChild(byteAddr);
        byteRow.appendChild(byteValue);
        byteRow.appendChild(byteAscii);

        // Check if this byte was changed in current step
        const currentStep = this.appState.executionSteps[this.appState.currentStep];
        if (currentStep.changes.memory && currentStep.changes.memory[address]) {
          byteRow.classList.add('changed');
        }

        container.appendChild(byteRow);
      }

      // Add separator between items
      const separator = document.createElement('div');
      separator.style.height = '5px';
      container.appendChild(separator);
    });
  }

  /**
   * Update stack visualization
   * @param {ExecutionStep} step - Current execution step
   */
  updateStackVisualization(step) {
    // Verify if stack container exists
    if (!this.UIElements.stackContainer) return;

    // Clear container
    this.UIElements.stackContainer.innerHTML = '';

    // Check if there are stack changes in this step
    if (step.changes && step.changes.stack) {
      // Add title
      const title = document.createElement('div');
      title.classList.add('section-header');
      title.textContent = 'CALL STACK';
      this.UIElements.stackContainer.appendChild(title);

      // For each frame in stack (reversed to show newest on top)
      [...this.appState.stack].reverse().forEach((frame, index) => {
        const frameElement = document.createElement('div');
        frameElement.classList.add('stack-frame');

        // Special styling for current frame
        if (index === 0) {
          frameElement.style.borderColor = '#4CAF50';
          frameElement.style.background = '#e7f3e8';
          frameElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }

        // Frame header
        const headerElement = document.createElement('div');
        headerElement.classList.add('stack-frame-header');

        // Icon based on function
        let icon = '📋';
        if (frame.functionName === 'main') icon = '🏠';
        else if (frame.functionName === 'fatorial') icon = '🔢';
        else if (frame.functionName === 'contarRegressiva') icon = '⏳';

        headerElement.innerHTML = `${icon} <strong>${frame.functionName}()</strong> return: 0x${frame.returnAddress.toString(16).padStart(8, '0')}`;
        frameElement.appendChild(headerElement);

        // Frame content (variables)
        const contentElement = document.createElement('div');
        contentElement.classList.add('stack-frame-content');

        // Variables container
        const variablesContainer = document.createElement('div');
        variablesContainer.classList.add('stack-variables');

        // Add each variable
        Object.keys(frame.variables).forEach(varName => {
          const variable = frame.variables[varName];
          const varElement = document.createElement('div');
          varElement.classList.add('stack-variable');

          // Check if variable was changed in current step
          if (step.changes.stack &&
              step.changes.stack[frame.functionName] &&
              (step.changes.stack[frame.functionName].add?.name === varName ||
               step.changes.stack[frame.functionName].update?.name === varName)) {
            varElement.classList.add('changed');
          }

          // Variable type determines icon and color
          let varIcon = '📄';
          let bgColor = '#f1f8e9';

          if (variable.type.includes('*')) {
            varIcon = '🔗';
            bgColor = '#e3f2fd';
          } else if (variable.type.includes('int')) {
            varIcon = '🔢';
            bgColor = '#fff3e0';
          } else if (variable.type.includes('float') || variable.type.includes('double')) {
            varIcon = '📊';
            bgColor = '#e8f5e9';
          } else if (variable.type.includes('char')) {
            varIcon = '🔤';
            bgColor = '#e1f5fe';
          } else if (variable.type.includes('struct')) {
            varIcon = '📦';
            bgColor = '#f3e5f5';
          }

          varElement.style.backgroundColor = bgColor;
          varElement.style.padding = '5px';
          varElement.style.marginBottom = '5px';
          varElement.style.borderRadius = '3px';
          varElement.style.border = '1px solid rgba(0,0,0,0.1)';

          // Variable content
          if (variable.type.includes('*')) {
            // Pointer
            varElement.innerHTML = `${varIcon} <strong>${varName}</strong> (${variable.type}): <span class="pointer-arrow">${variable.value ? '0x' + parseInt(variable.value).toString(16).padStart(8, '0') : 'NULL'}</span>`;
          } else if (typeof variable.value === 'object' && variable.value !== null) {
            // Object (struct)
            varElement.innerHTML = `${varIcon} <strong>${varName}</strong> (${variable.type}): ${JSON.stringify(variable.value)}`;
          } else {
            // Normal value
            varElement.innerHTML = `${varIcon} <strong>${varName}</strong> (${variable.type}): ${variable.value}`;
          }

          variablesContainer.appendChild(varElement);
        });

        contentElement.appendChild(variablesContainer);
        frameElement.appendChild(contentElement);
        this.UIElements.stackContainer.appendChild(frameElement);
      });

      // Show empty message if no frames
      if (this.appState.stack.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'No stack frames';
        emptyMessage.style.padding = '20px';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#888';
        this.UIElements.stackContainer.appendChild(emptyMessage);
      }
    }
  }

  /**
   * Update heap visualization
   * @param {ExecutionStep} step - Current execution step
   */
  updateHeapVisualization(step) {
    // Verify if heap container exists
    if (!this.UIElements.heapContainer || !this.UIElements.heapEmptyMessage) return;

    // Clear container
    this.UIElements.heapContainer.innerHTML = '';

    // Add title
    const title = document.createElement('div');
    title.classList.add('section-header');
    title.textContent = 'HEAP MEMORY (DYNAMIC ALLOCATION)';
    this.UIElements.heapContainer.appendChild(title);

    const heapBlocks = Object.values(this.appState.heap);

    if (heapBlocks.length > 0) {
      // Hide empty message
      this.UIElements.heapEmptyMessage.style.display = 'none';

      // Container for heap blocks
      const blocksContainer = document.createElement('div');
      blocksContainer.style.padding = '10px';
      this.UIElements.heapContainer.appendChild(blocksContainer);

      heapBlocks.forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.classList.add('heap-block');

        if (block.freed) {
          blockElement.classList.add('freed');
        }

        // Check if block was changed in current step
        if (step.changes && step.changes.heap && step.changes.heap[block.address]) {
          blockElement.classList.add('changed');
        }

        // Block header
        const headerElement = document.createElement('div');
        headerElement.classList.add('heap-header');

        // Status indicator
        const statusIndicator = document.createElement('span');
        statusIndicator.style.display = 'inline-block';
        statusIndicator.style.width = '10px';
        statusIndicator.style.height = '10px';
        statusIndicator.style.borderRadius = '50%';
        statusIndicator.style.marginRight = '5px';

        if (block.freed) {
          statusIndicator.style.backgroundColor = '#f44336';
          statusIndicator.title = 'Freed (free)';
        } else {
          statusIndicator.style.backgroundColor = '#4CAF50';
          statusIndicator.title = 'Allocated (malloc)';
        }

        headerElement.appendChild(statusIndicator);
        headerElement.appendChild(document.createTextNode(
          `Address: 0x${block.address.toString(16).padStart(8, '0')}, Size: ${block.size} bytes`
        ));

        // Block status
        const statusElement = document.createElement('div');
        statusElement.style.float = 'right';
        statusElement.style.fontSize = '12px';
        statusElement.style.padding = '2px 5px';
        statusElement.style.borderRadius = '3px';

        if (block.freed) {
          statusElement.textContent = 'FREED';
          statusElement.style.backgroundColor = '#ffebee';
          statusElement.style.color = '#c62828';
        } else {
          statusElement.textContent = 'ALLOCATED';
          statusElement.style.backgroundColor = '#e8f5e9';
          statusElement.style.color = '#2e7d32';
        }

        headerElement.appendChild(statusElement);
        blockElement.appendChild(headerElement);

        // Block content
        const contentElement = document.createElement('div');
        contentElement.classList.add('heap-content');

        if (block.freed) {
          contentElement.innerHTML = '<span style="color: #999; font-style: italic;">Memory freed - content indeterminate</span>';
        } else if (typeof block.content === 'object' && block.content !== null) {
          // Array or structure
          if (Array.isArray(block.content)) {
            contentElement.textContent = JSON.stringify(block.content);
          } else {
            // Detailed view for objects
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';

            // For each index/property
            Object.keys(block.content).forEach((key, index) => {
              const row = document.createElement('tr');

              // Alternate row colors
              if (index % 2 === 0) {
                row.style.backgroundColor = '#f9f9f9';
              }

              // Index/key cell
              const keyCell = document.createElement('td');
              keyCell.style.padding = '3px';
              keyCell.style.border = '1px solid #ddd';
              keyCell.textContent = key;

              // Value cell
              const valueCell = document.createElement('td');
              valueCell.style.padding = '3px';
              valueCell.style.border = '1px solid #ddd';
              valueCell.textContent = block.content[key];

              row.appendChild(keyCell);
              row.appendChild(valueCell);
              table.appendChild(row);
            });

            contentElement.appendChild(table);
          }
        } else {
          // Simple value
          contentElement.textContent = block.content;
        }

        blockElement.appendChild(contentElement);
        blocksContainer.appendChild(blockElement);
      });
    } else {
      // Show empty message
      this.UIElements.heapEmptyMessage.style.display = 'block';
    }
  }

  /**
   * Update console output display
   * @param {ExecutionStep} step - Current execution step
   */
  updateConsoleOutput(step) {
    if (!this.UIElements.outputConsole) return;

    if (step.changes && step.changes.saida) {
      // Clear container
      this.UIElements.outputConsole.innerHTML = '';

      // Add title
      const title = document.createElement('div');
      title.classList.add('section-header');
      title.textContent = 'CONSOLE OUTPUT';
      this.UIElements.outputConsole.appendChild(title);

      // Output content
      const outputElement = document.createElement('div');
      outputElement.classList.add('console-output');
      outputElement.style.fontFamily = 'monospace';
      outputElement.style.whiteSpace = 'pre-wrap';
      outputElement.style.padding = '10px';
      outputElement.style.backgroundColor = '#f5f5f5';
      outputElement.style.borderRadius = '3px';
      outputElement.style.border = '1px solid #ddd';
      outputElement.style.maxHeight = '150px';
      outputElement.style.overflow = 'auto';

      // Highlight newest output
      const fullOutput = this.appState.consoleOutput;
      const newOutput = step.changes.saida;

      // Previous output
      if (fullOutput.length > newOutput.length) {
        const previousOutput = fullOutput.substring(0, fullOutput.length - newOutput.length);
        const previousSpan = document.createElement('span');
        previousSpan.textContent = previousOutput;
        outputElement.appendChild(previousSpan);
      }

      // New output (highlighted)
      const newOutputSpan = document.createElement('span');
      newOutputSpan.textContent = newOutput;
      newOutputSpan.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
      newOutputSpan.style.display = 'inline-block';
      newOutputSpan.style.width = '100%';
      newOutputSpan.style.animation = 'highlight-change 1.5s ease';
      outputElement.appendChild(newOutputSpan);

      this.UIElements.outputConsole.appendChild(outputElement);

      // Scroll to newest output
      setTimeout(() => {
        outputElement.scrollTop = outputElement.scrollHeight;
      }, 100);
    }
  }

  /**
   * Highlight source code line
   * @param {number} lineNumber - Line number to highlight
   */
  highlightSourceCode(lineNumber) {
    if (!this.UIElements.codeInput) return;

    // Get code lines
    const codeLines = this.UIElements.codeInput.value.split('\n');
    
    // Create temporary element to store highlighted code
    const tempElement = document.createElement('div');
    
    // Add each line with highlighting as needed
    codeLines.forEach((line, index) => {
      const lineDiv = document.createElement('div');
      
      if (index === lineNumber - 1) {
        lineDiv.classList.add('line-highlight');
      }
      
      lineDiv.textContent = line;
      tempElement.appendChild(lineDiv);
    });
    
    // Note: In a real implementation, this would need to handle the CodeMirror
    // or other code editor. This is a simplification.
    console.log(`Highlighting line ${lineNumber} in code editor`);
  }

  /**
   * Highlight tokens for current step
   * @param {ExecutionStep} step - Current execution step
   */
  highlightTokens(step) {
    if (!this.UIElements.tokenContainer) return;
    
    // Find tokens related to current line
    const lineTokens = this.appState.tokens.filter(token => token.line === step.line);
    
    // Clear previous highlights
    const allTokenElements = this.UIElements.tokenContainer.querySelectorAll('.token-item');
    allTokenElements.forEach(element => {
      element.classList.remove('current-token');
    });
    
    // Highlight tokens for current line
    if (lineTokens.length > 0) {
      // This would need to find the actual DOM elements for these tokens
      console.log(`Highlighting ${lineTokens.length} tokens for line ${step.line}`);
    }
  }

  /**
   * Highlight AST node for current step
   * @param {ExecutionStep} step - Current execution step
   */
  highlightASTNode(step) {
    if (!this.UIElements.astContainer) return;
    
    // Clear previous highlights
    const allNodeElements = this.UIElements.astContainer.querySelectorAll('.ast-node');
    allNodeElements.forEach(element => {
      element.classList.remove('active');
    });
    
    // In a real implementation, this would need to map code lines to AST nodes
    console.log(`Highlighting AST node for line ${step.line}`);
  }

  /**
   * Update description of the current step
   * @param {ExecutionStep} step - Current execution step
   */
  updateStepDescription(step) {
    // Find or create description container
    let descriptionContainer = document.getElementById('step-description');
    if (!descriptionContainer) {
      descriptionContainer = document.createElement('div');
      descriptionContainer.id = 'step-description';
      descriptionContainer.classList.add('step-description');
      descriptionContainer.style.marginTop = '15px';
      descriptionContainer.style.padding = '10px';
      descriptionContainer.style.backgroundColor = '#f5f5f5';
      descriptionContainer.style.borderRadius = '5px';
      descriptionContainer.style.border = '1px solid #ddd';
      descriptionContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      
      // Insert before memory visualizer
      if (this.UIElements.memoryContainer) {
        this.UIElements.memoryContainer.parentNode.insertBefore(
          descriptionContainer, 
          this.UIElements.memoryContainer
        );
      }
    }
    
    // Clear previous content
    descriptionContainer.innerHTML = '';
    
    // Title with icon based on step type
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    title.style.fontSize = '16px';
    title.style.display = 'flex';
    title.style.alignItems = 'center';
    
    // Choose appropriate icon based on step type
    let icon = '📝';
    let iconColor = '#4CAF50';
    
    switch (step.type) {
      case 'initialization':
        icon = '🚀';
        iconColor = '#2196F3';
        break;
      case 'declaration':
        icon = '📦';
        iconColor = '#FF9800';
        break;
      case 'assignment':
        icon = '✏️';
        iconColor = '#9C27B0';
        break;
      case 'call':
        icon = '📞';
        iconColor = '#00BCD4';
        break;
      case 'return':
        icon = '↩️';
        iconColor = '#F44336';
        break;
      case 'conditional':
        icon = '🔀';
        iconColor = '#3F51B5';
        break;
      case 'finalization':
        icon = '🏁';
        iconColor = '#607D8B';
        break;
    }
    
    // Create element for icon
    const iconElement = document.createElement('span');
    iconElement.textContent = icon;
    iconElement.style.marginRight = '8px';
    iconElement.style.fontSize = '20px';
    
    // Title text
    const titleText = document.createElement('span');
    titleText.textContent = `Step ${this.appState.currentStep + 1}: ${step.type.charAt(0).toUpperCase() + step.type.slice(1)}`;
    
    title.appendChild(iconElement);
    title.appendChild(titleText);
    descriptionContainer.appendChild(title);
    
    // Step description
    const description = document.createElement('div');
    description.textContent = step.description;
    description.style.marginBottom = '10px';
    descriptionContainer.appendChild(description);
    
    // Changes details, if any
    if (step.changes && Object.keys(step.changes).length > 0) {
      const changes = document.createElement('div');
      changes.style.marginTop = '10px';
      changes.style.fontSize = '14px';
      
      // Changes section title
      const changesTitle = document.createElement('div');
      changesTitle.textContent = 'Changes in this step:';
      changesTitle.style.fontWeight = 'bold';
      changesTitle.style.marginBottom = '5px';
      changes.appendChild(changesTitle);
      
      // Changes list
      const changesList = document.createElement('ul');
      changesList.style.paddingLeft = '20px';
      changesList.style.margin = '5px 0';
      
      // Memory changes
      if (step.changes.memory) {
        const memoryItem = document.createElement('li');
        const addresses = Object.keys(step.changes.memory);
        
        if (addresses.length === 1) {
          const address = addresses[0];
          const item = step.changes.memory[address];
          memoryItem.textContent = `Memory: ${item.name} (${item.type}) = ${item.value} at 0x${parseInt(address).toString(16).padStart(8, '0')}`;
        } else {
          memoryItem.textContent = `Memory: ${addresses.length} variables changed`;
        }
        
        changesList.appendChild(memoryItem);
      }
      
      // Stack changes
      if (step.changes.stack) {
        const stackItem = document.createElement('li');
        const changedFunctions = Object.keys(step.changes.stack);
        
        changedFunctions.forEach(func => {
          const funcChanges = step.changes.stack[func];
          
          if (funcChanges.add) {
            const addedVar = funcChanges.add;
            stackItem.textContent = `Stack: Variable ${addedVar.name} added to function ${func} with value ${addedVar.value}`;
          } else if (funcChanges.update) {
            const updatedVar = funcChanges.update;
            stackItem.textContent = `Stack: Variable ${updatedVar.name} in function ${func} updated to ${updatedVar.value}`;
          } else if (funcChanges.remove) {
            stackItem.textContent = `Stack: Frame for function ${func} removed`;
          }
        });
        
        changesList.appendChild(stackItem);
      }
      
      // Heap changes
      if (step.changes.heap) {
        const heapItem = document.createElement('li');
        const blocks = Object.keys(step.changes.heap);
        
        if (blocks.length === 1) {
          const block = step.changes.heap[blocks[0]];
          if (block.freed) {
            heapItem.textContent = `Heap: Block at 0x${parseInt(blocks[0]).toString(16).padStart(8, '0')} was freed`;
          } else {
            heapItem.textContent = `Heap: New block allocated at 0x${parseInt(blocks[0]).toString(16).padStart(8, '0')} (${block.size} bytes)`;
          }
        } else {
          heapItem.textContent = `Heap: ${blocks.length} blocks changed`;
        }
        
        changesList.appendChild(heapItem);
      }
      
      // Output changes
      if (step.changes.saida) {
        const outputItem = document.createElement('li');
        outputItem.textContent = `Output: New message added`;
        changesList.appendChild(outputItem);
      }
      
      changes.appendChild(changesList);
      descriptionContainer.appendChild(changes);
    }
    
    // Add educational tip if appropriate
    if (this.isEducationalStep(step)) {
      const tip = this.createEducationalTip(step);
      descriptionContainer.appendChild(tip);
    }
  }

  /**
   * Check if a step warrants an educational tip
   * @param {ExecutionStep} step - Current execution step
   * @returns {boolean} True if step should have an educational tip
   */
  isEducationalStep(step) {
    // Steps that typically deserve special explanations
    const educationalTypes = [
      'initialization',
      'declaration',
      'assignment',
      'call',
      'return'
    ];
    
    // Check for specific descriptions that need explanation
    const educationalContent = [
      'pointer',
      'allocation',
      'free',
      'address',
      'malloc',
      'free'
    ];
    
    // Check step type
    if (educationalTypes.includes(step.type)) return true;
    
    // Check description content
    if (educationalContent.some(term => step.description.toLowerCase().includes(term))) return true;
    
    return false;
  }

  /**
   * Create an educational tip based on step type
   * @param {ExecutionStep} step - Current execution step
   * @returns {HTMLElement} Educational tip element
   */
  createEducationalTip(step) {
    const tipContainer = document.createElement('div');
    tipContainer.classList.add('educational-tip');
    tipContainer.style.marginTop = '10px';
    tipContainer.style.padding = '8px';
    tipContainer.style.backgroundColor = '#e8f5e9';
    tipContainer.style.borderLeft = '4px solid #4CAF50';
    tipContainer.style.borderRadius = '4px';
    
    const titleDiv = document.createElement('div');
    titleDiv.textContent = '💡 Tip';
    titleDiv.style.fontWeight = 'bold';
    titleDiv.style.marginBottom = '5px';
    titleDiv.style.color = '#2E7D32';
    
    tipContainer.appendChild(titleDiv);
    
    const textDiv = document.createElement('div');
    textDiv.style.fontSize = '14px';
    
    // Select tip based on step type and content
    let tipText = '';
    
    if (step.type === 'declaration' && step.description.includes('pointer')) {
      tipText = 'Pointers store memory addresses. When we declare a pointer like "int *ptr", we\'re creating a variable that can store the address of an int variable.';
    } else if (step.type === 'assignment' && step.description.includes('*ptr')) {
      tipText = 'The * (dereference) operator accesses the value stored at the address pointed to by the pointer. Modifying *ptr changes the value of the variable that ptr points to.';
    } else if (step.type === 'assignment' && step.description.includes('&')) {
      tipText = 'The & (address-of) operator returns the memory address of a variable. This is how we make a pointer point to a specific variable.';
    } else if (step.type === 'call' && step.description.includes('malloc')) {
      tipText = 'The malloc() function dynamically allocates memory on the heap. Always check if allocation was successful and free this memory with free() when no longer needed.';
    } else if (step.type === 'call' && step.description.includes('free')) {
      tipText = 'The free() function releases a block of memory previously allocated with malloc(). Using a pointer after calling free() can cause a "use-after-free", a dangerous type of memory error.';
    } else if (step.type === 'initialization') {
      tipText = 'At the start of execution, the program sets up the execution stack with the main function frame. Global variables are initialized at this phase.';
    } else if (step.type === 'return') {
      tipText = 'The return value is calculated and the current frame is removed from the stack. Control returns to the calling function at the stored return address.';
    } else if (step.type === 'finalization') {
      tipText = 'When execution ends, all resources are released. Any memory not explicitly freed with free() will be reclaimed by the operating system.';
    } else {
      tipText = 'This step demonstrates a fundamental concept in C: direct memory manipulation. Observe how values change at the memory addresses shown.';
    }
    
    textDiv.textContent = tipText;
    tipContainer.appendChild(textDiv);
    
    return tipContainer;
  }

  /**
   * Show error message in output console
   * @param {string} message - Error message
   */
  showError(message) {
    if (!this.UIElements.outputConsole) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error');
    
    // Add error icon
    const errorIcon = document.createElement('span');
    errorIcon.textContent = '⚠️ ';
    errorIcon.style.fontSize = '16px';
    errorIcon.style.marginRight = '5px';
    errorDiv.appendChild(errorIcon);
    
    // Add error message
    const errorMessage = document.createTextNode(message);
    errorDiv.appendChild(errorMessage);
    
    // Add copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.style.marginLeft = '10px';
    copyButton.style.fontSize = '12px';
    copyButton.style.padding = '2px 5px';
    copyButton.style.backgroundColor = '#f1f1f1';
    copyButton.style.border = '1px solid #ddd';
    copyButton.style.borderRadius = '3px';
    copyButton.style.cursor = 'pointer';
    
    copyButton.onclick = () => {
      navigator.clipboard.writeText(message)
        .then(() => {
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy';
          }, 2000);
        });
    };
    
    errorDiv.appendChild(copyButton);
    this.UIElements.outputConsole.appendChild(errorDiv);
  }
}
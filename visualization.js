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
          frameElement.style.background = '#e7f
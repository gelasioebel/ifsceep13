/**
 * IFSCee - C Programming Visualization Tool
 * Enhanced visualization module for rendering UI elements with animations
 */

/**
 * Visualizer class for rendering various visualizations with optimized performance
 */
export class Visualizer {
  /**
   * Initialize the visualizer
   * @param {AppState} appState - Application state
   */
  constructor(appState) {
    this.appState = appState;
    this.UIElements = appState.UIElements;

    // Cache for visualization elements to improve performance
    this.cache = {
      memory: {},
      stack: {},
      heap: {},
      tokens: {},
      ast: {}
    };

    // Track visualized elements for animation
    this.visualizedElements = {
      memory: new Set(),
      stack: new Set(),
      heap: new Set()
    };

    // Animation timing
    this.animationDuration = 300; // ms
  }

  /**
   * Update all visualizations based on current step with optimized rendering
   */
  updateVisualizations() {
    // Use request animation frame for smoother rendering
    requestAnimationFrame(() => {
      const step = this.appState.executionSteps[this.appState.currentStep];
      if (!step) return;

      // Update visualizations with staggered animations
      this.updateMemoryVisualization(step);

      setTimeout(() => {
        this.updateStackVisualization(step);
      }, 50);

      setTimeout(() => {
        this.updateHeapVisualization(step);
      }, 100);

      setTimeout(() => {
        this.updateConsoleOutput(step);
      }, 150);

      this.highlightSourceCode(step.line);
      this.highlightTokens(step);
      this.highlightASTNode(step);
      this.updateStepDescription(step);
    });
  }

  /**
   * Determine if visualization needs full reset based on step type
   * @param {string} visualizationType - Type of visualization
   * @param {ExecutionStep} step - Current execution step
   * @returns {boolean} Whether visualization should be reset
   */
  shouldResetVisualization(visualizationType, step) {
    // Reset on first step, initialization, or after significant state changes
    if (this.appState.currentStep === 0) return true;
    if (step.type === 'initialization') return true;
    if (step.type === 'finalization') return true;

    // Check if the container is empty
    if (visualizationType === 'memory') {
      return !document.querySelector('.memory-animation-wrapper');
    } else if (visualizationType === 'stack') {
      return !document.querySelector('.stack-frames-container');
    } else if (visualizationType === 'heap') {
      return !document.querySelector('.heap-blocks-container');
    }

    return false;
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
   * Update memory visualization with performance optimizations and animations
   * @param {ExecutionStep} step - Current execution step
   */
  updateMemoryVisualization(step) {
    // Verify if memory container exists
    if (!this.UIElements.memoryContainer) return;

    // Clear container only if necessary (performance optimization)
    const shouldReset = this.shouldResetVisualization('memory', step);
    if (shouldReset) {
      this.UIElements.memoryContainer.innerHTML = '';

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

      // Container for memory items with a wrapper for smooth transitions
      const memoryContainer = document.createElement('div');
      memoryContainer.classList.add('memory-layout-container');
      memoryContainer.id = 'memory-container-items';

      // Add wrapper for animations
      const memoryWrapper = document.createElement('div');
      memoryWrapper.classList.add('memory-animation-wrapper');
      memoryWrapper.style.opacity = '0';
      memoryWrapper.style.transform = 'translateY(10px)';
      memoryWrapper.style.transition = 'opacity 300ms ease, transform 300ms ease';

      memoryContainer.appendChild(memoryWrapper);
      this.UIElements.memoryContainer.appendChild(memoryContainer);

      // Track previously visualized memory addresses
      this.visualizedElements.memory.clear();

      // Add detailed byte view (initially hidden)
      const detailsContainer = document.createElement('div');
      detailsContainer.classList.add('memory-detail-view');
      detailsContainer.id = 'memory-detail-view';
      detailsContainer.style.display = 'none';
      this.UIElements.memoryContainer.appendChild(detailsContainer);

      // Fill detailed byte view
      this.fillDetailedMemoryView(detailsContainer);

      // Animate entrance
      setTimeout(() => {
        memoryWrapper.style.opacity = '1';
        memoryWrapper.style.transform = 'translateY(0)';
      }, 10);
    }

    // Get the wrapper for memory items
    const memoryWrapper = document.querySelector('.memory-animation-wrapper');
    if (!memoryWrapper) return;

    // Check if there are memory changes in this step
    if (step.changes && step.changes.memory) {
      // Stack memory group with incremental updates
      if (Object.keys(this.appState.memory).length > 0) {
        this.updateMemoryGroup(memoryWrapper, 'Stack Memory', this.filterStackAddresses(), step);
      }

      // Heap memory group (if exists) with incremental updates
      if (Object.keys(this.appState.heap).length > 0) {
        this.updateMemoryGroup(memoryWrapper, 'Heap Memory', this.filterHeapAddresses(), step);
      }
    }
  }

  /**
   * Update a memory group with enhanced animations
   * @param {HTMLElement} container - Container element
   * @param {string} title - Group title
   * @param {Array} addresses - Memory addresses to display
   * @param {ExecutionStep} step - Current execution step
   */
  updateMemoryGroup(container, title, addresses, step) {
    // Check if group already exists
    let groupContainer = container.querySelector(`.memory-group[data-title="${title}"]`);

    // Create group if it doesn't exist
    if (!groupContainer) {
      groupContainer = document.createElement('div');
      groupContainer.classList.add('memory-group');
      groupContainer.setAttribute('data-title', title);
      groupContainer.style.marginBottom = '15px';

      // Group title
      const groupTitle = document.createElement('div');
      groupTitle.textContent = title;
      groupTitle.style.fontWeight = 'bold';
      groupTitle.style.marginBottom = '5px';
      groupTitle.style.paddingLeft = '5px';
      groupTitle.style.borderLeft = '3px solid #4CAF50';
      groupContainer.appendChild(groupTitle);

      container.appendChild(groupContainer);
    }

    // Process each memory address
    addresses.forEach(address => {
      const item = this.appState.memory[address];
      const addressStr = address.toString();

      // Check if this item exists or needs updating
      let memoryItem = container.querySelector(`.memory-item[data-address="${addressStr}"]`);
      const isNewItem = !memoryItem;
      const isChangedItem = step.changes.memory && step.changes.memory[address];

      // If item should be updated or is new
      if (isNewItem || isChangedItem) {
        // If it's an existing item that changed, apply animation
        if (memoryItem && isChangedItem) {
          // Apply change animation
          memoryItem.classList.add('changed');

          // Reset animation after it completes
          setTimeout(() => {
            memoryItem.classList.remove('changed');
          }, 1500);
        }

        // If it's a new item, create it with entrance animation
        if (isNewItem) {
          memoryItem = document.createElement('div');
          memoryItem.classList.add('memory-item');
          memoryItem.setAttribute('data-address', addressStr);

          // Prepare for entrance animation
          memoryItem.style.opacity = '0';
          memoryItem.style.transform = 'translateY(10px)';
          memoryItem.style.transition = 'opacity 300ms ease, transform 300ms ease';

          // Mark as visualized
          this.visualizedElements.memory.add(addressStr);
        }

        // Clear existing content for update
        memoryItem.innerHTML = '';

        const addressElement = document.createElement('div');
        addressElement.classList.add('memory-address');
        addressElement.textContent = `0x${parseInt(address).toString(16).padStart(8, '0')}`;

        const valueElement = document.createElement('div');
        valueElement.classList.add('memory-value');

        // Format value display based on type with enhanced styling
        if (typeof item.value === 'object' && item.value !== null) {
          // Object (like a struct)
          valueElement.innerHTML = `<span class="value-object">${JSON.stringify(item.value)}</span> <span class="value-name">(${item.name}: ${item.type})</span>`;
        } else if (item.type.includes('*')) {
          // Pointer with better visual indication
          let additionalClass = '';
          let additionalInfo = '';

          // Check for dangling pointer
          if (item.value >= 0x8000) {
            const heapBlock = Object.values(this.appState.heap).find(b => b.address === item.value);
            if (heapBlock && heapBlock.freed) {
              additionalClass = 'dangling';
              additionalInfo = '<span class="warning-icon">⚠️</span> <span class="warning-text">dangling pointer</span>';
            }
          }

          valueElement.innerHTML = `<span class="pointer-arrow ${additionalClass}">${item.value ? '0x' + parseInt(item.value).toString(16).padStart(8, '0') : 'NULL'}</span> <span class="value-name">(${item.name}: ${item.type})</span> ${additionalInfo}`;
        } else {
          // Normal value with enhanced display
          valueElement.innerHTML = `<span class="value-primitive">${item.value}</span> <span class="value-name">(${item.name}: ${item.type})</span>`;
        }

        memoryItem.appendChild(addressElement);
        memoryItem.appendChild(valueElement);

        // Add to container if new
        if (isNewItem) {
          groupContainer.appendChild(memoryItem);

          // Trigger entrance animation
          setTimeout(() => {
            memoryItem.style.opacity = '1';
            memoryItem.style.transform = 'translateY(0)';
          }, 10);
        }
      }
    });
  }

  /**
   * Toggle between detailed and simplified memory views with animation
   */
  toggleMemoryDetailView() {
    const detailView = document.getElementById('memory-detail-view');
    const toggleButton = document.getElementById('toggle-detail-btn');
    const memoryItems = document.getElementById('memory-container-items');

    if (!detailView || !memoryItems) return;

    if (detailView.style.display === 'none') {
      // Prepare for transition to detail view
      detailView.style.opacity = '0';
      detailView.style.display = 'block';
      detailView.style.transform = 'translateY(10px)';

      // Fade out current view
      memoryItems.style.transition = 'opacity 300ms ease, transform 300ms ease';
      memoryItems.style.opacity = '0';
      memoryItems.style.transform = 'translateY(-10px)';

      // After current view fades out, fade in detail view
      setTimeout(() => {
        memoryItems.style.display = 'none';
        detailView.style.transition = 'opacity 300ms ease, transform 300ms ease';
        detailView.style.opacity = '1';
        detailView.style.transform = 'translateY(0)';
        toggleButton.textContent = 'Show Simplified View';
      }, 300);
    } else {
      // Prepare for transition to simplified view
      detailView.style.transition = 'opacity 300ms ease, transform 300ms ease';
      detailView.style.opacity = '0';
      detailView.style.transform = 'translateY(-10px)';

      // Prepare simplified view
      memoryItems.style.display = 'block';
      memoryItems.style.opacity = '0';
      memoryItems.style.transform = 'translateY(10px)';

      // After detail view fades out, fade in simplified view
      setTimeout(() => {
        detailView.style.display = 'none';
        memoryItems.style.transition = 'opacity 300ms ease, transform 300ms ease';
        memoryItems.style.opacity = '1';
        memoryItems.style.transform = 'translateY(0)';
        toggleButton.textContent = 'Toggle Detailed View';
      }, 300);
    }
  }

  /**
   * Fill detailed memory view with byte-level information and animations
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

    // Create a fragment for better performance
    const fragment = document.createDocumentFragment();

    // For each address, create rows with staggered animations
    allAddresses.forEach((address, addressIndex) => {
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

      // Create a section for each memory item
      const section = document.createElement('div');
      section.classList.add('memory-byte-section');
      section.style.marginBottom = '10px';
      section.style.opacity = '0';
      section.style.transform = 'translateY(10px)';
      section.style.transition = 'opacity 300ms ease, transform 300ms ease';

      // Add header for this memory item
      const sectionHeader = document.createElement('div');
      sectionHeader.classList.add('memory-byte-section-header');
      sectionHeader.textContent = `${item.name} (${item.type})`;
      sectionHeader.style.fontWeight = 'bold';
      sectionHeader.style.marginBottom = '5px';
      sectionHeader.style.paddingLeft = '5px';
      sectionHeader.style.borderLeft = '3px solid #4CAF50';
      section.appendChild(sectionHeader);

      // For each byte in item
      for (let i = 0; i < size; i++) {
        const byteRow = document.createElement('div');
        byteRow.classList.add('memory-bytes-row');
        byteRow.setAttribute('data-byte-index', i);

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

        section.appendChild(byteRow);
      }

      fragment.appendChild(section);

      // Staggered animation for each section
      setTimeout(() => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }, 20 * addressIndex); // Stagger by address index
    });

    container.appendChild(fragment);
  }

  /**
   * Update stack visualization with enhanced animations
   * @param {ExecutionStep} step - Current execution step
   */
  updateStackVisualization(step) {
    // Verify if stack container exists
    if (!this.UIElements.stackContainer) return;

    // Check if we need to reset the container (e.g., first step)
    const shouldReset = this.shouldResetVisualization('stack', step);

    if (shouldReset) {
      // Clear container
      this.UIElements.stackContainer.innerHTML = '';

      // Add title
      const title = document.createElement('div');
      title.classList.add('section-header');
      title.textContent = 'CALL STACK';
      this.UIElements.stackContainer.appendChild(title);

      // Create container for stack frames with wrapper for animations
      const stackFramesContainer = document.createElement('div');
      stackFramesContainer.classList.add('stack-frames-container');

      // Add wrapper for animations
      const stackWrapper = document.createElement('div');
      stackWrapper.classList.add('stack-animation-wrapper');
      stackWrapper.style.opacity = '0';
      stackWrapper.style.transform = 'translateY(10px)';
      stackWrapper.style.transition = 'opacity 300ms ease, transform 300ms ease';

      stackFramesContainer.appendChild(stackWrapper);
      this.UIElements.stackContainer.appendChild(stackFramesContainer);

      // Clear tracked stack frames
      this.visualizedElements.stack.clear();

      // Animate entrance
      setTimeout(() => {
        stackWrapper.style.opacity = '1';
        stackWrapper.style.transform = 'translateY(0)';
      }, 10);
    }

    // Get the wrapper for stack frames
    const stackWrapper = document.querySelector('.stack-animation-wrapper');
    if (!stackWrapper) return;

    // Check if there are stack changes in this step
    if (step.changes && step.changes.stack) {
      // For each frame in stack (reversed to show newest on top)
      [...this.appState.stack].reverse().forEach((frame, index) => {
        const frameId = `frame-${frame.functionName}-${frame.returnAddress}`;

        // Check if this frame already exists
        let frameElement = stackWrapper.querySelector(`.stack-frame[data-frame-id="${frameId}"]`);
        const isNewFrame = !frameElement;
        const isChangedFrame = step.changes.stack && step.changes.stack[frame.functionName];

        // If frame should be updated or is new
        if (isNewFrame || isChangedFrame) {
          // If frame exists and changed, apply change animation
          if (frameElement && isChangedFrame) {
            // Apply change animation
            frameElement.classList.add('frame-changed');

            // Reset animation after completion
            setTimeout(() => {
              frameElement.classList.remove('frame-changed');
            }, 1500);
          }

          // If it's a new frame, create it with entrance animation
          if (isNewFrame) {
            frameElement = document.createElement('div');
            frameElement.classList.add('stack-frame');
            frameElement.setAttribute('data-frame-id', frameId);

            // Prepare for entrance animation
            frameElement.style.opacity = '0';
            frameElement.style.transform = 'translateY(20px) scale(0.95)';
            frameElement.style.transition = 'opacity 350ms ease, transform 350ms ease';

            // Add frame ID for tracking
            this.visualizedElements.stack.add(frameId);
          }

          // Clear existing content for update
          frameElement.innerHTML = '';

          // Special styling for current frame (top frame)
          if (index === 0) {
            frameElement.classList.add('current-frame');
          } else {
            frameElement.classList.remove('current-frame');
          }

          // Frame header
          const headerElement = document.createElement('div');
          headerElement.classList.add('stack-frame-header');

          // Icon based on function
          let icon = '📋';
          if (frame.functionName === 'main') icon = '🏠';
          else if (frame.functionName === 'fatorial') icon = '🔢';
          else if (frame.functionName === 'contarRegressiva') icon = '⏳';

          headerElement.innerHTML = `${icon} <strong>${frame.functionName}()</strong> <span class="return-address">return: 0x${frame.returnAddress.toString(16).padStart(8, '0')}</span>`;
          frameElement.appendChild(headerElement);

          // Frame content (variables)
          const contentElement = document.createElement('div');
          contentElement.classList.add('stack-frame-content');

          // Variables container
          const variablesContainer = document.createElement('div');
          variablesContainer.classList.add('stack-variables');

          // Add each variable with staggered animation
          Object.keys(frame.variables).forEach((varName, varIndex) => {
            const variable = frame.variables[varName];
            const varElement = document.createElement('div');
            varElement.classList.add('stack-variable');
            varElement.setAttribute('data-var-name', varName);

            // Prepare staggered entrance animation for variables
            if (isNewFrame) {
              varElement.style.opacity = '0';
              varElement.style.transform = 'translateX(10px)';
              varElement.style.transition = 'opacity 300ms ease, transform 300ms ease';
              varElement.style.transitionDelay = `${varIndex * 50}ms`;
            }

            // Check if variable was changed in current step
            if (step.changes.stack &&
                step.changes.stack[frame.functionName] &&
                (step.changes.stack[frame.functionName].add?.name === varName ||
                    step.changes.stack[frame.functionName].update?.name === varName)) {
              varElement.classList.add('changed');

              // Reset animation after completion
              setTimeout(() => {
                varElement.classList.remove('changed');
              }, 1500);
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
            varElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            varElement.style.borderRadius = '5px';
            varElement.style.padding = '8px';
            varElement.style.marginBottom = '8px';
            varElement.style.border = '1px solid rgba(0,0,0,0.1)';
            varElement.style.transition = 'background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease';

            // Add hover effect for variables
            varElement.addEventListener('mouseover', () => {
              varElement.style.transform = 'translateY(-2px)';
              varElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            });

            varElement.addEventListener('mouseout', () => {
              varElement.style.transform = '';
              varElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });

            // Variable content with enhanced styling
            if (variable.type.includes('*')) {
              // Pointer with improved visual
              varElement.innerHTML = `
                <div class="var-header">
                  <span class="var-icon">${varIcon}</span> 
                  <span class="var-name">${varName}</span>
                  <span class="var-type">${variable.type}</span>
                </div>
                <div class="var-value pointer">
                  <span class="pointer-arrow">${variable.value ? '0x' + parseInt(variable.value).toString(16).padStart(8, '0') : 'NULL'}</span>
                </div>
              `;
            } else if (typeof variable.value === 'object' && variable.value !== null) {
              // Object (struct) with enhanced display
              varElement.innerHTML = `
                <div class="var-header">
                  <span class="var-icon">${varIcon}</span> 
                  <span class="var-name">${varName}</span>
                  <span class="var-type">${variable.type}</span>
                </div>
                <div class="var-value object">
                  ${JSON.stringify(variable.value, null, 2).replace(/\\n/g, '<br>').replace(/\\s/g, '&nbsp;')}
                </div>
              `;
            } else {
              // Normal value with enhanced styling
              varElement.innerHTML = `
                <div class="var-header">
                  <span class="var-icon">${varIcon}</span> 
                  <span class="var-name">${varName}</span>
                  <span class="var-type">${variable.type}</span>
                </div>
                <div class="var-value primitive">
                  ${variable.value}
                </div>
              `;
            }

            variablesContainer.appendChild(varElement);

            // Trigger staggered entrance animation for variables in new frames
            if (isNewFrame) {
              setTimeout(() => {
                varElement.style.opacity = '1';
                varElement.style.transform = 'translateX(0)';
              }, 10 + varIndex * 50);
            }
          });

          contentElement.appendChild(variablesContainer);
          frameElement.appendChild(contentElement);

          // Add to container if new
          if (isNewFrame) {
            // Add frame to the beginning for proper stacking (newest on top)
            if (stackWrapper.firstChild) {
              stackWrapper.insertBefore(frameElement, stackWrapper.firstChild);
            } else {
              stackWrapper.appendChild(frameElement);
            }

            // Trigger entrance animation
            setTimeout(() => {
              frameElement.style.opacity = '1';
              frameElement.style.transform = 'translateY(0) scale(1)';
            }, 10);
          }
        }
      });

      // Remove frames that are no longer in the stack with exit animation
      const currentFrameIds = new Set([...this.appState.stack].map(frame =>
          `frame-${frame.functionName}-${frame.returnAddress}`));

      this.visualizedElements.stack.forEach(frameId => {
        if (!currentFrameIds.has(frameId)) {
          const frameElement = stackWrapper.querySelector(`.stack-frame[data-frame-id="${frameId}"]`);

          if (frameElement) {
            // Apply exit animation
            frameElement.style.opacity = '0';
            frameElement.style.transform = 'translateY(-20px) scale(0.95)';

            // Remove after animation completes
            setTimeout(() => {
              if (frameElement.parentNode) {
                frameElement.parentNode.removeChild(frameElement);
              }

              // Remove from tracked elements
              this.visualizedElements.stack.delete(frameId);
            }, 300);
          }
        }
      });

      // Show empty message if no frames
      if (this.appState.stack.length === 0) {
        if (!stackWrapper.querySelector('.stack-empty-message')) {
          const emptyMessage = document.createElement('div');
          emptyMessage.classList.add('stack-empty-message');
          emptyMessage.textContent = 'No stack frames';
          emptyMessage.style.padding = '20px';
          emptyMessage.style.textAlign = 'center';
          emptyMessage.style.color = '#888';
          emptyMessage.style.fontStyle = 'italic';
          emptyMessage.style.opacity = '0';
          emptyMessage.style.transform = 'translateY(10px)';
          emptyMessage.style.transition = 'opacity 300ms ease, transform 300ms ease';

          stackWrapper.appendChild(emptyMessage);

          // Animate message entrance
          setTimeout(() => {
            emptyMessage.style.opacity = '1';
            emptyMessage.style.transform = 'translateY(0)';
          }, 10);
        }
      } else {
        // Remove empty message if it exists
        const emptyMessage = stackWrapper.querySelector('.stack-empty-message');
        if (emptyMessage) {
          emptyMessage.remove();
        }
      }
    }
  }

  /**
   * Update heap visualization with enhanced animations
   * @param {ExecutionStep} step - Current execution step
   */
  updateHeapVisualization(step) {
    // Verify if heap container exists
    if (!this.UIElements.heapContainer || !this.UIElements.heapEmptyMessage) return;

    // Check if we need to reset the container
    const shouldReset = this.shouldResetVisualization('heap', step);

    if (shouldReset) {
      // Clear container
      this.UIElements.heapContainer.innerHTML = '';

      // Add title
      const title = document.createElement('div');
      title.classList.add('section-header');
      title.textContent = 'HEAP MEMORY (DYNAMIC ALLOCATION)';
      this.UIElements.heapContainer.appendChild(title);

      // Create container for heap blocks with wrapper for animations
      const heapBlocksContainer = document.createElement('div');
      heapBlocksContainer.classList.add('heap-blocks-container');

      // Add wrapper for animations
      const heapWrapper = document.createElement('div');
      heapWrapper.classList.add('heap-animation-wrapper');
      heapWrapper.style.padding = '10px';
      heapWrapper.style.opacity = '0';
      heapWrapper.style.transform = 'translateY(10px)';
      heapWrapper.style.transition = 'opacity 300ms ease, transform 300ms ease';

      heapBlocksContainer.appendChild(heapWrapper);
      this.UIElements.heapContainer.appendChild(heapBlocksContainer);

      // Clear tracked heap blocks
      this.visualizedElements.heap.clear();

      // Animate entrance
      setTimeout(() => {
        heapWrapper.style.opacity = '1';
        heapWrapper.style.transform = 'translateY(0)';
      }, 10);
    }

    // Get the wrapper for heap blocks
    const heapWrapper = document.querySelector('.heap-animation-wrapper');
    if (!heapWrapper) return;

    const heapBlocks = Object.values(this.appState.heap);

    if (heapBlocks.length > 0) {
      // Hide empty message
      this.UIElements.heapEmptyMessage.style.display = 'none';

      // Process each heap block
      heapBlocks.forEach((block, blockIndex) => {
        const blockId = `heap-block-${block.address}`;

        // Check if block already exists
        let blockElement = heapWrapper.querySelector(`.heap-block[data-block-id="${blockId}"]`);
        const isNewBlock = !blockElement;
        const isChangedBlock = step.changes && step.changes.heap && step.changes.heap[block.address];

        // If block should be updated or is new
        if (isNewBlock || isChangedBlock) {
          // If block exists and changed, apply change animation
          if (blockElement && isChangedBlock) {
            // Apply change animation
            blockElement.classList.add('changed');

            // Update freed status if needed
            if (block.freed) {
              blockElement.classList.add('freed');

              // Add special animation for freed blocks
              blockElement.style.animation = 'fade-freed 1.5s ease forwards';
            } else {
              blockElement.classList.remove('freed');
              blockElement.style.animation = '';
            }

            // Reset change animation after completion
            setTimeout(() => {
              blockElement.classList.remove('changed');
            }, 1500);
          }

          // If it's a new block, create it with entrance animation
          if (isNewBlock) {
            blockElement = document.createElement('div');
            blockElement.classList.add('heap-block');
            blockElement.setAttribute('data-block-id', blockId);

            if (block.freed) {
              blockElement.classList.add('freed');
            }

            // Prepare for entrance animation
            blockElement.style.opacity = '0';
            blockElement.style.transform = 'translateY(20px) scale(0.95)';
            blockElement.style.transition = 'opacity 350ms ease, transform 350ms ease';
            blockElement.style.transitionDelay = `${blockIndex * 50}ms`;

            // Track block
            this.visualizedElements.heap.add(blockId);
          }

          // Clear existing content for update
          blockElement.innerHTML = '';

          // Block header
          const headerElement = document.createElement('div');
          headerElement.classList.add('heap-header');

          // Status indicator with enhanced styling
          const statusIndicator = document.createElement('span');
          statusIndicator.classList.add('heap-status-indicator');
          statusIndicator.style.display = 'inline-block';
          statusIndicator.style.width = '12px';
          statusIndicator.style.height = '12px';
          statusIndicator.style.borderRadius = '50%';
          statusIndicator.style.marginRight = '8px';
          statusIndicator.style.transition = 'background-color 0.3s ease';

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

          // Block status badge
          const statusElement = document.createElement('div');
          statusElement.classList.add('heap-status-badge');
          statusElement.style.float = 'right';
          statusElement.style.fontSize = '12px';
          statusElement.style.padding = '3px 8px';
          statusElement.style.borderRadius = '12px';
          statusElement.style.fontWeight = 'bold';
          statusElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';

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

          // Block content with enhanced styling
          const contentElement = document.createElement('div');
          contentElement.classList.add('heap-content');

          if (block.freed) {
            contentElement.innerHTML = '<span class="freed-message"><span class="warning-icon">⚠️</span> Memory freed - content indeterminate</span>';
            contentElement.style.fontStyle = 'italic';
            contentElement.style.color = '#999';
          } else if (typeof block.content === 'object' && block.content !== null) {
            // Arrays or structures with enhanced display
            if (Array.isArray(block.content)) {
              // Create a visually appealing array display
              const arrayContainer = document.createElement('div');
              arrayContainer.classList.add('heap-array-container');
              arrayContainer.style.display = 'flex';
              arrayContainer.style.flexWrap = 'wrap';
              arrayContainer.style.gap = '5px';

              Object.entries(block.content).forEach(([index, value]) => {
                const arrayItem = document.createElement('div');
                arrayItem.classList.add('heap-array-item');
                arrayItem.style.padding = '4px 8px';
                arrayItem.style.backgroundColor = '#f5f5f5';
                arrayItem.style.borderRadius = '4px';
                arrayItem.style.border = '1px solid #ddd';
                arrayItem.style.display = 'flex';
                arrayItem.style.flexDirection = 'column';
                arrayItem.style.alignItems = 'center';

                const indexSpan = document.createElement('span');
                indexSpan.classList.add('array-index');
                indexSpan.textContent = index;
                indexSpan.style.fontSize = '11px';
                indexSpan.style.color = '#666';

                const valueSpan = document.createElement('span');
                valueSpan.classList.add('array-value');
                valueSpan.textContent = value;
                valueSpan.style.fontWeight = 'bold';

                arrayItem.appendChild(indexSpan);
                arrayItem.appendChild(valueSpan);
                arrayContainer.appendChild(arrayItem);
              });

              contentElement.appendChild(arrayContainer);
            } else {
              // Enhanced object display with styled table
              const table = document.createElement('table');
              table.classList.add('heap-object-table');
              table.style.width = '100%';
              table.style.borderCollapse = 'collapse';
              table.style.borderRadius = '4px';
              table.style.overflow = 'hidden';
              table.style.border = '1px solid #e0e0e0';

              // Table header
              const thead = document.createElement('thead');
              const headerRow = document.createElement('tr');

              const keyHeader = document.createElement('th');
              keyHeader.textContent = 'Property';
              keyHeader.style.padding = '8px 12px';
              keyHeader.style.backgroundColor = '#f5f5f5';
              keyHeader.style.textAlign = 'left';
              keyHeader.style.borderBottom = '2px solid #ddd';
              headerRow.appendChild(keyHeader);

              const valueHeader = document.createElement('th');
              valueHeader.textContent = 'Value';
              valueHeader.style.padding = '8px 12px';
              valueHeader.style.backgroundColor = '#f5f5f5';
              valueHeader.style.textAlign = 'left';
              valueHeader.style.borderBottom = '2px solid #ddd';
              headerRow.appendChild(valueHeader);

              thead.appendChild(headerRow);
              table.appendChild(thead);

              // Table body
              const tbody = document.createElement('tbody');

              Object.entries(block.content).forEach(([key, value], index) => {
                const row = document.createElement('tr');

                // Alternate row colors
                if (index % 2 === 0) {
                  row.style.backgroundColor = '#f9f9f9';
                }

                const keyCell = document.createElement('td');
                keyCell.textContent = key;
                keyCell.style.padding = '6px 12px';
                keyCell.style.borderBottom = '1px solid #eee';

                const valueCell = document.createElement('td');
                valueCell.textContent = value;
                valueCell.style.padding = '6px 12px';
                valueCell.style.borderBottom = '1px solid #eee';
                valueCell.style.fontWeight = 'bold';

                row.appendChild(keyCell);
                row.appendChild(valueCell);
                tbody.appendChild(row);
              });

              table.appendChild(tbody);
              contentElement.appendChild(table);
            }
          } else {
            // Simple value with better styling
            const valueElement = document.createElement('div');
            valueElement.classList.add('heap-simple-value');
            valueElement.textContent = block.content;
            valueElement.style.padding = '8px';
            valueElement.style.backgroundColor = '#f9f9f9';
            valueElement.style.borderRadius = '4px';
            valueElement.style.fontFamily = 'monospace';

            contentElement.appendChild(valueElement);
          }

          blockElement.appendChild(contentElement);

          // Add hover effects
          blockElement.addEventListener('mouseover', () => {
            if (!block.freed) {
              blockElement.style.transform = 'translateY(-3px)';
              blockElement.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            }
          });

          blockElement.addEventListener('mouseout', () => {
            if (!block.freed) {
              blockElement.style.transform = '';
              blockElement.style.boxShadow = '';
            }
          });

          // Add to container if new
          if (isNewBlock) {
            heapWrapper.appendChild(blockElement);

            // Trigger entrance animation
            setTimeout(() => {
              blockElement.style.opacity = '1';
              blockElement.style.transform = 'translateY(0) scale(1)';
            }, 10);
          }
        }
      });

      // Remove blocks that are no longer in the heap with exit animation
      const currentBlockIds = new Set(heapBlocks.map(block => `heap-block-${block.address}`));

      this.visualizedElements.heap.forEach(blockId => {
        if (!currentBlockIds.has(blockId)) {
          const blockElement = heapWrapper.querySelector(`.heap-block[data-block-id="${blockId}"]`);

          if (blockElement) {
            // Apply exit animation
            blockElement.style.opacity = '0';
            blockElement.style.transform = 'translateY(-20px) scale(0.95)';

            // Remove after animation completes
            setTimeout(() => {
              if (blockElement.parentNode) {
                blockElement.parentNode.removeChild(blockElement);
              }

              // Remove from tracked elements
              this.visualizedElements.heap.delete(blockId);
            }, 300);
          }
        }
      });
    } else {
      // Show empty message with animation
      if (this.UIElements.heapEmptyMessage.style.display === 'none') {
        this.UIElements.heapEmptyMessage.style.opacity = '0';
        this.UIElements.heapEmptyMessage.style.transform = 'translateY(10px)';
        this.UIElements.heapEmptyMessage.style.transition = 'opacity 300ms ease, transform 300ms ease';
        this.UIElements.heapEmptyMessage.style.display = 'block';

        // Animate message entrance
        setTimeout(() => {
          this.UIElements.heapEmptyMessage.style.opacity = '1';
          this.UIElements.heapEmptyMessage.style.transform = 'translateY(0)';
        }, 10);
      }
    }
  }

  /**
   * Update console output display with enhanced animations
   * @param {ExecutionStep} step - Current execution step
   */
  updateConsoleOutput(step) {
    if (!this.UIElements.outputConsole) return;

    if (step.changes && step.changes.saida) {
      // Clear container only if necessary
      if (!this.UIElements.outputConsole.querySelector('.section-header')) {
        this.UIElements.outputConsole.innerHTML = '';

        // Add title
        const title = document.createElement('div');
        title.classList.add('section-header');
        title.textContent = 'CONSOLE OUTPUT';
        this.UIElements.outputConsole.appendChild(title);
      }

      // Check if output container exists
      let outputElement = this.UIElements.outputConsole.querySelector('.console-output');

      if (!outputElement) {
        // Create output container with animation
        outputElement = document.createElement('div');
        outputElement.classList.add('console-output');
        outputElement.style.fontFamily = 'monospace';
        outputElement.style.whiteSpace = 'pre-wrap';
        outputElement.style.padding = '10px';
        outputElement.style.backgroundColor = '#f5f5f5';
        outputElement.style.borderRadius = '5px';
        outputElement.style.border = '1px solid #ddd';
        outputElement.style.maxHeight = '150px';
        outputElement.style.overflow = 'auto';
        outputElement.style.opacity = '0';
        outputElement.style.transform = 'translateY(10px)';
        outputElement.style.transition = 'opacity 300ms ease, transform 300ms ease';

        this.UIElements.outputConsole.appendChild(outputElement);

        // Animate entrance
        setTimeout(() => {
          outputElement.style.opacity = '1';
          outputElement.style.transform = 'translateY(0)';
        }, 10);
      }

      // Full output and new output
      const fullOutput = this.appState.consoleOutput;
      const newOutput = step.changes.saida;

      // Clear content for update
      outputElement.innerHTML = '';

      // Previous output
      if (fullOutput.length > newOutput.length) {
        const previousOutput = fullOutput.substring(0, fullOutput.length - newOutput.length);
        const previousSpan = document.createElement('span');
        previousSpan.textContent = previousOutput;
        previousSpan.classList.add('previous-output');
        outputElement.appendChild(previousSpan);
      }

      // New output with enhanced highlighting
      const newOutputSpan = document.createElement('span');
      newOutputSpan.textContent = newOutput;
      newOutputSpan.classList.add('new-output');
      newOutputSpan.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
      newOutputSpan.style.display = 'inline-block';
      newOutputSpan.style.width = '100%';
      newOutputSpan.style.padding = '2px 5px';
      newOutputSpan.style.borderRadius = '3px';
      newOutputSpan.style.position = 'relative';
      newOutputSpan.style.animation = 'highlight-fade 1.5s ease forwards';

      // Add an icon for new output
      const outputIcon = document.createElement('span');
      outputIcon.textContent = '🔄';
      outputIcon.classList.add('output-icon');
      outputIcon.style.position = 'absolute';
      outputIcon.style.right = '5px';
      outputIcon.style.top = '50%';
      outputIcon.style.transform = 'translateY(-50%)';
      outputIcon.style.fontSize = '12px';
      outputIcon.style.opacity = '0.7';

      newOutputSpan.appendChild(outputIcon);
      outputElement.appendChild(newOutputSpan);

      // Scroll to newest output with smooth animation
      setTimeout(() => {
        outputElement.scrollTo({
          top: outputElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }

  /**
   * Highlight source code line with improved visual effect
   * @param {number} lineNumber - Line number to highlight
   */
  highlightSourceCode(lineNumber) {
    if (!this.UIElements.codeInput) return;

    // Get code as text
    const codeText = this.UIElements.codeInput.value;
    const lines = codeText.split('\n');

    // Preserve current scroll position
    const scrollTop = this.UIElements.codeInput.scrollTop;

    // Create overlay for highlighting if it doesn't exist
    let highlightOverlay = document.getElementById('code-highlight-overlay');

    if (!highlightOverlay) {
      // Create overlay container that will position above the textarea
      const overlayContainer = document.createElement('div');
      overlayContainer.id = 'code-highlight-container';
      overlayContainer.style.position = 'absolute';
      overlayContainer.style.top = '0';
      overlayContainer.style.left = '0';
      overlayContainer.style.right = '0';
      overlayContainer.style.bottom = '0';
      overlayContainer.style.pointerEvents = 'none'; // Allow clicks to pass through
      overlayContainer.style.zIndex = '1';

      // Create the actual overlay for highlighted lines
      highlightOverlay = document.createElement('div');
      highlightOverlay.id = 'code-highlight-overlay';
      highlightOverlay.style.position = 'absolute';
      highlightOverlay.style.top = '0';
      highlightOverlay.style.left = '0';
      highlightOverlay.style.right = '0';
      highlightOverlay.style.height = '0';
      highlightOverlay.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
      highlightOverlay.style.transition = 'top 0.3s ease, height 0.3s ease';
      highlightOverlay.style.borderRadius = '3px';
      highlightOverlay.style.pointerEvents = 'none';

      overlayContainer.appendChild(highlightOverlay);

      // Position the container properly
      this.UIElements.codeInput.parentNode.style.position = 'relative';
      this.UIElements.codeInput.parentNode.insertBefore(overlayContainer, this.UIElements.codeInput);
    }

    // Calculate line height based on code area
    const lineHeight = this.UIElements.codeInput.scrollHeight / lines.length;

    // Set overlay position to highlight the current line
    if (lineNumber > 0 && lineNumber <= lines.length) {
      const topPosition = (lineNumber - 1) * lineHeight;

      highlightOverlay.style.top = `${topPosition}px`;
      highlightOverlay.style.height = `${lineHeight}px`;
      highlightOverlay.style.opacity = '1';

      // Add glow effect
      highlightOverlay.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';

      // Auto-scroll to keep the highlighted line visible with a smooth animation
      const textAreaHeight = this.UIElements.codeInput.clientHeight;

      if (topPosition < scrollTop || topPosition > scrollTop + textAreaHeight - lineHeight) {
        this.UIElements.codeInput.scrollTo({
          top: topPosition - textAreaHeight / 2 + lineHeight / 2,
          behavior: 'smooth'
        });
      }
    } else {
      // Hide highlight if line is invalid
      highlightOverlay.style.opacity = '0';
      highlightOverlay.style.boxShadow = 'none';
    }
  }

  /**
   * Highlight tokens for current step with improved visual effects
   * @param {ExecutionStep} step - Current execution step
   */
  highlightTokens(step) {
    if (!this.UIElements.tokenContainer) return;

    // Find tokens related to current line
    const lineTokens = this.appState.tokens.filter(token => token.line === step.line);

    // Clear previous highlights with smooth transition
    const allTokenElements = this.UIElements.tokenContainer.querySelectorAll('.token-item');
    allTokenElements.forEach(element => {
      if (element.classList.contains('current-token')) {
        // Smooth transition out
        element.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease';
        element.style.borderColor = '#ccc';
        element.style.boxShadow = 'none';
        element.style.transform = 'scale(1)';

        // Remove class after transition
        setTimeout(() => {
          element.classList.remove('current-token');
        }, 300);
      }
    });

    // Highlight tokens for current line
    if (lineTokens.length > 0) {
      // Reset token container if it's empty or doesn't have line labels
      if (!this.UIElements.tokenContainer.querySelector('.line-tokens')) {
        this.renderTokenContainer();
      }

      // Get all token elements from current line
      const currentLineSelector = `.linha-tokens[data-line="${step.line}"] .token-item`;
      const currentLineTokens = this.UIElements.tokenContainer.querySelectorAll(currentLineSelector);

      // Apply highlight with staggered animation
      currentLineTokens.forEach((tokenElement, index) => {
        // Prepare for animation
        tokenElement.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease';
        tokenElement.style.transitionDelay = `${index * 50}ms`;

        // Add highlight class
        tokenElement.classList.add('current-token');

        // Enhanced visual effect
        tokenElement.style.borderColor = '#ff5722';
        tokenElement.style.boxShadow = '0 0 8px rgba(255, 87, 34, 0.5)';
        tokenElement.style.transform = 'scale(1.05)';

        // Scroll first token into view with smooth animation
        if (index === 0) {
          tokenElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  /**
   * Render the token container with line grouping
   */
  renderTokenContainer() {
    if (!this.UIElements.tokenContainer) return;

    // Clear container
    this.UIElements.tokenContainer.innerHTML = '';

    // Group tokens by line for better visualization
    const tokensByLine = {};

    this.appState.tokens.forEach(token => {
      if (!tokensByLine[token.line]) {
        tokensByLine[token.line] = [];
      }
      tokensByLine[token.line].push(token);
    });

    // For each line
    Object.keys(tokensByLine).sort((a, b) => parseInt(a) - parseInt(b)).forEach(lineNumber => {
      const lineDiv = document.createElement('div');
      lineDiv.classList.add('linha-tokens');
      lineDiv.setAttribute('data-line', lineNumber);

      // Add line number with enhanced styling
      const lineNumberEl = document.createElement('span');
      lineNumberEl.classList.add('numero-linha');
      lineNumberEl.textContent = `${lineNumber}: `;
      lineNumberEl.style.color = '#888';
      lineNumberEl.style.marginRight = '8px';
      lineNumberEl.style.display = 'inline-block';
      lineNumberEl.style.minWidth = '35px';
      lineNumberEl.style.textAlign = 'right';
      lineNumberEl.style.borderRight = '1px solid #ddd';
      lineNumberEl.style.paddingRight = '5px';
      lineDiv.appendChild(lineNumberEl);

      // Add tokens for the line with enhanced styling
      tokensByLine[lineNumber].forEach(token => {
        const tokenElement = document.createElement('span');
        tokenElement.classList.add('token-item', `token-${token.tipo || token.type}`);
        tokenElement.textContent = token.valor || token.value;
        tokenElement.title = `Type: ${token.tipo || token.type}, Line: ${token.line}, Column: ${token.column}`;
        tokenElement.style.margin = '2px';
        tokenElement.style.padding = '3px 6px';
        tokenElement.style.borderRadius = '3px';
        tokenElement.style.border = '1px solid transparent';
        tokenElement.style.display = 'inline-block';
        tokenElement.style.transition = 'all 0.2s ease';

        // Type-specific styling
        switch (token.tipo || token.type) {
          case 'keyword':
            tokenElement.style.backgroundColor = '#c792ea';
            tokenElement.style.color = 'white';
            tokenElement.style.fontWeight = 'bold';
            break;
          case 'function':
            tokenElement.style.backgroundColor = '#82AAFF';
            tokenElement.style.color = 'white';
            tokenElement.style.fontStyle = 'italic';
            break;
          case 'identifier':
            tokenElement.style.backgroundColor = '#7fdbca';
            break;
          case 'operator':
            tokenElement.style.backgroundColor = '#89ddff';
            tokenElement.style.fontWeight = 'bold';
            break;
          case 'literal':
            tokenElement.style.backgroundColor = '#f78c6c';
            break;
          case 'punctuation':
            tokenElement.style.backgroundColor = '#cccccc';
            break;
          case 'preprocessor':
            tokenElement.style.backgroundColor = '#c586c0';
            tokenElement.style.color = 'white';
            tokenElement.style.fontWeight = 'bold';
            break;
        }

        // Add hover effect
        tokenElement.addEventListener('mouseover', () => {
          tokenElement.style.transform = 'translateY(-2px) scale(1.05)';
          tokenElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        });

        tokenElement.addEventListener('mouseout', () => {
          tokenElement.style.transform = '';
          tokenElement.style.boxShadow = '';
        });

        lineDiv.appendChild(tokenElement);
      });

      this.UIElements.tokenContainer.appendChild(lineDiv);
    });

    // Add token statistics if there are tokens
    if (this.appState.tokens.length > 0) {
      const statsContainer = document.createElement('div');
      statsContainer.classList.add('token-stats');
      statsContainer.style.marginTop = '15px';
      statsContainer.style.padding = '10px';
      statsContainer.style.borderTop = '1px solid #ddd';
      statsContainer.style.fontSize = '12px';
      statsContainer.style.opacity = '0';
      statsContainer.style.transform = 'translateY(10px)';
      statsContainer.style.transition = 'opacity 300ms ease, transform 300ms ease';

      // Count token types
      const typeCount = {};
      this.appState.tokens.forEach(token => {
        const type = token.tipo || token.type;
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      statsContainer.innerHTML = '<strong>Token Statistics:</strong><br>';

      // Create a visually appealing chart for token distribution
      const chartContainer = document.createElement('div');
      chartContainer.style.marginTop = '10px';
      chartContainer.style.display = 'flex';
      chartContainer.style.height = '40px';
      chartContainer.style.borderRadius = '4px';
      chartContainer.style.overflow = 'hidden';

      // Total count for percentage calculation
      const totalTokens = this.appState.tokens.length;

      // Color map for types
      const typeColors = {
        'keyword': '#c792ea',
        'identifier': '#7fdbca',
        'operator': '#89ddff',
        'literal': '#f78c6c',
        'punctuation': '#cccccc',
        'function': '#82AAFF',
        'preprocessor': '#c586c0'
      };

      // Add segments to chart
      Object.entries(typeCount).forEach(([type, count]) => {
        const percentage = (count / totalTokens) * 100;
        const segment = document.createElement('div');
        segment.style.width = `${percentage}%`;
        segment.style.height = '100%';
        segment.style.backgroundColor = typeColors[type] || '#ccc';
        segment.title = `${type}: ${count} (${percentage.toFixed(1)}%)`;
        chartContainer.appendChild(segment);
      });

      statsContainer.appendChild(chartContainer);

      // Legend for the chart
      const legend = document.createElement('div');
      legend.style.display = 'flex';
      legend.style.flexWrap = 'wrap';
      legend.style.gap = '8px';
      legend.style.marginTop = '10px';

      Object.entries(typeCount).forEach(([type, count]) => {
        const legendItem = document.createElement('div');
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';

        const colorBox = document.createElement('div');
        colorBox.style.width = '12px';
        colorBox.style.height = '12px';
        colorBox.style.backgroundColor = typeColors[type] || '#ccc';
        colorBox.style.marginRight = '5px';

        const label = document.createElement('span');
        label.textContent = `${type}: ${count}`;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legend.appendChild(legendItem);
      });

      statsContainer.appendChild(legend);

      // Total token count
      const totalElement = document.createElement('div');
      totalElement.style.marginTop = '8px';
      totalElement.style.fontWeight = 'bold';
      totalElement.textContent = `Total: ${totalTokens} tokens`;
      statsContainer.appendChild(totalElement);

      this.UIElements.tokenContainer.appendChild(statsContainer);

      // Animate stats entrance
      setTimeout(() => {
        statsContainer.style.opacity = '1';
        statsContainer.style.transform = 'translateY(0)';
      }, 300);
    }
  }

  /**
   * Highlight AST node for current step with enhanced animations
   * @param {ExecutionStep} step - Current execution step
   */
  highlightASTNode(step) {
    if (!this.UIElements.astContainer) return;

    // Check if AST container needs to be initialized
    if (!this.UIElements.astContainer.querySelector('.ast-tree-container')) {
      this.renderASTVisualization();
    }

    // Clear previous node highlights with smooth transitions
    const allNodeElements = this.UIElements.astContainer.querySelectorAll('.ast-node-interactive');
    allNodeElements.forEach(node => {
      if (node.classList.contains('active')) {
        // Smooth transition out
        node.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease';
        node.style.borderColor = '#ccc';
        node.style.boxShadow = 'none';
        node.style.transform = '';

        // Remove class after transition
        setTimeout(() => {
          node.classList.remove('active');
        }, 300);
      }
    });

    // Attempt to find AST node related to the current step
    // This is an approximate matching since there's no direct line to node mapping
    const matchingNodes = this.findASTNodesForStep(step);

    if (matchingNodes.length > 0) {
      // Highlight each matching node with staggered animation
      matchingNodes.forEach((nodeElement, index) => {
        // Prepare for animation
        nodeElement.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease';
        nodeElement.style.transitionDelay = `${index * 100}ms`;

        // Add highlight class
        nodeElement.classList.add('active');

        // Enhanced visual effect
        nodeElement.style.borderColor = '#ff5722';
        nodeElement.style.boxShadow = '0 0 8px rgba(255, 87, 34, 0.5)';
        nodeElement.style.transform = 'translateY(-3px)';

        // Expand parents to show the highlighted node
        this.expandParents(nodeElement);

        // Scroll first node into view with smooth animation
        if (index === 0) {
          nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  /**
   * Find AST nodes that might be related to the current execution step
   * @param {ExecutionStep} step - Current execution step
   * @returns {Array} Array of matching node elements
   */
  findASTNodesForStep(step) {
    const matchingNodes = [];

    // Try to match based on step type
    let nodeType = '';

    switch (step.type) {
      case 'declaration':
        nodeType = 'variable_declaration';
        break;
      case 'assignment':
        nodeType = 'assignment_expression';
        break;
      case 'call':
        nodeType = 'call_expression';
        break;
      case 'return':
        nodeType = 'return_statement';
        break;
      case 'conditional':
        nodeType = 'if_statement';
        break;
      case 'execution':
        // Look for loops or blocks
        nodeType = 'for_statement,while_statement,compound_statement';
        break;
    }

    if (nodeType) {
      // Support multiple comma-separated types
      const types = nodeType.split(',');

      // Find all matching node elements
      types.forEach(type => {
        const selector = `.ast-node-interactive[data-type="${type}"]`;
        const nodes = this.UIElements.astContainer.querySelectorAll(selector);
        nodes.forEach(node => matchingNodes.push(node));
      });
    }

    return matchingNodes;
  }

  /**
   * Expand all parent containers of a node
   * @param {HTMLElement} nodeElement - AST node element to show
   */
  expandParents(nodeElement) {
    let parent = nodeElement.parentElement;

    while (parent) {
      if (parent.classList.contains('ast-children-container')) {
        // Expand this container
        parent.style.maxHeight = '1000px';

        // Update the expand icon
        const parentNode = parent.parentNode;
        const expandIcon = parentNode.querySelector('.ast-expandir-icon');
        if (expandIcon) {
          expandIcon.innerHTML = '▼';
        }

        // Mark as expanded
        parentNode.classList.add('expanded');
      }

      parent = parent.parentElement;
    }
  }

  /**
   * Render AST visualization with enhanced styles and interactions
   */
  renderASTVisualization() {
    if (!this.UIElements.astContainer) return;

    // Clear container
    this.UIElements.astContainer.innerHTML = '';

    if (!this.appState.ast) {
      this.UIElements.astContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">No AST generated</div>';
      return;
    }

    // Controls for AST visualization
    const controls = document.createElement('div');
    controls.classList.add('ast-controls');
    controls.style.marginBottom = '15px';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'space-between';
    controls.style.alignItems = 'center';

    // Buttons for expanding/collapsing all nodes
    const expandAllBtn = document.createElement('button');
    expandAllBtn.classList.add('nav-button');
    expandAllBtn.textContent = 'Expand All';
    expandAllBtn.onclick = () => this.expandAllASTNodes(true);
    expandAllBtn.style.transition = 'background-color 0.3s ease';

    const collapseAllBtn = document.createElement('button');
    collapseAllBtn.classList.add('nav-button');
    collapseAllBtn.textContent = 'Collapse All';
    collapseAllBtn.onclick = () => this.expandAllASTNodes(false);
    collapseAllBtn.style.transition = 'background-color 0.3s ease';

    // Add hover effects to buttons
    [expandAllBtn, collapseAllBtn].forEach(btn => {
      btn.addEventListener('mouseover', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      });

      btn.addEventListener('mouseout', () => {
        btn.style.transform = '';
        btn.style.boxShadow = '';
      });
    });

    // Detail level selector
    const detailsDiv = document.createElement('div');
    detailsDiv.style.display = 'flex';
    detailsDiv.style.alignItems = 'center';

    const detailsLabel = document.createElement('label');
    detailsLabel.htmlFor = 'ast-detail-level';
    detailsLabel.textContent = 'Detail Level: ';
    detailsLabel.style.marginRight = '8px';

    const detailsSelect = document.createElement('select');
    detailsSelect.id = 'ast-detail-level';
    detailsSelect.classList.add('example-selector');

    const detailLevels = [
      {value: 'low', text: 'Basic - Structure Only'},
      {value: 'medium', text: 'Medium - With Values'},
      {value: 'high', text: 'High - Complete Details'}
    ];

    detailLevels.forEach(level => {
      const option = document.createElement('option');
      option.value = level.value;
      option.text = level.text;
      if (level.value === 'medium') option.selected = true;
      detailsSelect.appendChild(option);
    });

    detailsSelect.onchange = () => this.updateASTDetailLevel();

    detailsDiv.appendChild(detailsLabel);
    detailsDiv.appendChild(detailsSelect);

    // Buttons container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '8px';
    buttonsDiv.appendChild(expandAllBtn);
    buttonsDiv.appendChild(collapseAllBtn);

    controls.appendChild(detailsDiv);
    controls.appendChild(buttonsDiv);

    this.UIElements.astContainer.appendChild(controls);

    // Container for AST tree
    const treeContainer = document.createElement('div');
    treeContainer.id = 'ast-tree-container';
    treeContainer.classList.add('ast-tree');
    treeContainer.style.height = '400px';
    treeContainer.style.overflow = 'auto';
    treeContainer.style.border = '1px solid #ddd';
    treeContainer.style.borderRadius = '5px';
    treeContainer.style.padding = '15px';
    treeContainer.style.backgroundColor = '#fcfcfc';
    treeContainer.style.boxShadow = 'inset 0 0 5px rgba(0,0,0,0.1)';

    this.UIElements.astContainer.appendChild(treeContainer);

    // Render the AST
    this.renderASTNodes(treeContainer);

    // Add legend
    this.addASTLegend();
  }

  /**
   * Render AST nodes recursively with enhanced styling
   * @param {HTMLElement} container - Container element for AST
   */
  renderASTNodes(container) {
    // Create root node
    const rootElement = this.createASTNodeElement(this.appState.ast, 0);
    container.appendChild(rootElement);

    // Initialize with nodes expanded
    setTimeout(() => {
      this.expandAllASTNodes(true);
    }, 100);
  }

  /**
   * Create an AST node element with enhanced styling and interactions
   * @param {Object} node - AST node
   * @param {number} level - Nesting level
   * @returns {HTMLElement} Node element
   */
  createASTNodeElement(node, level) {
    if (!node) return document.createElement('div');

    const nodeElement = document.createElement('div');
    nodeElement.classList.add('ast-node-interactive');
    nodeElement.setAttribute('data-type', node.type);
    nodeElement.setAttribute('data-level', level);

    // Apply styling based on node type
    const nodeTypes = {
      'program': { class: 'ast-program', color: '#0D47A1', bgColor: '#e3f2fd' },
      'function_definition': { class: 'ast-function', color: '#1B5E20', bgColor: '#e8f5e9' },
      'variable_declaration': { class: 'ast-declaration', color: '#E65100', bgColor: '#fff3e0' },
      'assignment_expression': { class: 'ast-assignment', color: '#4A148C', bgColor: '#f3e5f5' },
      'call_expression': { class: 'ast-call', color: '#880E4F', bgColor: '#fce4ec' },
      'return_statement': { class: 'ast-return', color: '#B71C1C', bgColor: '#ffebee' },
      'if_statement': { class: 'ast-if', color: '#01579B', bgColor: '#e1f5fe' },
      'for_statement': { class: 'ast-for', color: '#004D40', bgColor: '#e0f2f1' },
      'while_statement': { class: 'ast-while', color: '#33691E', bgColor: '#f1f8e9' },
      'compound_statement': { class: 'ast-compound', color: '#546E7A', bgColor: '#eceff1' }
    };

    const nodeStyle = nodeTypes[node.type] || { class: 'ast-default', color: '#616161', bgColor: '#f5f5f5' };

    // Apply the class and inline styles
    nodeElement.classList.add(nodeStyle.class);
    nodeElement.style.backgroundColor = nodeStyle.bgColor;
    nodeElement.style.color = nodeStyle.color;
    nodeElement.style.borderLeft = `4px solid ${nodeStyle.color}`;
    nodeElement.style.padding = '8px 12px';
    nodeElement.style.margin = '4px 0';
    nodeElement.style.borderRadius = '4px';
    nodeElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    nodeElement.style.transition = 'all 0.2s ease';
    nodeElement.style.marginLeft = `${level * 20}px`;
    nodeElement.style.opacity = '0.9';
    nodeElement.style.position = 'relative';

    // Add hover effects
    nodeElement.addEventListener('mouseover', () => {
      nodeElement.style.opacity = '1';
      nodeElement.style.transform = 'translateX(3px)';
      nodeElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    });

    nodeElement.addEventListener('mouseout', () => {
      nodeElement.style.opacity = '0.9';
      nodeElement.style.transform = '';
      nodeElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    });

    // Node header with expand/collapse functionality
    const header = document.createElement('div');
    header.classList.add('ast-node-header');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.cursor = 'pointer';

    // Expand/collapse icon
    const expandIcon = document.createElement('span');
    expandIcon.classList.add('ast-expandir-icon');
    expandIcon.innerHTML = node.children && node.children.length ? '▶' : '●';
    expandIcon.style.marginRight = '5px';
    expandIcon.style.fontSize = '10px';
    expandIcon.style.transition = 'transform 0.3s ease';

    // Node type and info
    const nodeInfo = document.createElement('span');
    nodeInfo.classList.add('ast-node-info');

    // Get detail level setting
    const detailLevel = document.getElementById('ast-detail-level')?.value || 'medium';

    // Format node text based on detail level
    let nodeText = '';

    if (detailLevel === 'low') {
      // Basic structure only
      nodeText = this.formatNodeType(node.type);
    } else if (detailLevel === 'medium') {
      // Include basic value
      nodeText = this.formatNodeType(node.type);
      if (node.value) nodeText += `: ${node.value}`;
    } else {
      // Complete details
      nodeText = this.formatNodeType(node.type);

      if (node.value) nodeText += `: ${node.value}`;
      if (node.returnType) nodeText += ` (returns ${node.returnType})`;
      if (node.type === 'variable_declaration' && node.tipo) nodeText += ` (type: ${node.tipo})`;
      if (node.isPointer) nodeText += ' (pointer)';

      // Add parameter info
      if (node.parameters && node.parameters.length) {
        nodeText += ` (params: ${node.parameters.map(p => `${p.type} ${p.name}`).join(', ')})`;
      }
    }

    nodeInfo.textContent = nodeText;

    // Children count badge
    const childrenCount = document.createElement('span');
    childrenCount.classList.add('ast-children-count');

    if (node.children && node.children.length) {
      childrenCount.textContent = `${node.children.length} child${node.children.length > 1 ? 'ren' : ''}`;
      childrenCount.style.fontSize = '11px';
      childrenCount.style.backgroundColor = nodeStyle.color;
      childrenCount.style.color = 'white';
      childrenCount.style.padding = '2px 6px';
      childrenCount.style.borderRadius = '10px';
      childrenCount.style.marginLeft = '8px';
    }

    // Build header content
    const headerContent = document.createElement('div');
    headerContent.style.display = 'flex';
    headerContent.style.alignItems = 'center';
    headerContent.appendChild(expandIcon);
    headerContent.appendChild(nodeInfo);

    header.appendChild(headerContent);
    header.appendChild(childrenCount);
    nodeElement.appendChild(header);

    // Create container for children with animation support
    if (node.children && node.children.length) {
      const childrenContainer = document.createElement('div');
      childrenContainer.classList.add('ast-children-container');
      childrenContainer.style.overflow = 'hidden';
      childrenContainer.style.maxHeight = '0';
      childrenContainer.style.transition = 'max-height 0.3s ease-in-out';
      childrenContainer.style.paddingLeft = '15px';
      childrenContainer.style.borderLeft = '1px dashed #ccc';
      childrenContainer.style.marginLeft = '4px';

      // Add each child node
      node.children.forEach((child, index) => {
        // Add specific labels for control flow nodes
        if (['if_statement', 'for_statement', 'while_statement'].includes(node.type)) {
          let label = '';

          if (node.type === 'if_statement') {
            const labels = ['Condition', 'If Block', 'Else Block'];
            label = index < labels.length ? labels[index] : '';
          } else if (node.type === 'for_statement') {
            const labels = ['Initialization', 'Condition', 'Increment', 'Body'];
            label = index < labels.length ? labels[index] : '';
          } else if (node.type === 'while_statement') {
            const labels = ['Condition', 'Body'];
            label = index < labels.length ? labels[index] : '';
          }

          if (label) {
            const labelElement = document.createElement('div');
            labelElement.classList.add('ast-block-label');
            labelElement.textContent = `${label}:`;
            labelElement.style.fontSize = '11px';
            labelElement.style.fontStyle = 'italic';
            labelElement.style.color = '#666';
            labelElement.style.marginTop = '8px';
            labelElement.style.marginBottom = '2px';
            childrenContainer.appendChild(labelElement);
          }
        }

        // Create and add child node
        const childElement = this.createASTNodeElement(child, level + 1);
        childrenContainer.appendChild(childElement);
      });

      nodeElement.appendChild(childrenContainer);

      // Toggle children on header click
      header.onclick = function() {
        const childrenCont = this.parentNode.querySelector('.ast-children-container');
        const expandIcon = this.querySelector('.ast-expandir-icon');

        if (childrenCont.style.maxHeight === '0px' || !childrenCont.style.maxHeight) {
          // Expand
          childrenCont.style.maxHeight = '1000px';
          expandIcon.innerHTML = '▼';
          expandIcon.style.transform = 'rotate(0deg)';
          nodeElement.classList.add('expanded');
        } else {
          // Collapse
          childrenCont.style.maxHeight = '0px';
          expandIcon.innerHTML = '▶';
          expandIcon.style.transform = 'rotate(-90deg)';
          nodeElement.classList.remove('expanded');
        }
      };
    } else {
      // No children, so header is not clickable
      header.style.cursor = 'default';
    }

    return nodeElement;
  }

  /**
   * Format node type to be more readable
   * @param {string} type - Node type
   * @returns {string} Formatted type
   */
  formatNodeType(type) {
    return type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Expand or collapse all AST nodes
   * @param {boolean} expand - Whether to expand (true) or collapse (false)
   */
  expandAllASTNodes(expand) {
    const container = document.getElementById('ast-tree-container');
    if (!container) return;

    const childrenContainers = container.querySelectorAll('.ast-children-container');
    const expandIcons = container.querySelectorAll('.ast-expandir-icon');
    const nodeElements = container.querySelectorAll('.ast-node-interactive');

    // Apply expand/collapse with staggered animation
    childrenContainers.forEach((container, index) => {
      setTimeout(() => {
        container.style.maxHeight = expand ? '1000px' : '0px';
      }, index * 5); // Very slight stagger for smooth wave effect
    });

    expandIcons.forEach(icon => {
      if (icon.parentNode.parentNode.parentNode.querySelector('.ast-children-container')) {
        icon.innerHTML = expand ? '▼' : '▶';
        icon.style.transform = expand ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
    });

    nodeElements.forEach(node => {
      if (expand) {
        node.classList.add('expanded');
      } else {
        node.classList.remove('expanded');
      }
    });
  }

  /**
   * Update AST visualization detail level
   */
  updateASTDetailLevel() {
    // Re-render the AST with new detail level
    const container = document.getElementById('ast-tree-container');
    if (container) {
      // Store current scroll position
      const scrollPosition = container.scrollTop;

      // Re-render
      container.innerHTML = '';
      this.renderASTNodes(container);

      // Restore scroll position
      container.scrollTop = scrollPosition;
    }
  }

  /**
   * Add AST legend with improved styling
   */
  addASTLegend() {
    const legendContainer = document.createElement('div');
    legendContainer.classList.add('ast-legend');
    legendContainer.style.marginTop = '15px';
    legendContainer.style.padding = '10px 15px';
    legendContainer.style.border = '1px solid #ddd';
    legendContainer.style.borderRadius = '5px';
    legendContainer.style.backgroundColor = '#fafafa';

    const legendTitle = document.createElement('div');
    legendTitle.textContent = '🔍 AST Node Types';
    legendTitle.style.fontWeight = 'bold';
    legendTitle.style.marginBottom = '10px';
    legendTitle.style.borderBottom = '1px solid #eee';
    legendTitle.style.paddingBottom = '5px';
    legendContainer.appendChild(legendTitle);

    const legendTypes = [
      {type: 'program', name: 'Program', color: '#0D47A1', bgColor: '#e3f2fd'},
      {type: 'function', name: 'Function', color: '#1B5E20', bgColor: '#e8f5e9'},
      {type: 'declaration', name: 'Declaration', color: '#E65100', bgColor: '#fff3e0'},
      {type: 'assignment', name: 'Assignment', color: '#4A148C', bgColor: '#f3e5f5'},
      {type: 'call', name: 'Function Call', color: '#880E4F', bgColor: '#fce4ec'},
      {type: 'return', name: 'Return', color: '#B71C1C', bgColor: '#ffebee'},
      {type: 'if', name: 'If Statement', color: '#01579B', bgColor: '#e1f5fe'},
      {type: 'for', name: 'For Loop', color: '#004D40', bgColor: '#e0f2f1'},
      {type: 'while', name: 'While Loop', color: '#33691E', bgColor: '#f1f8e9'},
      {type: 'compound', name: 'Code Block', color: '#546E7A', bgColor: '#eceff1'}
    ];

    // Create legend grid
    const legendGrid = document.createElement('div');
    legendGrid.style.display = 'grid';
    legendGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
    legendGrid.style.gap = '8px';

    legendTypes.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.style.display = 'flex';
      itemElement.style.alignItems = 'center';
      itemElement.style.padding = '4px';
      itemElement.style.borderRadius = '4px';
      itemElement.style.transition = 'background-color 0.2s ease';

      const colorSwatch = document.createElement('div');
      colorSwatch.style.width = '12px';
      colorSwatch.style.height = '12px';
      colorSwatch.style.borderRadius = '3px';
      colorSwatch.style.backgroundColor = item.color;
      colorSwatch.style.marginRight = '8px';
      colorSwatch.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';

      const nameText = document.createElement('span');
      nameText.textContent = item.name;

      itemElement.appendChild(colorSwatch);
      itemElement.appendChild(nameText);

      // Add hover effect
      itemElement.addEventListener('mouseover', () => {
        itemElement.style.backgroundColor = item.bgColor;
      });

      itemElement.addEventListener('mouseout', () => {
        itemElement.style.backgroundColor = 'transparent';
      });

      legendGrid.appendChild(itemElement);
    });

    legendContainer.appendChild(legendGrid);
    this.UIElements.astContainer.appendChild(legendContainer);
  }

  /**
   * Update description of the current step with enhanced animations and styling
   * @param {ExecutionStep} step - Current execution step
   */
  updateStepDescription(step) {
    // Find or create description container
    let descriptionContainer = document.getElementById('step-description');
    const isNewContainer = !descriptionContainer;

    if (isNewContainer) {
      descriptionContainer = document.createElement('div');
      descriptionContainer.id = 'step-description';
      descriptionContainer.classList.add('step-description');
      descriptionContainer.style.marginBottom = '20px';
      descriptionContainer.style.padding = '15px';
      descriptionContainer.style.backgroundColor = '#f9f9f9';
      descriptionContainer.style.borderRadius = '8px';
      descriptionContainer.style.border = '1px solid #e0e0e0';
      descriptionContainer.style.boxShadow = '0 3px 8px rgba(0,0,0,0.08)';
      descriptionContainer.style.opacity = '0';
      descriptionContainer.style.transform = 'translateY(15px)';
      descriptionContainer.style.transition = 'opacity 300ms ease, transform 300ms ease';

      // Insert at the top of the page for better visibility
      if (this.UIElements.memoryContainer) {
        const targetElement = this.UIElements.memoryContainer.parentNode;
        targetElement.insertBefore(descriptionContainer, targetElement.firstChild);
      }

      // Animate container entrance
      setTimeout(() => {
        descriptionContainer.style.opacity = '1';
        descriptionContainer.style.transform = 'translateY(0)';
      }, 10);
    } else {
      // Apply transition out effect to content
      const oldContent = descriptionContainer.querySelector('.step-content-wrapper');
      if (oldContent) {
        oldContent.style.opacity = '0';
        oldContent.style.transform = 'translateX(-20px)';

        // Remove old content after transition
        setTimeout(() => {
          oldContent.remove();
        }, 200);
      }
    }

    // Create new content wrapper for transition
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('step-content-wrapper');
    contentWrapper.style.opacity = '0';
    contentWrapper.style.transform = 'translateX(20px)';
    contentWrapper.style.transition = 'opacity 300ms ease, transform 300ms ease';

    // Title with icon based on step type
    const titleSection = document.createElement('div');
    titleSection.classList.add('step-title-section');
    titleSection.style.display = 'flex';
    titleSection.style.alignItems = 'center';
    titleSection.style.marginBottom = '15px';
    titleSection.style.padding = '8px 12px';
    titleSection.style.borderRadius = '5px';

    // Choose appropriate icon and color based on step type
    let icon = '📝';
    let bgColor = '#e8f5e9';
    let textColor = '#2E7D32';

    switch (step.type) {
      case 'initialization':
        icon = '🚀';
        bgColor = '#e3f2fd';
        textColor = '#1565C0';
        break;
      case 'declaration':
        icon = '📦';
        bgColor = '#fff3e0';
        textColor = '#E65100';
        break;
      case 'assignment':
        icon = '✏️';
        bgColor = '#f3e5f5';
        textColor = '#6A1B9A';
        break;
      case 'call':
        icon = '📞';
        bgColor = '#e0f7fa';
        textColor = '#00838F';
        break;
      case 'return':
        icon = '↩️';
        bgColor = '#ffebee';
        textColor = '#C62828';
        break;
      case 'conditional':
        icon = '🔀';
        bgColor = '#e8eaf6';
        textColor = '#303F9F';
        break;
      case 'finalization':
        icon = '🏁';
        bgColor = '#eceff1';
        textColor = '#455A64';
        break;
    }

    titleSection.style.backgroundColor = bgColor;

    // Create element for icon
    const iconElement = document.createElement('span');
    iconElement.textContent = icon;
    iconElement.style.fontSize = '24px';
    iconElement.style.marginRight = '12px';

    // Title text with step info
    const titleText = document.createElement('div');
    titleText.innerHTML = `
      <div style="font-weight: bold; font-size: 18px; color: ${textColor};">
        ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} Step
      </div>
      <div style="font-size: 14px; margin-top: 3px; color: #555;">
        Step ${this.appState.currentStep + 1} of ${this.appState.executionSteps.length} • Line ${step.line}
      </div>
    `;

    titleSection.appendChild(iconElement);
    titleSection.appendChild(titleText);
    contentWrapper.appendChild(titleSection);

    // Step description
    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('step-description-text');
    descriptionElement.style.fontSize = '16px';
    descriptionElement.style.lineHeight = '1.5';
    descriptionElement.style.marginBottom = '15px';
    descriptionElement.style.padding = '0 5px';
    descriptionElement.textContent = step.description;
    contentWrapper.appendChild(descriptionElement);

    // Changes details, if any
    if (step.changes && Object.keys(step.changes).length > 0) {
      const changesSection = document.createElement('div');
      changesSection.classList.add('step-changes');
      changesSection.style.marginTop = '15px';

      // Changes section title
      const changesTitle = document.createElement('div');
      changesTitle.textContent = 'Changes in this step:';
      changesTitle.style.fontWeight = 'bold';
      changesTitle.style.fontSize = '15px';
      changesTitle.style.marginBottom = '10px';
      changesTitle.style.paddingBottom = '5px';
      changesTitle.style.borderBottom = '1px solid #e0e0e0';
      changesSection.appendChild(changesTitle);

      // Changes cards layout
      const changesLayout = document.createElement('div');
      changesLayout.style.display = 'grid';
      changesLayout.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
      changesLayout.style.gap = '10px';

      // Memory changes
      if (step.changes.memory) {
        const memoryCard = this.createChangeCard('Memory Changes', '#e3f2fd', '#1976D2', '💾');
        const addresses = Object.keys(step.changes.memory);

        if (addresses.length === 1) {
          const address = addresses[0];
          const item = step.changes.memory[address];
          memoryCard.content.innerHTML = `
            <div><strong>${item.name}</strong> (${item.type})</div>
            <div>Value: <span style="font-weight: bold;">${item.value}</span></div>
            <div>Address: <span style="font-family: monospace;">0x${parseInt(address).toString(16).padStart(8, '0')}</span></div>
          `;
        } else {
          const list = document.createElement('ul');
          list.style.margin = '5px 0';
          list.style.paddingLeft = '20px';

          addresses.forEach(address => {
            const item = step.changes.memory[address];
            const listItem = document.createElement('li');
            listItem.textContent = `${item.name}: ${item.value}`;
            list.appendChild(listItem);
          });

          memoryCard.content.textContent = `${addresses.length} variables changed:`;
          memoryCard.content.appendChild(list);
        }

        changesLayout.appendChild(memoryCard.card);
      }

      // Stack changes
      if (step.changes.stack) {
        const stackCard = this.createChangeCard('Stack Changes', '#e8f5e9', '#388E3C', '📚');
        const changedFunctions = Object.keys(step.changes.stack);

        changedFunctions.forEach(func => {
          const funcChanges = step.changes.stack[func];
          const funcInfo = document.createElement('div');
          funcInfo.style.marginBottom = '8px';

          if (funcChanges.add) {
            const addedVar = funcChanges.add;
            funcInfo.innerHTML = `
              <div><strong>Function:</strong> ${func}</div>
              <div><strong>Added:</strong> ${addedVar.name} = ${addedVar.value}</div>
              <div><strong>Type:</strong> ${addedVar.type}</div>
            `;
          } else if (funcChanges.update) {
            const updatedVar = funcChanges.update;
            funcInfo.innerHTML = `
              <div><strong>Function:</strong> ${func}</div>
              <div><strong>Updated:</strong> ${updatedVar.name} → ${updatedVar.value}</div>
            `;
          } else if (funcChanges.remove) {
            funcInfo.innerHTML = `
              <div><strong>Function:</strong> ${func}</div>
              <div><strong>Action:</strong> Frame removed (function return)</div>
            `;
          }

          stackCard.content.appendChild(funcInfo);
        });

        changesLayout.appendChild(stackCard.card);
      }

      // Heap changes
      if (step.changes.heap) {
        const heapCard = this.createChangeCard('Heap Changes', '#fff3e0', '#F57C00', '🧩');
        const blocks = Object.keys(step.changes.heap);

        if (blocks.length === 1) {
          const block = step.changes.heap[blocks[0]];
          if (block.freed) {
            heapCard.content.innerHTML = `
              <div><strong>Action:</strong> Free memory</div>
              <div><strong>Address:</strong> <span style="font-family: monospace;">0x${parseInt(blocks[0]).toString(16).padStart(8, '0')}</span></div>
              <div><strong>Status:</strong> <span style="color: #D32F2F;">FREED</span></div>
            `;
          } else {
            heapCard.content.innerHTML = `
              <div><strong>Action:</strong> Allocate memory</div>
              <div><strong>Address:</strong> <span style="font-family: monospace;">0x${parseInt(blocks[0]).toString(16).padStart(8, '0')}</span></div>
              <div><strong>Size:</strong> ${block.size} bytes</div>
              <div><strong>Status:</strong> <span style="color: #388E3C;">ALLOCATED</span></div>
            `;
          }
        } else {
          heapCard.content.textContent = `${blocks.length} heap blocks changed`;
        }

        changesLayout.appendChild(heapCard.card);
      }

      // Output changes
      if (step.changes.saida) {
        const outputCard = this.createChangeCard('Console Output', '#e0f7fa', '#0097A7', '📃');
        const outputContent = document.createElement('div');
        outputContent.style.fontFamily = 'monospace';
        outputContent.style.backgroundColor = '#f5f5f5';
        outputContent.style.padding = '8px';
        outputContent.style.borderRadius = '4px';
        outputContent.style.maxHeight = '80px';
        outputContent.style.overflow = 'auto';
        outputContent.style.marginTop = '5px';
        outputContent.textContent = step.changes.saida;

        outputCard.content.textContent = 'New output:';
        outputCard.content.appendChild(outputContent);

        changesLayout.appendChild(outputCard.card);
      }

      changesSection.appendChild(changesLayout);
      contentWrapper.appendChild(changesSection);
    }

    // Add educational tip if appropriate
    if (this.isEducationalStep(step)) {
      const tip = this.createEducationalTip(step);
      contentWrapper.appendChild(tip);
    }

    // Add content wrapper to container
    descriptionContainer.appendChild(contentWrapper);

    // Animate content entrance after a short delay
    setTimeout(() => {
      contentWrapper.style.opacity = '1';
      contentWrapper.style.transform = 'translateX(0)';
    }, isNewContainer ? 100 : 220);
  }

  /**
   * Create a change card for step description
   * @param {string} title - Card title
   * @param {string} bgColor - Background color
   * @param {string} accentColor - Accent color
   * @param {string} icon - Icon for card
   * @returns {Object} Object with card and content elements
   */
  createChangeCard(title, bgColor, accentColor, icon) {
    const card = document.createElement('div');
    card.classList.add('change-card');
    card.style.backgroundColor = bgColor;
    card.style.borderRadius = '6px';
    card.style.padding = '12px';
    card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.08)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.height = '100%';
    card.style.borderLeft = `4px solid ${accentColor}`;
    card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

    // Add hover effect
    card.addEventListener('mouseover', () => {
      card.style.transform = 'translateY(-3px)';
      card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
    });

    card.addEventListener('mouseout', () => {
      card.style.transform = '';
      card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.08)';
    });

    // Card header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    header.style.paddingBottom = '8px';
    header.style.borderBottom = '1px solid rgba(0,0,0,0.1)';

    const iconElement = document.createElement('span');
    iconElement.textContent = icon;
    iconElement.style.marginRight = '8px';
    iconElement.style.fontSize = '16px';

    const titleElement = document.createElement('span');
    titleElement.textContent = title;
    titleElement.style.fontWeight = 'bold';
    titleElement.style.color = accentColor;

    header.appendChild(iconElement);
    header.appendChild(titleElement);
    card.appendChild(header);

    // Card content
    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.fontSize = '14px';
    card.appendChild(content);

    return { card, content };
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
   * Create an educational tip with enhanced styling and animations
   * @param {ExecutionStep} step - Current execution step
   * @returns {HTMLElement} Tip element
   */
  createEducationalTip(step) {
    const tipContainer = document.createElement('div');
    tipContainer.classList.add('educational-tip');
    tipContainer.style.marginTop = '20px';
    tipContainer.style.padding = '15px';
    tipContainer.style.backgroundColor = '#f0f9ff';
    tipContainer.style.borderLeft = '4px solid #2196F3';
    tipContainer.style.borderRadius = '6px';
    tipContainer.style.position = 'relative';
    tipContainer.style.boxShadow = '0 2px 10px rgba(33, 150, 243, 0.1)';

    // Lightbulb icon with animation
    const iconContainer = document.createElement('div');
    iconContainer.style.position = 'absolute';
    iconContainer.style.top = '-12px';
    iconContainer.style.left = '15px';
    iconContainer.style.width = '28px';
    iconContainer.style.height = '28px';
    iconContainer.style.borderRadius = '50%';
    iconContainer.style.backgroundColor = '#2196F3';
    iconContainer.style.display = 'flex';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.color = 'white';
    iconContainer.style.animation = 'pulse-glow 2s infinite';

    // Add CSS animation definition
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes pulse-glow {
        0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
        100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
      }
    `;
    document.head.appendChild(styleElement);

    iconContainer.textContent = '💡';
    tipContainer.appendChild(iconContainer);

    // Tip title
    const titleDiv = document.createElement('div');
    titleDiv.textContent = 'Learning Tip';
    titleDiv.style.fontWeight = 'bold';
    titleDiv.style.fontSize = '16px';
    titleDiv.style.marginBottom = '10px';
    titleDiv.style.paddingLeft = '25px';
    titleDiv.style.color = '#1976D2';

    tipContainer.appendChild(titleDiv);

    // Tip content
    const textDiv = document.createElement('div');
    textDiv.style.fontSize = '14px';
    textDiv.style.lineHeight = '1.5';
    textDiv.style.color = '#333';

    // Select tip based on step type and content
    let tipText = '';

    if (step.type === 'declaration' && step.description.includes('pointer')) {
      tipText = `
        <p>Pointers are variables that store memory addresses. When we declare a pointer like <code>int *ptr</code>, we're creating a variable that can store the address of an int variable.</p>
        <p>In memory, a pointer typically occupies 4 bytes (in 32-bit systems) or 8 bytes (in 64-bit systems) regardless of what type it points to. The type declaration (like <code>int*</code>) only indicates what type of data it points to.</p>
      `;
    } else if (step.type === 'assignment' && step.description.includes('*ptr')) {
      tipText = `
        <p>The <code>*</code> (dereference) operator accesses the value stored at the address pointed to by the pointer. Modifying <code>*ptr</code> changes the value of the variable that ptr points to.</p>
        <p>This is also called "dereferencing" a pointer - you're following the pointer to access the actual value it points to in memory.</p>
      `;
    } else if (step.type === 'assignment' && step.description.includes('&')) {
      tipText = `
        <p>The <code>&amp;</code> (address-of) operator returns the memory address of a variable. This is how we make a pointer point to a specific variable.</p>
        <p>For example, <code>ptr = &amp;x;</code> makes ptr store the memory address where variable x is located, establishing a connection between them.</p>
      `;
    } else if (step.type === 'call' && step.description.includes('malloc')) {
      tipText = `
        <p>The <code>malloc()</code> function dynamically allocates memory on the heap. It returns a pointer to the beginning of the allocated memory block.</p>
        <p>Always check if allocation was successful (returned pointer is not NULL) and free this memory with <code>free()</code> when it's no longer needed to prevent memory leaks.</p>
        <p>The size argument to malloc is in bytes, which is why we use <code>sizeof()</code> to calculate the correct size for our data type.</p>
      `;
    } else if (step.type === 'call' && step.description.includes('free')) {
      tipText = `
        <p>The <code>free()</code> function releases a block of memory previously allocated with <code>malloc()</code>. After freeing memory, the pointer becomes a "dangling pointer".</p>
        <p>Using a pointer after calling <code>free()</code> can cause a "use-after-free" error, which is a common source of security vulnerabilities. It's best practice to set the pointer to NULL after freeing it.</p>
      `;
    } else if (step.type === 'initialization') {
      tipText = `
        <p>At the start of program execution, the system allocates memory for the program's code, stack, and global variables.</p>
        <p>The stack is where local variables are stored and function calls are tracked. Each function call creates a new "frame" on the stack with space for its local variables.</p>
        <p>The C runtime also sets up the environment for the program, including standard input/output streams.</p>
      `;
    } else if (step.type === 'return') {
      tipText = `
        <p>When a function returns, several things happen:</p>
        <ul>
          <li>The return value (if any) is calculated and passed back to the caller</li>
          <li>The function's stack frame is removed from the stack</li>
          <li>All local variables in the function go out of scope</li>
          <li>Execution continues at the point where the function was called</li>
        </ul>
        <p>Any memory allocated on the heap won't be automatically freed - that's why proper memory management is essential.</p>
      `;
    } else if (step.type === 'finalization') {
      tipText = `
        <p>When a program ends, the operating system reclaims all resources allocated to it:</p>
        <ul>
          <li>Stack and heap memory are released</li>
          <li>File handles are closed</li>
          <li>Other system resources are freed</li>
        </ul>
        <p>However, it's still good practice to explicitly free any dynamically allocated memory and close files in your code rather than relying on program termination.</p>
      `;
    } else {
      tipText = `
        <p>This step demonstrates a fundamental concept in C: direct memory manipulation. Observe how values change at specific memory addresses.</p>
        <p>C gives you precise control over memory, which provides both power and responsibility. This low-level memory access makes C efficient but requires careful programming to avoid memory leaks and errors.</p>
      `;
    }

    textDiv.innerHTML = tipText;
    tipContainer.appendChild(textDiv);

    return tipContainer;
  }

  /**
   * Show error message in output console with enhanced styling
   * @param {string} message - Error message
   */
  showError(message) {
    if (!this.UIElements.outputConsole) return;

    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error');
    errorDiv.style.backgroundColor = '#ffebee';
    errorDiv.style.color = '#b71c1c';
    errorDiv.style.padding = '12px 15px';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.borderLeft = '4px solid #d32f2f';
    errorDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    errorDiv.style.lineHeight = '1.5';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.opacity = '0';
    errorDiv.style.transform = 'translateY(10px)';
    errorDiv.style.transition = 'opacity 300ms ease, transform 300ms ease';

    // Error icon
    const iconContainer = document.createElement('div');
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.marginBottom = '8px';

    const errorIcon = document.createElement('span');
    errorIcon.textContent = '⚠️';
    errorIcon.style.fontSize = '20px';
    errorIcon.style.marginRight = '10px';

    const errorTitle = document.createElement('span');
    errorTitle.textContent = 'Error';
    errorTitle.style.fontWeight = 'bold';
    errorTitle.style.fontSize = '16px';

    iconContainer.appendChild(errorIcon);
    iconContainer.appendChild(errorTitle);
    errorDiv.appendChild(iconContainer);

    // Error message
    const messageText = document.createElement('div');
    messageText.textContent = message;
    messageText.style.marginBottom = '10px';
    errorDiv.appendChild(messageText);

    // Copy button with enhanced styling
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Error';
    copyButton.style.backgroundColor = '#f5f5f5';
    copyButton.style.color = '#d32f2f';
    copyButton.style.border = '1px solid #d32f2f';
    copyButton.style.borderRadius = '4px';
    copyButton.style.padding = '5px 10px';
    copyButton.style.fontSize = '12px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.transition = 'all 0.2s ease';

    // Hover effects
    copyButton.addEventListener('mouseover', () => {
      copyButton.style.backgroundColor = '#d32f2f';
      copyButton.style.color = 'white';
    });

    copyButton.addEventListener('mouseout', () => {
      copyButton.style.backgroundColor = '#f5f5f5';
      copyButton.style.color = '#d32f2f';
    });

    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(message)
          .then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
              copyButton.textContent = 'Copy Error';
            }, 2000);
          });
    });

    errorDiv.appendChild(copyButton);
    this.UIElements.outputConsole.appendChild(errorDiv);

    // Animate error entrance
    setTimeout(() => {
      errorDiv.style.opacity = '1';
      errorDiv.style.transform = 'translateY(0)';
    }, 10);
  }}
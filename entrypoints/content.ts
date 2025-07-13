export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Configuration object
    const config = {
      targetElements: ['h1', 'h2', 'h3'], // Add or remove elements as needed
      tooltipClass: 'original-text-tooltip'
    };

    // Create and inject hover tooltip styles
    const style = document.createElement('style');
    style.textContent = `
      .${config.tooltipClass} {
        position: absolute;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.9em;
        z-index: 10000;
        pointer-events: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transform: translateY(-100%);
        margin-top: -8px;
      }
    `;
    document.head.appendChild(style);

    // Function to convert text to uppercase and store original
    function convertElementsToUpperCase() {
      config.targetElements.forEach(elementType => {
        const elements = document.getElementsByTagName(elementType);
        
        for (const element of elements) {
          if (element.textContent && !element.hasAttribute('data-original-text')) {
            // Store original text
            const originalText = element.textContent;
            element.setAttribute('data-original-text', originalText);
            
            // Convert to uppercase
            element.textContent = originalText.toUpperCase();
            
            // Add hover listeners
            element.addEventListener('mouseenter', (e: Event) => showOriginalText(e as MouseEvent));
            element.addEventListener('mouseleave', (e: Event) => hideOriginalText(e as MouseEvent));
          }
        }
      });
    }

    // Show original text tooltip
    function showOriginalText(event: MouseEvent) {
      const element = event.target as HTMLElement;
      const originalText = element.getAttribute('data-original-text');
      
      if (originalText) {
        const tooltip = document.createElement('div');
        tooltip.className = config.tooltipClass;
        tooltip.textContent = originalText;
        
        // Position tooltip above the element
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY}px`;
        
        // Add a random ID to connect tooltip with element
        const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
        tooltip.setAttribute('data-tooltip-id', tooltipId);
        tooltip.setAttribute('id', tooltipId);
        element.setAttribute('data-tooltip-id', tooltipId);
        
        document.body.appendChild(tooltip);
      }
    }

    // Hide original text tooltip
    function hideOriginalText(event: MouseEvent) {
      const element = event.target as HTMLElement;
      const tooltipId = element.getAttribute('data-tooltip-id');
      if (tooltipId) {
        const tooltip = document.querySelector(`#${tooltipId}`);
        if (tooltip) {
          tooltip.remove();
        }
        element.removeAttribute('data-tooltip-id');
      }
    }

    // Run the conversion immediately
    convertElementsToUpperCase();

    // Also handle dynamically added elements using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          // Check if any of the added nodes are target elements or contain target elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (config.targetElements.includes(element.tagName.toLowerCase())) {
                convertElementsToUpperCase();
              } else {
                // Check for target elements inside the added element
                let hasTargetElements = false;
                config.targetElements.forEach(elementType => {
                  if (element.getElementsByTagName(elementType).length > 0) {
                    hasTargetElements = true;
                  }
                });
                if (hasTargetElements) {
                  convertElementsToUpperCase();
                }
              }
            }
          });
        }
      });
    });

    // Observe the entire document for added nodes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
});

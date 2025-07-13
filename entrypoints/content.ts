export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Create and inject hover tooltip styles
    const style = document.createElement('style');
    style.textContent = `
      .original-text-tooltip {
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

    // Function to convert h1 text to uppercase and store original
    function convertH1sToUpperCase() {
      const h1Elements = document.getElementsByTagName('h1');
      
      for (const h1 of h1Elements) {
        if (h1.textContent && !h1.hasAttribute('data-original-text')) {
          // Store original text
          const originalText = h1.textContent;
          h1.setAttribute('data-original-text', originalText);
          
          // Convert to uppercase
          h1.textContent = originalText.toUpperCase();
          
          // Add hover listeners
          h1.addEventListener('mouseenter', showOriginalText);
          h1.addEventListener('mouseleave', hideOriginalText);
        }
      }
    }

    // Show original text tooltip
    function showOriginalText(event: MouseEvent) {
      const h1 = event.target as HTMLElement;
      const originalText = h1.getAttribute('data-original-text');
      
      if (originalText) {
        const tooltip = document.createElement('div');
        tooltip.className = 'original-text-tooltip';
        tooltip.textContent = originalText;
        
        // Position tooltip above the h1
        const rect = h1.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY}px`;
        
        // Add a random ID to connect tooltip with h1
        const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
        tooltip.setAttribute('data-tooltip-id', tooltipId);
        tooltip.setAttribute('id', tooltipId);
        h1.setAttribute('data-tooltip-id', tooltipId);
        
        document.body.appendChild(tooltip);
      }
    }

    // Hide original text tooltip
    function hideOriginalText(event: MouseEvent) {
      const h1 = event.target as HTMLElement;
      const tooltipId = h1.getAttribute('data-tooltip-id');
      if (tooltipId) {
        const tooltip = document.querySelector(`#${tooltipId}`);
        if (tooltip) {
          tooltip.remove();
        }
        h1.removeAttribute('data-tooltip-id');
      }
    }

    // Run the conversion immediately
    convertH1sToUpperCase();

    // Also handle dynamically added h1s using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          // Check if any of the added nodes are h1s or contain h1s
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if ((node as Element).tagName === 'H1') {
                convertH1sToUpperCase(); // This will handle the new h1
              } else {
                // Check for h1s inside the added element
                const h1s = (node as Element).getElementsByTagName('h1');
                if (h1s.length > 0) {
                  convertH1sToUpperCase(); // This will handle any new h1s
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

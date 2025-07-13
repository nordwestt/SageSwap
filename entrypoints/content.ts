
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Function to convert h1 text to uppercase
    function convertH1sToUpperCase() {
      const h1Elements = document.getElementsByTagName('h1');
      
      for (const h1 of h1Elements) {
        if (h1.textContent) {
          h1.textContent = h1.textContent.toUpperCase();
        }
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
                if (node.textContent) {
                  node.textContent = node.textContent.toUpperCase();
                }
              } else {
                // Check for h1s inside the added element
                const h1s = (node as Element).getElementsByTagName('h1');
                for (const h1 of h1s) {
                  if (h1.textContent) {
                    h1.textContent = h1.textContent.toUpperCase();
                  }
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

import { storage } from '#imports';


export async function translateText({
  text,
  source,
  target
}: {
  text: string;
  source: string;
  target: string;
}): Promise<string> {
  const apiKey = "";

  if (!apiKey) {
    throw new Error("Missing DeepL API key.");
  }

  const response = await fetch("https://api.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
    },
    body: JSON.stringify({
      text: [text],
      target_lang: target,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  return result.translations[0].text;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    // Get settings from storage
    const result = await storage.getItem<any>('local:elementSettings') || {};
    const elementSettings = result.elementSettings || {
      h1: true,
      h2: false,
      h3: false,
      p: false,
    };

    // Configuration object
    const config = {
      targetElements: Object.entries(elementSettings)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([elementType]) => elementType),
      tooltipClass: 'original-text-tooltip',
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

    // Function to translate text to Spanish and store original
    async function translateElementsToSpanish() {
      for (const elementType of config.targetElements) {
        const elements = document.getElementsByTagName(elementType);
        
        for (const element of elements) {
          if (element.textContent && !element.hasAttribute('data-original-text')) {
            try {
              // Store original text
              const originalText = element.textContent;
              element.setAttribute('data-original-text', originalText);
              
              // Translate to Spanish
              const translatedText = await translateText({
                text: originalText,
                source: 'en',
                target: 'es'
              });
              element.textContent = translatedText;
              
              // Add hover listeners
              element.addEventListener('mouseenter', showOriginalText as EventListener);
              element.addEventListener('mouseleave', hideOriginalText as EventListener);
            } catch (error) {
              console.error('Translation error:', error);
              // If translation fails, keep original text
              if (!element.hasAttribute('data-original-text')) {
                element.removeAttribute('data-original-text');
              }
            }
          }
        }
      }
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

    // Function to reset all transformed elements
    function resetElements() {
      document.querySelectorAll('[data-original-text]').forEach((element) => {
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
          element.textContent = originalText;
          element.removeAttribute('data-original-text');
          element.removeEventListener('mouseenter', showOriginalText as EventListener);
          element.removeEventListener('mouseleave', hideOriginalText as EventListener);
        }
      });
    }

    // Listen for settings changes
    browser.storage.onChanged.addListener((changes) => {
      if (changes.elementSettings) {
        const newSettings = changes.elementSettings.newValue;
        // Update config
        config.targetElements = Object.entries(newSettings)
          .filter(([_, isEnabled]) => isEnabled)
          .map(([elementType]) => elementType);
        
        // Reset all elements and reapply with new settings
        resetElements();
        translateElementsToSpanish();
      }
    });

    // Run the initial translation
    translateElementsToSpanish();

    // Also handle dynamically added elements using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          // Check if any of the added nodes are target elements or contain target elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (config.targetElements.includes(element.tagName.toLowerCase())) {
                translateElementsToSpanish();
              } else {
                // Check for target elements inside the added element
                let hasTargetElements = false;
                config.targetElements.forEach(elementType => {
                  if (element.getElementsByTagName(elementType).length > 0) {
                    hasTargetElements = true;
                  }
                });
                if (hasTargetElements) {
                  translateElementsToSpanish();
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

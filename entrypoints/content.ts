import { storage } from '#imports';
import { getTranslationService } from '../src/translation.service';
import '../assets/content.css';

export async function translateText({
  text,
  source,
  target
}: {
  text: string;
  source: string;
  target: string;
}): Promise<string> {
  const translationService = getTranslationService();
  const translatedText = await translationService.translateWithDeepL(text, source, target);
  return translatedText;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    // Get settings from storage
    const result = await storage.getItem<any>('local:elementSettings') || {};
    const elementSettings = result || {
      h1: true,
      h2: false,
      h3: false,
      p: false,
    };

    // Get target language from storage
    const targetLanguage = await storage.getItem<string>('local:targetLanguage') || 'es';

    // Configuration object
    const config = {
      targetElements: Object.entries(elementSettings)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([elementType]) => elementType),
      tooltipClass: 'original-text-tooltip',
      targetLanguage,
    };

    // Function to translate a single element
    async function translateElement(element: HTMLElement) {
      if (element.textContent && !element.hasAttribute('data-original-text') && !element.hasAttribute('data-translation-in-progress')) {
        try {
          element.setAttribute('data-translation-in-progress', 'true');
          element.classList.add('translated-element');
          
          // Store original text
          const originalText = element.textContent;
          element.setAttribute('data-original-text', originalText);
          
          // Translate using selected target language
          const translatedText = await translateText({
            text: originalText,
            source: 'en',
            target: config.targetLanguage
          });
          element.textContent = translatedText;
          
          // Add hover listeners
          element.addEventListener('mouseenter', showOriginalText as EventListener);
          element.addEventListener('mouseleave', hideOriginalText as EventListener);
          
          element.removeAttribute('data-translation-in-progress');
        } catch (error) {
          console.error('Translation error:', error);
          // If translation fails, revert changes
          element.removeAttribute('data-original-text');
          element.removeAttribute('data-translation-in-progress');
          element.classList.remove('translated-element');
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
          element.removeAttribute('data-translation-in-progress');
          element.classList.remove('translated-element');
          element.removeEventListener('mouseenter', showOriginalText as EventListener);
          element.removeEventListener('mouseleave', hideOriginalText as EventListener);
        }
      });
    }

    // Create Intersection Observer
    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          translateElement(element);
          // Stop observing this element once it's been translated
          observer.unobserve(element);
        }
      });
    };

    const intersectionObserver = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '50px', // Start translating slightly before elements enter the viewport
      threshold: 0.1
    });

    // Function to start observing elements
    function observeElements() {
      for (const elementType of config.targetElements) {
        const elements = document.getElementsByTagName(elementType);
        for (const element of elements) {
          if (!element.hasAttribute('data-original-text') && !element.hasAttribute('data-translation-in-progress')) {
            intersectionObserver.observe(element);
          }
        }
      }
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
        observeElements();
      }

      // Handle target language changes
      if (changes.targetLanguage) {
        config.targetLanguage = changes.targetLanguage.newValue;
        // Reset and retranslate all elements with new language
        resetElements();
        observeElements();
      }
    });

    // Start observing initial elements
    observeElements();

    // Handle dynamically added elements using MutationObserver
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (config.targetElements.includes(element.tagName.toLowerCase())) {
                intersectionObserver.observe(element);
              }
              // Check for target elements inside the added element
              config.targetElements.forEach(elementType => {
                Array.from(element.getElementsByTagName(elementType)).forEach((el: Element) => {
                  const htmlElement = el as HTMLElement;
                  if (!htmlElement.hasAttribute('data-original-text') && !htmlElement.hasAttribute('data-translation-in-progress')) {
                    intersectionObserver.observe(htmlElement);
                  }
                });
              });
            }
          });
        }
      });
    });

    // Observe the entire document for added nodes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
});

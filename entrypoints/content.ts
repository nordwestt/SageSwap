import { storage } from '#imports';
import { getTranslationService } from '../src/translation.service';
import '../assets/content.css';

// Function to generate text variants for quiz
async function generateTextVariants(text: string): Promise<string[]> {
  const variants = [text];
  // Generate variants by slightly modifying the original text
  for (let i = 0; i < 2; i++) {
    const variant = text.split(' ').map(word => word + ' ' + Math.random().toString(36).substring(2, 5)).join(' ');
    variants.push(variant);
  }
  
  // Shuffle the array
  return variants.sort(() => Math.random() - 0.5);
}

// Function to create quiz UI
function createQuizUI(originalText: string, variants: string[], element: HTMLElement): HTMLElement {
  const quizContainer = document.createElement('div');
  quizContainer.className = 'quiz-options quiz-container';
  
  variants.forEach((variant, index) => {
    // Create a wrapper div for each option
    const optionWrapper = document.createElement('div');
    optionWrapper.className = 'quiz-option-wrapper';

    const button = document.createElement('button');
    button.className = 'quiz-option blurred';
    button.textContent = variant;
    
    // Add the "click to reveal" text as an overlay
    const revealText = document.createElement('span');
    revealText.className = 'reveal-text-overlay';
    revealText.textContent = 'click to reveal...';
    
    button.addEventListener('click', () => {
      button.classList.remove('blurred');
      revealText.style.display = 'none';

      // Check if the answer is correct
      const isCorrect = variant === variants[0]; // First variant is always the correct one
      
      // Add result icon
      const resultIcon = document.createElement('div');
      resultIcon.className = `result-icon ${isCorrect ? 'correct' : 'incorrect'}`;
      resultIcon.innerHTML = isCorrect ? '✓' : '✗';
      quizContainer.appendChild(resultIcon);
      
      // Highlight the selected option
      button.classList.add(isCorrect ? 'correct' : 'incorrect');
      
      // Disable all buttons
      quizContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
      });

      
      // // Remove the quiz after a delay
      setTimeout(() => {
        quizContainer.remove();
      }, 2000);
    });
    optionWrapper.appendChild(button);
    optionWrapper.appendChild(revealText); // Add the reveal text after the button

    quizContainer.appendChild(optionWrapper);
  });
  
  return quizContainer;
}

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
    // Check if current domain is excluded
    const currentDomain = window.location.hostname;
    const excludedDomains = await storage.getItem<string[]>('local:excludedDomains') || [];
    
    if (excludedDomains.includes(currentDomain)) {
      console.log('SwapSage: Translation disabled for this domain');
      return;
    }

    // Get settings from storage
    const result = await storage.getItem<any>('local:elementSettings') || {};
    const elementSettings = result || {
      h1: true,
      h2: false,
      h3: false,
      p: false,
      quizMode: false,
    };

    // let showQuiz = false;

    let showQuiz: Record<string, boolean> = {};


    // Get target language from storage
    const targetLanguage = await storage.getItem<string>('local:targetLanguage') || 'es';

    // Configuration object
    const config = {
      targetElements: Object.entries(elementSettings)
        .filter(([key, isEnabled]) => isEnabled && key !== 'quizMode')
        .map(([elementType]) => elementType),
      tooltipClass: 'original-text-tooltip',
      targetLanguage,
      quizMode: elementSettings.quizMode
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

    function hideQuiz(quizContainerId: string, timeout: number = 300){
      return;
      showQuiz[quizContainerId] = false;
      setTimeout(() => {
        if (!showQuiz[quizContainerId]) {
          const quizContainer = document.querySelector(`#${quizContainerId}`);
          if (quizContainer) {
            quizContainer.remove();
          }
        }
      }, timeout);
    }

    // Show original text tooltip or quiz
    async function showOriginalText(event: Event) {
      const element = event.target as HTMLElement;
      const originalText = element.getAttribute('data-original-text');
      
      if (!originalText) return;


      // Generate variants and create quiz UI
      // const variants = await generateTextVariants(originalText);
      const quizContainerId = element.getAttribute('data-quiz-container-id');

      // do not show quiz if it already exists
      if (document.querySelector(`#${quizContainerId}`)) return;

      const quizContainer = createQuizUI(originalText, [originalText], element);
      quizContainer.id = quizContainerId ?? Math.random().toString(36).substring(2, 15);
      
      // Position quiz container
      const rect = element.getBoundingClientRect();
      quizContainer.style.left = `${rect.left + window.scrollX}px`;
      quizContainer.style.top = `${rect.top + window.scrollY}px`;
      quizContainer.addEventListener('mouseenter', () => {
        showQuiz[quizContainer.id] = true;
      });
      quizContainer.addEventListener('mouseleave', () => {
        hideQuiz(quizContainer.id);
      });
      
      document.body.appendChild(quizContainer);
      
      // Store reference to quiz container
      element.setAttribute('data-quiz-container-id', quizContainer.id);
      showQuiz[quizContainer.id] = true;
        
    }

    // Hide original text tooltip or quiz
    function hideOriginalText(event: Event) {
      const element = event.target as HTMLElement;
      
      // Remove quiz container if exists
      const quizContainerId = element.getAttribute('data-quiz-container-id');
      if (!quizContainerId) return;
      hideQuiz(quizContainerId);
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
          .filter(([key, isEnabled]) => isEnabled && key !== 'quizMode')
          .map(([elementType]) => elementType);
        
        config.quizMode = newSettings.quizMode;
        
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

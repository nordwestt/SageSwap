import { Config } from '../types';
import { TranslatedElementComponent } from '../components/translated-element.component';

export class ElementObserverService {
  private intersectionObserver!: IntersectionObserver;
  private mutationObserver!: MutationObserver;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.setupIntersectionObserver();
    this.setupMutationObserver();
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            TranslatedElementComponent.translateElement(element, this.config);
            observer.unobserve(element);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.observeNewElement(node as Element);
            }
          });
        }
      });
    });
  }

  private observeNewElement(element: Element): void {
    if (this.config.targetElements.includes(element.tagName.toLowerCase())) {
      this.intersectionObserver.observe(element);
    }

    // Check for target elements inside the added element
    this.config.targetElements.forEach(elementType => {
      Array.from(element.getElementsByTagName(elementType)).forEach((el: Element) => {
        const htmlElement = el as HTMLElement;
        if (!TranslatedElementComponent.isElementProcessed(htmlElement)) {
          this.intersectionObserver.observe(htmlElement);
        }
      });
    });
  }

  startObserving(): void {
    // Start observing initial elements
    this.config.targetElements.forEach(elementType => {
      const elements = document.getElementsByTagName(elementType);
      Array.from(elements).forEach(element => {
        if (!TranslatedElementComponent.isElementProcessed(element as HTMLElement)) {
          this.intersectionObserver.observe(element);
        }
      });
    });

    // Start observing DOM mutations
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  stopObserving(): void {
    this.intersectionObserver.disconnect();
    this.mutationObserver.disconnect();
  }

  updateConfig(newConfig: Config): void {
    this.config = newConfig;
  }
} 
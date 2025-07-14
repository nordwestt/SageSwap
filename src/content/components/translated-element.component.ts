import { Config } from '../types';
import { getTranslationService } from '../../translation.service';
import { QuizUIComponent } from './quiz-ui.component';
import { quizService } from '../services/quiz.service';

export class TranslatedElementComponent {
  static async translateElement(element: HTMLElement, config: Config): Promise<void> {
    if (!element.textContent || this.isElementProcessed(element)) {
      return;
    }

    try {
      element.setAttribute('data-translation-in-progress', 'true');
      element.classList.add('translated-element');
      
      // Store original text
      const originalText = element.textContent;
      element.setAttribute('data-original-text', originalText);
      
      // Translate using selected target language
      const translationService = getTranslationService();
      const translatedText = await translationService.translateWithDeepL(
        originalText,
        'en',
        config.targetLanguage
      );
      
      element.textContent = translatedText;
      
      // Add event listeners
      element.addEventListener('mouseenter', () => this.showOriginalText(element));
      element.addEventListener('mouseleave', () => this.hideOriginalText(element));
      element.addEventListener('click', () => this.onTranslatedTextClick(element));
      
      element.removeAttribute('data-translation-in-progress');
    } catch (error) {
      console.error('Translation error:', error);
      this.resetElement(element);
    }
  }

  static isElementProcessed(element: HTMLElement): boolean {
    return (
      element.hasAttribute('data-original-text') ||
      element.hasAttribute('data-translation-in-progress')
    );
  }

  private static async showOriginalText(element: HTMLElement): Promise<void> {
    const originalText = element.getAttribute('data-original-text');
    if (!originalText) return;

    const quizContainerId = element.getAttribute('data-quiz-container-id');
    if (document.querySelector(`#${quizContainerId}`)) return;

    const quizContainer = QuizUIComponent.createQuizContainer(
      originalText,
      [originalText],
      element
    );

    const containerId = "id-"+Math.random().toString(36).substring(2, 15);
    quizContainer.id = containerId;
    
    QuizUIComponent.positionQuizContainer(quizContainer, element);
    
    quizContainer.addEventListener('mouseenter', () => {
      quizService.setQuizVisibility(containerId, true);
    });
    
    quizContainer.addEventListener('mouseleave', () => {
      quizService.setQuizVisibility(containerId, false);
      this.hideQuiz(containerId);
    });
    
    document.body.appendChild(quizContainer);
    element.setAttribute('data-quiz-container-id', containerId);
    quizService.setQuizVisibility(containerId, true);
  }

  private static hideOriginalText(element: HTMLElement): void {
    const quizContainerId = element.getAttribute('data-quiz-container-id');
    if (!quizContainerId) return;
    this.hideQuiz(quizContainerId);
  }

  private static hideQuiz(quizContainerId: string, timeout: number = 300): void {
    quizService.setQuizVisibility(quizContainerId, false);
    setTimeout(() => {
      if (!quizService.isQuizVisible(quizContainerId)) {
        const quizContainer = document.querySelector(`#${quizContainerId}`);
        if (quizContainer) {
          quizContainer.remove();
        }
      }
    }, timeout);
  }

  private static onTranslatedTextClick(element: HTMLElement): void {
    const originalText = element.getAttribute('data-original-text');
    if (!originalText || !element.classList.contains('translated-element')) return;
    
    quizService.revealText(originalText);
    
    const quizContainerId = element.getAttribute('data-quiz-container-id');
    if (quizContainerId) {
      const quizContainer = document.querySelector(`#${quizContainerId}`);
      if (quizContainer) {
        const button = quizContainer.querySelector('.quiz-option') as HTMLButtonElement;
        const revealText = quizContainer.querySelector('.reveal-text-overlay') as HTMLElement;
        if (button && revealText) {
          button.classList.remove('blurred');
          revealText.style.display = 'none';
          button.disabled = true;
        }
      }
    }
  }

  private static resetElement(element: HTMLElement): void {
    element.removeAttribute('data-original-text');
    element.removeAttribute('data-translation-in-progress');
    element.classList.remove('translated-element');
  }

  static resetAllElements(): void {
    document.querySelectorAll('[data-original-text]').forEach((element) => {
      const originalText = element.getAttribute('data-original-text');
      if (originalText) {
        element.textContent = originalText;
        this.resetElement(element as HTMLElement);
      }
    });
  }
} 
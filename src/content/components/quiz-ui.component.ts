import { quizService } from '../services/quiz.service';

export class QuizUIComponent {
  private static createOptionWrapper(
    variant: string,
    onReveal: () => void
  ): HTMLDivElement {
    const optionWrapper = document.createElement('div');
    optionWrapper.className = 'quiz-option-wrapper';

    const button = document.createElement('button');
    button.className = 'quiz-option';
    button.textContent = variant;

    const revealText = document.createElement('span');
    revealText.className = 'reveal-text-overlay';
    revealText.textContent = 'click to reveal...';
    revealText.style.display = 'none';

    if (!quizService.isTextRevealed(variant)) {
      button.classList.add('blurred');
      revealText.style.display = 'block';
    }

    button.addEventListener('click', () => {
      button.classList.remove('blurred');
      revealText.style.display = 'none';
      quizService.revealText(variant);
      onReveal();
    });

    optionWrapper.appendChild(button);
    optionWrapper.appendChild(revealText);

    return optionWrapper;
  }

  static createQuizContainer(
    originalText: string,
    variants: string[],
    element: HTMLElement
  ): HTMLElement {
    const quizContainer = document.createElement('div');
    quizContainer.className = 'quiz-options quiz-container';

    variants.forEach(variant => {
      const optionWrapper = this.createOptionWrapper(variant, () => {
        // Disable all buttons
        quizContainer.querySelectorAll('button').forEach(btn => {
          (btn as HTMLButtonElement).disabled = true;
        });
        
        setTimeout(() => {
          quizContainer.remove();
        }, 2000);
      });

      quizContainer.appendChild(optionWrapper);
    });

    return quizContainer;
  }

  static positionQuizContainer(
    quizContainer: HTMLElement,
    element: HTMLElement
  ): void {
    const rect = element.getBoundingClientRect();
    quizContainer.style.left = `${rect.left + window.scrollX}px`;
    quizContainer.style.top = `${rect.top + window.scrollY}px`;
  }
} 
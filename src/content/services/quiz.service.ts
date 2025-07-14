import { RevealedTexts } from '../types';

export class QuizService {
  private revealedTexts: RevealedTexts = {};
  private showQuiz: Record<string, boolean> = {};

  async generateTextVariants(text: string): Promise<string[]> {
    const variants = [text];
    // Generate variants by slightly modifying the original text
    for (let i = 0; i < 2; i++) {
      const variant = text
        .split(' ')
        .map(word => word + ' ' + Math.random().toString(36).substring(2, 5))
        .join(' ');
      variants.push(variant);
    }
    
    // Shuffle the array
    return variants.sort(() => Math.random() - 0.5);
  }

  isTextRevealed(text: string): boolean {
    return !!this.revealedTexts[text];
  }

  revealText(text: string): void {
    this.revealedTexts[text] = true;
  }

  setQuizVisibility(quizId: string, visible: boolean): void {
    this.showQuiz[quizId] = visible;
  }

  isQuizVisible(quizId: string): boolean {
    return !!this.showQuiz[quizId];
  }
}

export const quizService = new QuizService(); 
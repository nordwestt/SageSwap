export interface ElementSettings {
  h1: boolean;
  h2: boolean;
  h3: boolean;
  p: boolean;
  quizMode: boolean;
}

export interface Config {
  targetElements: string[];
  tooltipClass: string;
  targetLanguage: string;
  quizMode: boolean;
}

export interface QuizState {
  [key: string]: boolean;
}

export interface RevealedTexts {
  [key: string]: boolean;
} 
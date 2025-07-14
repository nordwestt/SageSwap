import { storage } from '#imports';
import { Config, ElementSettings } from '../types';

export async function getConfig(): Promise<Config> {
  const elementSettings = await storage.getItem<ElementSettings>('local:elementSettings') || {
    h1: true,
    h2: false,
    h3: false,
    p: false,
    quizMode: false,
  };

  const targetLanguage = await storage.getItem<string>('local:targetLanguage') || 'es';

  return {
    targetElements: Object.entries(elementSettings)
      .filter(([key, isEnabled]) => isEnabled && key !== 'quizMode')
      .map(([elementType]) => elementType),
    tooltipClass: 'original-text-tooltip',
    targetLanguage,
    quizMode: elementSettings.quizMode
  };
}

export async function isExcludedDomain(domain: string): Promise<boolean> {
  const excludedDomains = await storage.getItem<string[]>('local:excludedDomains') || [];
  return excludedDomains.includes(domain);
} 
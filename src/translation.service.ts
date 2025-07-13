import { defineProxyService } from '@webext-core/proxy-service';
import { storage } from '#imports';

interface TranslationCacheEntry {
  text: string;
  source: string;
  target: string;
  translation: string;
  timestamp: number;
}

const translationCache = storage.defineItem<TranslationCacheEntry[]>('local:translationCache', {
  fallback: [],
  // Cache entries for 24 hours
  init: () => [],
});

// 1. Define your service
class TranslationService {
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private getCacheKey(text: string, source: string, target: string): string {
    return `${text}:${source}:${target}`;
  }

  private async getCachedTranslation(text: string, source: string, target: string): Promise<string | null> {
    const cache = await translationCache.getValue();
    const now = Date.now();
    
    // Clean up expired entries
    const validCache = cache.filter(entry => 
      now - entry.timestamp < this.CACHE_DURATION
    );
    
    if (validCache.length !== cache.length) {
      await translationCache.setValue(validCache);
    }

    const cacheEntry = validCache.find(entry => 
      entry.text === text && 
      entry.source === source && 
      entry.target === target
    );

    let response = cacheEntry ? cacheEntry.translation : null;
    return response;
  }

  private async cacheTranslation(text: string, source: string, target: string, translation: string) {
    const cache = await translationCache.getValue();
    const newEntry: TranslationCacheEntry = {
      text,
      source,
      target,
      translation,
      timestamp: Date.now()
    };

    await translationCache.setValue([...cache, newEntry]);
  }

  async translateWithDeepL(text: string, source: string, target: string): Promise<string> {
    // Check cache first
    const cachedTranslation = await this.getCachedTranslation(text, source, target);
    if (cachedTranslation) {
      return cachedTranslation;
    }

    // Get API key from storage
    const apiKey = await storage.getItem('local:deeplApiKey');
    if (!apiKey) {
      throw new Error('DeepL API key not configured. Please set your API key in the extension settings.');
    }

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
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
      const translation = result.translations[0].text;

      // Cache the new translation
      await this.cacheTranslation(text, source, target, translation);
    
      return translation;
  }
}

export const [registerTranslationService, getTranslationService] = defineProxyService(
  'TranslationService',
  () => new TranslationService(),
);

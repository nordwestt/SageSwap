import { defineProxyService } from '@webext-core/proxy-service';

// 1. Define your service
class TranslationService {

  async translateWithDeepL(text: string, source: string, target: string): Promise<string> {
    const apiKey = "";
    return "Hello";
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
    
      return result.translations[0].text;
  }
}
export const [registerTranslationService, getTranslationService] = defineProxyService(
  'TranslationService',
  () => new TranslationService(),
);

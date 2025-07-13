import { registerTranslationService } from '../src/translation.service';

export default defineBackground(() => {
  registerTranslationService();
  console.log('Hello background!', { id: browser.runtime.id });
});

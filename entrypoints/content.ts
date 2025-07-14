import { storage } from '#imports';
import { getConfig, isExcludedDomain } from '../src/content/utils/settings.utils';
import { ElementObserverService } from '../src/content/services/element-observer.service';
import { TranslatedElementComponent } from '../src/content/components/translated-element.component';
import '../src/content/styles/content.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    // Check if current domain is excluded
    const currentDomain = window.location.hostname;
    if (await isExcludedDomain(currentDomain)) {
      console.log('SageSwap: Translation disabled for this domain');
      return;
    }

    // Initialize configuration and observer service
    const config = await getConfig();
    const observerService = new ElementObserverService(config);
    observerService.startObserving();

    // Listen for settings changes
    browser.storage.onChanged.addListener(async (changes) => {
      if (changes.elementSettings || changes.targetLanguage || changes.deeplApiKey) {
        // Update config and restart observation
        const newConfig = await getConfig();
        TranslatedElementComponent.resetAllElements();
        observerService.updateConfig(newConfig);
        observerService.startObserving();
      }
    });
  }
});

import { useEffect, useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';
import { storage, browser } from '#imports';


interface ElementSettings {
  h1: boolean;
  h2: boolean;
  h3: boolean;
  quizMode: boolean;
}

const settingLabels = {
  h1: 'Headings',
  h2: 'Medium Headings',
  h3: 'Small Headings',
  quizMode: 'Quiz Mode',
} as const;

// Common language options
const LANGUAGE_OPTIONS = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
] as const;

function App() {
  const [settings, setSettings] = useState<ElementSettings>({
    h1: true,
    h2: false,
    h3: false,
    quizMode: false,
  });
  const [apiKey, setApiKey] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [excludedDomains, setExcludedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);

  // Load settings when popup opens
  useEffect(() => {
    // Get current tab's domain
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]?.url) {
        try {
          const url = new URL(tabs[0].url);
          setCurrentDomain(url.hostname);
        } catch (e) {
          console.error('Failed to parse URL:', e);
        }
      }
    });

    storage.getItem('local:elementSettings').then((result: any) => {
      if (result) {
        setSettings(result);
      }
    });

    // Load API key
    storage.getItem('local:deeplApiKey').then((key: unknown) => {
      if (typeof key === 'string') {
        setApiKey(key);
      }
    });

    // Load target language
    storage.getItem('local:targetLanguage').then((lang: unknown) => {
      if (typeof lang === 'string') {
        setTargetLanguage(lang);
      }
    });

    // Load excluded domains
    storage.getItem('local:excludedDomains').then((domains: unknown) => {
      if (Array.isArray(domains)) {
        setExcludedDomains(domains);
      }
    });
  }, []);

  // Save settings when they change
  const handleSettingChange = (elementType: keyof ElementSettings) => {
    const newSettings = {
      ...settings,
      [elementType]: !settings[elementType],
    };
    setSettings(newSettings);

    // Save to browser storage
    storage.setItem('local:elementSettings', newSettings);
  };

  // Handle API key changes
  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = event.target.value;
    setApiKey(newApiKey);
    storage.setItem('local:deeplApiKey', newApiKey);
  };

  // Handle target language changes
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    setTargetLanguage(newLanguage);
    storage.setItem('local:targetLanguage', newLanguage);
  };

  // Handle adding a new domain
  const handleAddDomain = (event: React.FormEvent) => {
    event.preventDefault();
    if (newDomain && !excludedDomains.includes(newDomain)) {
      const updatedDomains = [...excludedDomains, newDomain];
      setExcludedDomains(updatedDomains);
      setNewDomain('');
      storage.setItem('local:excludedDomains', updatedDomains);
    }
  };

  // Handle removing a domain
  const handleRemoveDomain = (domain: string) => {
    const updatedDomains = excludedDomains.filter(d => d !== domain);
    setExcludedDomains(updatedDomains);
    storage.setItem('local:excludedDomains', updatedDomains);
  };

  // Handle excluding current domain
  const handleExcludeCurrentDomain = () => {
    if (currentDomain && !excludedDomains.includes(currentDomain)) {
      const updatedDomains = [...excludedDomains, currentDomain];
      setExcludedDomains(updatedDomains);
      storage.setItem('local:excludedDomains', updatedDomains);
    }
  };

  return (
    <>
    <div className="settings-container bg-gradient-to-br from-emerald-600 to-emerald-300">
    
      <h1 className="!text-white !text-2xl font-bold p-4 flex items-center justify-between"><img
            src="/icon/96.png"
            alt="logo"
            className="w-16 h-16 mr-2 border-2 p-1 bg-white rounded-full shadow-lg"
          /> Swap Sage</h1>
      
      <div className="api-key-section">
        <h2 className="text-lg font-bold mb-4">DeepL API Key</h2>
        <input
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter your DeepL API key"
          className="api-key-input"
        />
        <p className="help-text">
          Enter your DeepL API key to enable translations
        </p>
      </div>

      <div className="language-section">
        <h2 className="text-lg font-bold mb-4">Target Language</h2>
        <select
          value={targetLanguage}
          onChange={handleLanguageChange}
          className="language-select"
        >
          {LANGUAGE_OPTIONS.map(lang => (
            <option key={lang.code} value={lang.code} className="language-option">
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
        <p className="help-text">
          Select the language to translate text into
        </p>
      </div>

      <div className="excluded-domains-section bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-bold mb-4">Excluded Domains</h2>
        <div className="flex gap-2 mb-4 flex-col">
          <form onSubmit={handleAddDomain} className="flex gap-2 flex-1">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g. example.com"
              className="p-2 rounded border w-full"
            />
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
              Add
            </button>
          </form>
          {currentDomain && !excludedDomains.includes(currentDomain) && (
            <button
              onClick={handleExcludeCurrentDomain}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 whitespace-nowrap"
              title={`Exclude ${currentDomain}`}
            >
              Exclude Current
            </button>
          )}
        </div>
        <div className="excluded-domains-list">
          {excludedDomains.map((domain, index) => (
            <div key={index} className="flex items-center justify-between bg-white p-2 rounded mb-2">
              <span>{domain}</span>
              <button
                onClick={() => handleRemoveDomain(domain)}
                className="text-red-600 hover:text-red-800 bg-gray-100 hover:bg-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <p className="help-text">
          Add domains where you don't want translations to run
        </p>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
      <h2 className="text-lg font-bold mb-4">Text Transform Settings</h2>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(settings).map(([elementType, isEnabled]) => (
          elementType !== 'quizMode' && (
            <label key={elementType} className="flex items-center gap-2 bg-white p-2 rounded-lg cursor-pointer hover:bg-gray-200">
              <input
                type="checkbox"
                checked={isEnabled}
                className="w-4 h-4 !accent-emerald-600"
                onChange={() => handleSettingChange(elementType as keyof ElementSettings)}
              />
              <span className="element-type">{settingLabels[elementType as keyof typeof settingLabels]}</span>
            </label>
          )
        ))}
      </div>
      </div>
      
      {/* <div className="quiz-mode-section">
        <label className="setting-item quiz-mode">
          <input
            type="checkbox"
            checked={settings.quizMode}
            onChange={() => handleSettingChange('quizMode')}
          />
          <span className="element-type">Quiz Mode</span>
        </label>
        <p className="help-text">
          When enabled, test your language skills by choosing the correct original text
        </p>
      </div> */}
    </div>
    </>
  );
}

export default App;

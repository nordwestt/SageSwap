import { useEffect, useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';
import { storage } from '#imports';


interface ElementSettings {
  h1: boolean;
  h2: boolean;
  h3: boolean;
  p: boolean;
  quizMode: boolean;
}

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
    p: false,
    quizMode: false,
  });
  const [apiKey, setApiKey] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');

  // Load settings when popup opens
  useEffect(() => {
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

  return (
    <>
    <div className="settings-container">
      <h1>SwapSage Settings</h1>
      
      <div className="api-key-section">
        <h2>DeepL API Key</h2>
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
        <h2>Target Language</h2>
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

      <h2>Text Transform Settings</h2>
      <div className="settings-grid">
        {Object.entries(settings).map(([elementType, isEnabled]) => (
          elementType !== 'quizMode' && (
            <label key={elementType} className="setting-item">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => handleSettingChange(elementType as keyof ElementSettings)}
              />
              <span className="element-type">{elementType.toUpperCase()}</span>
            </label>
          )
        ))}
      </div>
      
      <div className="quiz-mode-section">
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
      </div>
    </div>
    </>
  );
}

export default App;

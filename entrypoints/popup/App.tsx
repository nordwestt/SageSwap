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
}

function App() {
  const [settings, setSettings] = useState<ElementSettings>({
    h1: true,
    h2: false,
    h3: false,
    p: false,
  });
  const [apiKey, setApiKey] = useState('');

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

      <h2>Text Transform Settings</h2>
      <div className="settings-grid">
        {Object.entries(settings).map(([elementType, isEnabled]) => (
          <label key={elementType} className="setting-item">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={() => handleSettingChange(elementType as keyof ElementSettings)}
            />
            <span className="element-type">{elementType.toUpperCase()}</span>
          </label>
        ))}
      </div>
      <p className="help-text">
        Select which elements should be transformed to uppercase
      </p>
    </div>
    </>
  );
}

export default App;

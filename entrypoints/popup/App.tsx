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

  // Load settings when popup opens
  useEffect(() => {
    storage.getItem('local:elementSettings').then((result: any) => {
      if (result) {
        setSettings(result);
      }
    });
  }, []);

  // // Save settings when they change
  const handleSettingChange = (elementType: keyof ElementSettings) => {
    const newSettings = {
      ...settings,
      [elementType]: !settings[elementType],
    };
    setSettings(newSettings);

    // Save to browser storage
    storage.setItem('local:elementSettings', newSettings);
  };

  return (
    <>
    <div className="settings-container">
      <h1>Text Transform Settings</h1>
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

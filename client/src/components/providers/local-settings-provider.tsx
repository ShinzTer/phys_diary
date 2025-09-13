import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalSettings, VisualSettings } from '@/hooks/use-local-settings';

interface LocalSettingsContextType {
  settings: VisualSettings;
  isLoaded: boolean;
  saveSettings: (settings: VisualSettings) => void;
  updateSetting: <K extends keyof VisualSettings>(key: K, value: VisualSettings[K]) => void;
}

const LocalSettingsContext = createContext<LocalSettingsContextType | undefined>(undefined);

export function LocalSettingsProvider({ children }: { children: React.ReactNode }) {
  const localSettings = useLocalSettings();

  return (
    <LocalSettingsContext.Provider value={localSettings}>
      {children}
    </LocalSettingsContext.Provider>
  );
}

export function useLocalSettingsContext() {
  const context = useContext(LocalSettingsContext);
  if (context === undefined) {
    throw new Error('useLocalSettingsContext must be used within a LocalSettingsProvider');
  }
  return context;
} 
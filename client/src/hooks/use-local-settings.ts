import { useState, useEffect } from 'react';

export interface VisualSettings {
  theme: 'light' | 'dark' | 'system';
  colorScheme: string;
  fontSize: string;
  reduceMotion: boolean;
  contrastMode: 'normal' | 'high';
}

const defaultSettings: VisualSettings = {
  theme: 'light',
  colorScheme: 'blue',
  fontSize: 'medium',
  reduceMotion: false,
  contrastMode: 'normal',
};

const STORAGE_KEY = 'visualSettings';

export function useLocalSettings() {
  const [settings, setSettings] = useState<VisualSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузить настройки из localStorage при инициализации
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.warn('Failed to load visual settings from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Сохранить настройки в localStorage
  const saveSettings = (newSettings: VisualSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      applyVisualSettings(newSettings);
    } catch (error) {
      console.error('Failed to save visual settings to localStorage:', error);
    }
  };

  // Обновить отдельную настройку
  const updateSetting = <K extends keyof VisualSettings>(
    key: K,
    value: VisualSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  // Применить визуальные настройки к DOM
  const applyVisualSettings = (settings: VisualSettings) => {
    const htmlElement = document.documentElement;
    
    function setThemeClass(isDark: boolean) {
      if (isDark) {
        htmlElement.classList.add("dark");
        // Apply dark mode CSS variables
        htmlElement.style.setProperty('--background', '240 10% 3.9%');
        htmlElement.style.setProperty('--foreground', '0 0% 98%');
        htmlElement.style.setProperty('--card', '240 10% 3.9%');
        htmlElement.style.setProperty('--card-foreground', '0 0% 98%');
        htmlElement.style.setProperty('--popover', '240 10% 3.9%');
        htmlElement.style.setProperty('--popover-foreground', '0 0% 98%');
        htmlElement.style.setProperty('--muted', '240 3.7% 15.9%');
        htmlElement.style.setProperty('--muted-foreground', '240 5% 64.9%');
        htmlElement.style.setProperty('--border', '240 3.7% 15.9%');
        htmlElement.style.setProperty('--input', '240 3.7% 15.9%');
      } else {
        htmlElement.classList.remove("dark");
        // Apply light mode CSS variables
        htmlElement.style.setProperty('--background', '0 0% 100%');
        htmlElement.style.setProperty('--foreground', '240 10% 3.9%');
        htmlElement.style.setProperty('--card', '0 0% 100%');
        htmlElement.style.setProperty('--card-foreground', '240 10% 3.9%');
        htmlElement.style.setProperty('--popover', '0 0% 100%');
        htmlElement.style.setProperty('--popover-foreground', '240 10% 3.9%');
        htmlElement.style.setProperty('--muted', '240 4.8% 95.9%');
        htmlElement.style.setProperty('--muted-foreground', '240 3.8% 46.1%');
        htmlElement.style.setProperty('--border', '240 5.9% 90%');
        htmlElement.style.setProperty('--input', '240 5.9% 90%');
      }
    }

    // Theme (light/dark/system)
    if (settings.theme === "dark") {
      setThemeClass(true);
    } else if (settings.theme === "light") {
      setThemeClass(false);
    } else {
      // System theme
      const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
      setThemeClass(systemThemeMedia.matches);
      
      // Add listener for system theme changes
      systemThemeMedia.addEventListener('change', (e) => {
        setThemeClass(e.matches);
      });
    }

    // Apply color scheme
    const colorSchemes = {
      blue: {
        primary: '221.2 83.2% 53.3%',
        'primary-foreground': '210 40% 98%',
      },
      green: {
        primary: '142.1 76.2% 36.3%',
        'primary-foreground': '355.7 100% 97.3%',
      },
      purple: {
        primary: '262.1 83.3% 57.8%',
        'primary-foreground': '210 40% 98%',
      },
      orange: {
        primary: '24.6 95% 53.1%',
        'primary-foreground': '60 9.1% 97.8%',
      },
      red: {
        primary: '0 84.2% 60.2%',
        'primary-foreground': '355.7 100% 97.3%',
      },
    };

    const selectedScheme = colorSchemes[settings.colorScheme as keyof typeof colorSchemes];
    if (selectedScheme) {
      Object.entries(selectedScheme).forEach(([key, value]) => {
        htmlElement.style.setProperty(`--${key}`, value);
      });
    }
    
    // Reduced motion
    if (settings.reduceMotion) {
      htmlElement.classList.add("motion-reduce");
    } else {
      htmlElement.classList.remove("motion-reduce");
    }
    
    // High contrast
    if (settings.contrastMode === "high") {
      // Increase contrast by adjusting the foreground colors
      const contrastAdjustment = (isDark: boolean) => {
        if (isDark) {
          htmlElement.style.setProperty('--foreground', '0 0% 100%');
          htmlElement.style.setProperty('--muted-foreground', '240 5% 84.9%');
        } else {
          htmlElement.style.setProperty('--foreground', '240 10% 0%');
          htmlElement.style.setProperty('--muted-foreground', '240 3.8% 26.1%');
        }
      };
      
      contrastAdjustment(htmlElement.classList.contains("dark"));
      htmlElement.classList.add("high-contrast");
    } else {
      htmlElement.classList.remove("high-contrast");
    }

    // Font size
    const fontSizeClasses = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      'extra-large': 'text-xl',
    };
    
    // Remove existing font size classes
    Object.values(fontSizeClasses).forEach(className => {
      htmlElement.classList.remove(className);
    });
    
    // Add new font size class
    const fontSizeClass = fontSizeClasses[settings.fontSize as keyof typeof fontSizeClasses];
    if (fontSizeClass) {
      htmlElement.classList.add(fontSizeClass);
    }
  };

  // Применить настройки при загрузке
  useEffect(() => {
    if (isLoaded) {
      applyVisualSettings(settings);
    }
  }, [isLoaded, settings]);

  return {
    settings,
    isLoaded,
    saveSettings,
    updateSetting,
    applyVisualSettings,
  };
} 
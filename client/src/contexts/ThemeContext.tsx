import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = {
  primary: string;
  variant: 'professional' | 'tint' | 'vibrant';
  appearance: 'light' | 'dark' | 'system';
  radius: number;
};

const defaultTheme: Theme = {
  primary: '#e11d48',
  variant: 'vibrant',
  appearance: 'system',
  radius: 0.5,
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Partial<Theme>) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    try {
      // Try to load theme from localStorage
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        setThemeState(JSON.parse(savedTheme));
      } else {
        // Try to load from theme.json if available
        fetch('/theme.json')
          .then(res => res.json())
          .then(data => {
            setThemeState({ ...defaultTheme, ...data });
            localStorage.setItem('app-theme', JSON.stringify({ ...defaultTheme, ...data }));
          })
          .catch(() => {
            // Use default theme if theme.json is not available
            localStorage.setItem('app-theme', JSON.stringify(defaultTheme));
          });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Partial<Theme>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setThemeState(updatedTheme);
    localStorage.setItem('app-theme', JSON.stringify(updatedTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: Theme) {
  // Apply primary color
  document.documentElement.style.setProperty('--primary', theme.primary);
  
  // Apply border radius
  document.documentElement.style.setProperty('--radius', `${theme.radius}rem`);
  
  // Apply color variant
  document.documentElement.classList.remove('theme-professional', 'theme-tint', 'theme-vibrant');
  document.documentElement.classList.add(`theme-${theme.variant}`);
  
  // Apply appearance (light/dark mode)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (theme.appearance === 'system') {
    document.documentElement.classList.toggle('dark', prefersDark);
  } else {
    document.documentElement.classList.toggle('dark', theme.appearance === 'dark');
  }
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

# Custom Theme Handler Implementation

Since we've removed the Replit-specific theme handler plugin, you'll need to implement a custom theme handling solution. This document provides instructions on how to create your own theme handler.

## Step 1: Create a Theme Context

Create a file `client/src/contexts/ThemeContext.tsx`:

```tsx
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
```

## Step 2: Add Theme CSS Variables

Create or update `client/src/index.css`:

```css
:root {
  --primary: #e11d48;
  --primary-foreground: #ffffff;
  --radius: 0.5rem;
  
  /* Light mode variables */
  --background: #ffffff;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --accent: #f1f5f9;
  --accent-foreground: #0f172a;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #e11d48;
}

.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
  --card: #1e293b;
  --card-foreground: #f8fafc;
  --popover: #1e293b;
  --popover-foreground: #f8fafc;
  --muted: #334155;
  --muted-foreground: #94a3b8;
  --accent: #1e293b;
  --accent-foreground: #f8fafc;
  --border: #334155;
  --input: #334155;
  --ring: #e11d48;
}

/* Variant styles */
.theme-professional {
  /* Professional theme variables */
}

.theme-tint {
  /* Tint theme variables */
}

.theme-vibrant {
  /* Vibrant theme variables */
}
```

## Step 3: Update Main.tsx

Update `client/src/main.tsx` to use the ThemeProvider:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

## Step 4: Create a Theme Switcher Component

Create `client/src/components/ThemeSwitcher.tsx`:

```tsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const toggleAppearance = () => {
    const modes = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(theme.appearance);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme({ appearance: modes[nextIndex] as 'light' | 'dark' | 'system' });
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleAppearance}>
      {theme.appearance === 'light' && <Sun size={20} />}
      {theme.appearance === 'dark' && <Moon size={20} />}
      {theme.appearance === 'system' && <Monitor size={20} />}
    </Button>
  );
}
```

## Step 5: Create a Theme.json File

Create a `theme.json` file in the public directory:

```json
{
  "primary": "#e11d48",
  "variant": "vibrant",
  "appearance": "system",
  "radius": 0.5
}
```

## Implementation Notes

1. This implementation stores theme preferences in localStorage for persistence
2. It falls back to theme.json if no localStorage data is available
3. The appearance setting respects the user's system preferences when set to "system"
4. The theme can be customized at runtime using the `setTheme` function

## Usage in Components

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme.appearance}</p>
      <button onClick={() => setTheme({ primary: '#3b82f6' })}>
        Change to blue theme
      </button>
    </div>
  );
}
```

This implementation provides the same functionality as the Replit theme plugin but works independently on any platform.
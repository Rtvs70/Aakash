# Custom Theme Handler Documentation

This document explains the custom theme handling implementation that replaces the Replit-specific theme plugin.

## Overview

The custom theme handler provides complete theme management functionality, including color schemes, light/dark mode, and UI preferences. It matches all the capabilities of the original Replit theme handler but works on any platform.

## Features

- **Theme Customization**: Change primary colors and design variants
- **Light/Dark Mode**: Toggle between light, dark, or system-based modes
- **UI Element Styling**: Control border radius and other UI properties
- **Theme Persistence**: Save user preferences to localStorage
- **System Theme Detection**: Automatically adapt to system preferences
- **Easy API**: Intuitive React hooks for theme management

## Implementation

The theme handler is implemented in `client/src/contexts/ThemeContext.tsx` using React's Context API and includes:

1. **Theme Provider**: Manages the theme state and provides it to the application
2. **Theme Application**: Applies theme settings to the document
3. **Theme Storage**: Persists theme choices in localStorage
4. **System Detection**: Detects system preferences for light/dark mode

## Usage

### Setting Up the Theme Provider

Wrap your application with the ThemeProvider in your main application file:

```tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Your application components */}
    </ThemeProvider>
  );
}
```

### Using the Theme Hook

Access and modify the theme from any component:

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleAppearance = () => {
    setTheme({ appearance: theme.appearance === 'light' ? 'dark' : 'light' });
  };

  return (
    <button onClick={toggleAppearance}>
      Switch to {theme.appearance === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
}
```

### Theme Properties

The theme object includes the following properties:

```typescript
type Theme = {
  primary: string;              // Primary color (hex code)
  variant: 'professional' | 'tint' | 'vibrant'; // Design variant
  appearance: 'light' | 'dark' | 'system';     // Color scheme
  radius: number;               // Border radius size (rem)
};
```

## Theme Application Process

The theme is applied through CSS variables and class names:

### CSS Variables

- `--primary`: Sets the primary color
- `--radius`: Controls border radius

### CSS Classes

- `theme-professional`, `theme-tint`, `theme-vibrant`: Control design variants
- `dark`: Toggles dark mode styles

## Default Theme

```typescript
const defaultTheme = {
  primary: '#e11d48',
  variant: 'vibrant',
  appearance: 'system',
  radius: 0.5,
};
```

## Using theme.json

The ThemeContext tries to load theme settings from a `theme.json` file at the root level. This allows distributing a default theme with your application. If not found, it falls back to the default theme defined in the code.

Sample `theme.json`:

```json
{
  "primary": "#0070f3",
  "variant": "professional",
  "appearance": "system",
  "radius": 0.75
}
```

## System Preference Detection

The theme handler detects the system's color scheme preference:

```typescript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (theme.appearance === 'system') {
  document.documentElement.classList.toggle('dark', prefersDark);
} else {
  document.documentElement.classList.toggle('dark', theme.appearance === 'dark');
}
```

## Theme Persistence

Theme preferences are saved to localStorage:

```typescript
const setTheme = (newTheme: Partial<Theme>) => {
  const updatedTheme = { ...theme, ...newTheme };
  setThemeState(updatedTheme);
  localStorage.setItem('app-theme', JSON.stringify(updatedTheme));
};
```

## Browser Compatibility

The theme handler is designed to work in all modern browsers, with careful attention to:
- Local storage access
- Media query support
- CSS variable implementation
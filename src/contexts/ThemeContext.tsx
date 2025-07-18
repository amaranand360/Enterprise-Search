'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check for saved theme preference or default to light theme
    const savedTheme = localStorage.getItem('theme') as Theme | null;

    const initialTheme = savedTheme || 'light';
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // Only listen for system theme changes if no preference is saved
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-change if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    // Only add listener if no saved preference
    if (!savedTheme) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1f2937' : '#ffffff');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme-aware utility functions
export const getThemeColors = (theme: Theme) => ({
  // Background colors
  bg: {
    primary: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
    secondary: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50',
    tertiary: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100',
    card: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
    hover: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    active: theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200',
  },
  
  // Text colors
  text: {
    primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
    secondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
    tertiary: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    muted: theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
    inverse: theme === 'dark' ? 'text-gray-900' : 'text-white',
  },
  
  // Border colors
  border: {
    primary: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
    secondary: theme === 'dark' ? 'border-gray-600' : 'border-gray-300',
    focus: 'border-blue-500',
  },
  
  // Ring colors for focus states
  ring: {
    focus: 'ring-blue-500',
  },
  
  // Status colors (work in both themes)
  status: {
    success: theme === 'dark' ? 'text-green-400' : 'text-green-600',
    warning: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
    error: theme === 'dark' ? 'text-red-400' : 'text-red-600',
    info: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
  },
  
  // Button variants
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: theme === 'dark' 
      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    ghost: theme === 'dark'
      ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900',
    outline: theme === 'dark'
      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50',
  }
});

// CSS custom properties for dynamic theming
export const themeVariables = {
  light: {
    '--color-bg-primary': '255 255 255',
    '--color-bg-secondary': '249 250 251',
    '--color-text-primary': '17 24 39',
    '--color-text-secondary': '75 85 99',
    '--color-border-primary': '229 231 235',
  },
  dark: {
    '--color-bg-primary': '17 24 39',
    '--color-bg-secondary': '31 41 55',
    '--color-text-primary': '255 255 255',
    '--color-text-secondary': '209 213 219',
    '--color-border-primary': '55 65 81',
  }
};

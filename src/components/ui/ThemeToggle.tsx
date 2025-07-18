'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from './Button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 transition-colors duration-200"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative">
        {theme === 'light' ? (
          <Moon className="h-4 w-4 transition-transform duration-200 rotate-0" />
        ) : (
          <Sun className="h-4 w-4 transition-transform duration-200 rotate-0" />
        )}
      </div>
    </Button>
  );
}

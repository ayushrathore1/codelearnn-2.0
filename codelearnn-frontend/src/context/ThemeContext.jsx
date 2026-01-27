import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Theme state: 'dark-neon', 'light-aurora', 'midnight-pro', or 'system'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark-neon';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all previous theme attributes
    root.removeAttribute('data-theme');
    
    // Apply new theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark-neon' 
        : 'light-aurora';
      root.setAttribute('data-theme', systemTheme);
    } else {
      root.setAttribute('data-theme', theme);
    }
    
    // Persist to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    themes: [
      { id: 'dark-neon', name: 'Dark Neon', icon: '🌑' },
      { id: 'light-aurora', name: 'Light Aurora', icon: '☀️' },
      { id: 'midnight-pro', name: 'Midnight Pro', icon: '🌌' },
      // { id: 'system', name: 'System', icon: '🖥' } // Optional
    ]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

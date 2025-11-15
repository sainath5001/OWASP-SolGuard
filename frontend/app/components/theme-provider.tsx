"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  mounted: boolean;
};

// Default context value to ensure context is always provided
const defaultContextValue: ThemeContextType = {
  theme: "system",
  resolvedTheme: "dark",
  setTheme: () => {
    // No-op function as placeholder
  },
  mounted: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "dark"; // Default to dark on server
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    // Initialize with system theme on first render
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored) {
        return resolveTheme(stored);
      }
    }
    return getSystemTheme();
  });
  const [mounted, setMounted] = useState(false);

  const updateTheme = useCallback((newTheme: Theme) => {
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    const resolved = resolveTheme(newTheme);
    
    setResolvedTheme(resolved);
    
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme);
      }
      updateTheme(newTheme);
    },
    [updateTheme]
  );

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Apply stored theme or system preference
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      const initialTheme = stored || "system";
      setThemeState(initialTheme);
      updateTheme(initialTheme);
    }
  }, [updateTheme]);

  // Update theme when theme state changes (after mount)
  useEffect(() => {
    if (mounted) {
      updateTheme(theme);
    }
  }, [theme, mounted, updateTheme]);

  // Listen for system theme changes when theme is set to "system"
  useEffect(() => {
    if (!mounted || theme !== "system" || typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      updateTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted, updateTheme]);

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    mounted,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}


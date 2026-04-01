"use client";

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function applyTheme() {
      const stored = localStorage.getItem('user');
      // Try to get theme from preferences cache
      const cachedTheme = localStorage.getItem('esmp_theme') || 'light';
      applyThemeClass(cachedTheme);

      // Also fetch from API if logged in
      const token = localStorage.getItem('token');
      if (!token) return;

      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/settings/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(prefs => {
          if (prefs?.theme) {
            localStorage.setItem('esmp_theme', prefs.theme);
            applyThemeClass(prefs.theme);
          }
        })
        .catch(() => {});
    }

    applyTheme();

    // Listen for theme changes dispatched by settings page
    window.addEventListener('esmp-theme-change', (e: any) => {
      applyThemeClass(e.detail);
    });

    return () => window.removeEventListener('esmp-theme-change', () => {});
  }, []);

  return <>{children}</>;
}

export function applyThemeClass(theme: string) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
}

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
type Theme = 'light' | 'dark';
const key = 'fim-grok-preview-theme-v1';
function initial(): Theme {
  try { const saved = localStorage.getItem(key); if (saved === 'light' || saved === 'dark') return saved; } catch { /* device storage unavailable */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function ThemeToggle() {
 const [theme, setTheme] = useState<Theme>(initial);
 useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem(key, theme); } catch { /* theme still works without persistence */ } }, [theme]);
 return <button type="button" className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-fg hover:bg-surface-raised" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`${theme === 'dark' ? 'Light' : 'Dark'} mode`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}</button>;
}

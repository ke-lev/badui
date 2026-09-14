// Kept out of theme.tsx: that file is a client module, and the root layout
// (a server component) needs this as a plain string, not a client reference.

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "badui:theme";

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

/**
 * Runs in <head> before first paint. Only a stored choice is written to
 * data-theme; with none, :root's color-scheme follows the system and keeps
 * following it when the system setting changes.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

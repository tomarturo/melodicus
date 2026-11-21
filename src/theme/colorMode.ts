import { useCallback, useEffect, useState } from 'react';
import { localStorageManager, useColorMode } from '@chakra-ui/react';

// Chakra exports the storage manager's shape only through its built-in managers.
type StorageManager = typeof localStorageManager;

export type ColorModePreference = 'light' | 'dark' | 'system';

// Read before React loads by the inline script in index.html; keep in sync.
export const COLOR_MODE_KEY = 'melodicus:v1:color-mode';

// The frame color per mode, for the browser's toolbar (theme-color meta).
const THEME_COLOR = { light: '#E9E8E4', dark: '#141517' } as const;

export function readColorModePreference(): ColorModePreference {
  try {
    const stored = localStorage.getItem(COLOR_MODE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Hands Chakra the saved preference, including 'system'. Chakra's own manager
 * stores the resolved mode instead, which would pin a "system" visitor to
 * whatever their system used on the first visit. Writes go through
 * useColorModePreference, so set() has nothing to do.
 */
export const colorModeManager: StorageManager = {
  type: 'localStorage',
  ssr: false,
  // Nothing saved means "system": Chakra then falls back to initialColorMode,
  // which is 'system'.
  get: () => {
    const preference = readColorModePreference();
    return preference === 'system' ? undefined : preference;
  },
  set: () => {},
};

/** The light/dark/system setting, applied through Chakra and following the system when set to it. */
export function useColorModePreference() {
  const { colorMode, setColorMode } = useColorMode();
  const [preference, setPreferenceState] = useState(readColorModePreference);

  const setPreference = useCallback(
    (next: ColorModePreference) => {
      try {
        if (next === 'system') localStorage.removeItem(COLOR_MODE_KEY);
        else localStorage.setItem(COLOR_MODE_KEY, next);
      } catch {
        // Private browsing: the choice still applies for this visit.
      }
      setPreferenceState(next);
      setColorMode(next);
    },
    [setColorMode],
  );

  // While following the system, switch when the system does.
  useEffect(() => {
    if (preference !== 'system') return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setColorMode('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference, setColorMode]);

  // Keep the browser toolbar color in step.
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[colorMode]);
  }, [colorMode]);

  return { preference, colorMode, setPreference };
}

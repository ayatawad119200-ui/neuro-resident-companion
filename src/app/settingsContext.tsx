import { createContext, useContext } from 'react';
import type { AppSettings } from '../db/db';

export interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useAppSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('useAppSettings must be used inside SettingsContext.Provider');
  }
  return value;
}

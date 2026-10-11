import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config';
import { dataApi } from './supabase';

export interface AppSettings {
  upiId: string;
  payeeName: string;
  whatsappNumber: string;
  qrImageUrl?: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  upiId: APP_CONFIG.upi.id || '9718936211@ibl',
  payeeName: APP_CONFIG.upi.payeeName || 'PromptBazaar',
  whatsappNumber: APP_CONFIG.whatsapp.number || '+919718936211',
  qrImageUrl: '',
};

let cachedSettings: AppSettings = { ...DEFAULT_APP_SETTINGS };

export function getAppSettings(): AppSettings {
  return cachedSettings;
}

/**
 * Saves payment QR, UPI ID, and WhatsApp directly into Supabase table app_settings (id = 'default').
 * Disallows base64 text for qrImageUrl.
 */
export async function saveAppSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  if (newSettings.qrImageUrl && newSettings.qrImageUrl.startsWith('data:')) {
    throw new Error('Base64 image text is not allowed. Upload the QR to the Supabase "media" bucket first.');
  }

  const updated: AppSettings = {
    ...cachedSettings,
    ...newSettings,
  };

  // Directly save into Supabase table app_settings (id = 'default')
  await dataApi.saveAppSettingsToDb(updated);

  cachedSettings = updated;
  window.dispatchEvent(new CustomEvent('promptbazaar_settings_updated', { detail: updated }));

  return updated;
}

/**
 * React hook to consume settings fetched from Supabase table app_settings (id = 'default').
 * Ensures everyone sees the exact same QR and payment details on Unlock screen.
 */
export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>(cachedSettings);

  useEffect(() => {
    let isMounted = true;

    // Fetch single source of truth from Supabase table app_settings (id = 'default')
    dataApi.getAppSettingsFromDb().then((dbSettings) => {
      if (dbSettings && isMounted) {
        cachedSettings = dbSettings;
        setSettings(dbSettings);
      }
    });

    const handleUpdate = (e: any) => {
      if (e?.detail) {
        cachedSettings = e.detail;
        setSettings(e.detail);
      } else {
        dataApi.getAppSettingsFromDb().then((dbSettings) => {
          if (dbSettings && isMounted) {
            cachedSettings = dbSettings;
            setSettings(dbSettings);
          }
        });
      }
    };

    window.addEventListener('promptbazaar_settings_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('promptbazaar_settings_updated', handleUpdate);
    };
  }, []);

  return settings;
}

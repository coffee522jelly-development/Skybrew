import { load } from '@tauri-apps/plugin-store';
import { agent } from '$lib/api';

export type Theme = 'light' | 'dark' | 'system';

export const appState = $state({
  theme: 'system' as Theme,
  fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
  fontSize: 16,
  primaryColor: '#2563eb', // Default blue
  session: null as any | null,
});

let store: any = null;

export async function initStore() {
  if (typeof window !== 'undefined') {
    // Only run in client
    try {
      store = await load('settings.json', { autoSave: true });
      const savedTheme = await store.get('theme');
      const savedFontFamily = await store.get('fontFamily');
      const savedFontSize = await store.get('fontSize');
      const savedPrimaryColor = await store.get('primaryColor');
      const savedSession = await store.get('session');

      if (savedTheme) appState.theme = savedTheme as Theme;
      if (savedFontFamily) appState.fontFamily = savedFontFamily as string;
      if (savedFontSize) appState.fontSize = savedFontSize as number;
      if (savedPrimaryColor) appState.primaryColor = savedPrimaryColor as string;
      if (savedSession) {
        try {
           await agent.resumeSession(savedSession as any);
           appState.session = savedSession;
        } catch (resumeErr) {
           console.error("Failed to resume session", resumeErr);
           appState.session = null;
        }
      }
    } catch (e) {
      console.error("Failed to load store", e);
    }
  }
}

export async function updateSetting<K extends keyof typeof appState>(key: K, value: typeof appState[K]) {
  appState[key] = value;
  if (store) {
    try {
      await store.set(key, value);
    } catch (e) {
      console.error(`Failed to save ${key} to store`, e);
    }
  }
}

import { load } from '@tauri-apps/plugin-store';
import { agent } from '$lib/api';

export type Theme = 'light' | 'dark' | 'system';

export interface AccountSession {
  did: string;
  handle: string;
  email?: string;
  accessJwt: string;
  refreshJwt: string;
  active?: boolean;
}

export interface PostDraft {
  id: string;
  text: string;
  images: { dataUrl: string; alt: string }[];
  updatedAt: string;
}

export const appState = $state({
  theme: 'system' as Theme,
  fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
  fontSize: 14,
  primaryColor: '#2563eb', // Default blue
  highlightColor: '#f97316', // Default orange
  session: null as any | null,
  savedAccounts: [] as AccountSession[],
  drafts: [] as PostDraft[],
});

let store: any = null;

export async function initStore() {
  if (typeof window !== 'undefined') {
    // Only run in client
    try {
      if ((window as any).__TAURI_INTERNALS__?.invoke) {
        store = await load('settings.json', { autoSave: true });
      } else {
        console.warn("Tauri environment not detected, using localStorage mock.");
        store = {
          get: async (k: string) => {
            const v = localStorage.getItem('skybrew_' + k);
            return v ? JSON.parse(v) : null;
          },
          set: async (k: string, v: any) => {
            localStorage.setItem('skybrew_' + k, JSON.stringify(v));
          }
        };
      }
      const savedTheme = await store.get('theme');
      const savedFontFamily = await store.get('fontFamily');
      const savedFontSize = await store.get('fontSize');
      const savedPrimaryColor = await store.get('primaryColor');
      const savedHighlightColor = await store.get('highlightColor');
      const savedSession = await store.get('session');
      const savedAccounts = await store.get('savedAccounts');
      const savedDrafts = await store.get('drafts');

      if (savedTheme) appState.theme = savedTheme as Theme;
      if (savedFontFamily) appState.fontFamily = savedFontFamily as string;
      if (savedFontSize) appState.fontSize = savedFontSize as number;
      if (savedPrimaryColor) appState.primaryColor = savedPrimaryColor as string;
      if (savedHighlightColor) appState.highlightColor = savedHighlightColor as string;
      if (Array.isArray(savedAccounts)) appState.savedAccounts = savedAccounts;
      if (Array.isArray(savedDrafts)) appState.drafts = savedDrafts;

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

export async function addOrUpdateAccountSession(sessionData: any) {
  const account: AccountSession = {
    did: sessionData.did,
    handle: sessionData.handle,
    email: sessionData.email,
    accessJwt: sessionData.accessJwt,
    refreshJwt: sessionData.refreshJwt,
  };

  const existingIdx = appState.savedAccounts.findIndex(a => a.did === account.did);
  let updatedList = [...appState.savedAccounts];
  if (existingIdx >= 0) {
    updatedList[existingIdx] = account;
  } else {
    updatedList.push(account);
  }

  await updateSetting('savedAccounts', updatedList);
  await updateSetting('session', sessionData);
}

export async function switchAccount(did: string) {
  const targetAcc = appState.savedAccounts.find(a => a.did === did);
  if (!targetAcc) return false;

  try {
    const sessionToResume = {
      did: targetAcc.did,
      handle: targetAcc.handle,
      email: targetAcc.email,
      accessJwt: targetAcc.accessJwt,
      refreshJwt: targetAcc.refreshJwt,
      active: true,
    };
    await agent.resumeSession(sessionToResume);
    await updateSetting('session', sessionToResume);
    return true;
  } catch (err) {
    console.error("Failed to switch account:", err);
    return false;
  }
}

export async function removeAccountSession(did: string) {
  const updatedList = appState.savedAccounts.filter(a => a.did !== did);
  await updateSetting('savedAccounts', updatedList);
  if (appState.session?.did === did) {
    if (updatedList.length > 0) {
      await switchAccount(updatedList[0].did);
    } else {
      appState.session = null;
      await updateSetting('session', null);
    }
  }
}

export async function saveDraft(draft: Omit<PostDraft, 'updatedAt'>) {
  const newDraft: PostDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  const existingIdx = appState.drafts.findIndex(d => d.id === draft.id);
  let updatedDrafts = [...appState.drafts];
  if (existingIdx >= 0) {
    updatedDrafts[existingIdx] = newDraft;
  } else {
    updatedDrafts.unshift(newDraft);
  }
  await updateSetting('drafts', updatedDrafts);
}

export async function deleteDraft(id: string) {
  const updatedDrafts = appState.drafts.filter(d => d.id !== id);
  await updateSetting('drafts', updatedDrafts);
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

import { CareerState } from '../core/types';

const DB_NAME = 'ArgonF1SimulatorDB';
const DB_VERSION = 1;
const STORE_SAVES = 'career_saves';

export interface SaveSlotSummary {
  saveId: string;
  saveName: string;
  lastSavedIso: string;
  gameMode: string;
  seasonYear: number;
  currentWeek: number;
  teamName: string;
  budget: number;
  isAutoSave: boolean;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SAVES)) {
        db.createObjectStore(STORE_SAVES, { keyPath: 'saveId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function validateCareerState(data: unknown): data is CareerState {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Partial<CareerState>;
  return (
    typeof obj.saveId === 'string' &&
    typeof obj.seasonYear === 'number' &&
    typeof obj.playerTeamId === 'string' &&
    Array.isArray(obj.teams) &&
    Array.isArray(obj.drivers) &&
    Array.isArray(obj.calendar)
  );
}

export async function saveCareerToDb(state: CareerState, isAutoSave = false): Promise<void> {
  const db = await openDatabase();
  const updated: CareerState = {
    ...state,
    saveId: isAutoSave ? 'autosave_slot' : state.saveId,
    saveName: isAutoSave ? `[Otomatik Kayıt] ${state.saveName.replace(/^\[Otomatik Kayıt\]\s*/, '')}` : state.saveName,
    lastSavedIso: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SAVES, 'readwrite');
    const store = tx.objectStore(STORE_SAVES);
    store.put(updated);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadCareerFromDb(saveId: string): Promise<CareerState | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SAVES, 'readonly');
    const store = tx.objectStore(STORE_SAVES);
    const req = store.get(saveId);
    req.onsuccess = () => {
      db.close();
      const res = req.result;
      if (validateCareerState(res)) {
        resolve(res);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function listSaveSlots(): Promise<SaveSlotSummary[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SAVES, 'readonly');
    const store = tx.objectStore(STORE_SAVES);
    const req = store.getAll();
    req.onsuccess = () => {
      db.close();
      const rawList: unknown[] = req.result || [];
      const summaries: SaveSlotSummary[] = [];
      for (const item of rawList) {
        if (validateCareerState(item)) {
          const playerTeam = item.teams.find((t) => t.id === item.playerTeamId);
          summaries.push({
            saveId: item.saveId,
            saveName: item.saveName,
            lastSavedIso: item.lastSavedIso,
            gameMode: item.gameMode,
            seasonYear: item.seasonYear,
            currentWeek: item.currentWeek,
            teamName: playerTeam ? playerTeam.name : 'Bilinmeyen Takım',
            budget: playerTeam ? playerTeam.budget : 0,
            isAutoSave: item.saveId === 'autosave_slot',
          });
        }
      }
      summaries.sort((a, b) => b.lastSavedIso.localeCompare(a.lastSavedIso));
      resolve(summaries);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function deleteSaveSlot(saveId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SAVES, 'readwrite');
    const store = tx.objectStore(STORE_SAVES);
    store.delete(saveId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function exportCareerBackupJson(state: CareerState): void {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = state.saveName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  a.href = url;
  a.download = `argon_f1_${safeName}_${state.seasonYear}_w${state.currentWeek}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importCareerBackupFile(file: File): Promise<CareerState> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Yedek dosyası geçerli bir JSON formatında değil.');
  }
  if (!validateCareerState(parsed)) {
    throw new Error('Yedek dosyası bozuk veya eksik ARGON F1 veri yapısına sahip.');
  }
  const importedState: CareerState = {
    ...parsed,
    saveId: `imported_${Date.now()}`,
    lastSavedIso: new Date().toISOString(),
  };
  await saveCareerToDb(importedState, false);
  return importedState;
}

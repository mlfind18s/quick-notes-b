// Notes live in IndexedDB (committed to disk when the transaction completes); the unsent
// draft lives in localStorage. Keys are fixed on purpose: two installed copies of this demo
// use identical keys, and React Host must keep their data apart by origin.

export interface Note {
  id: string;
  text: string;
  createdAt: number;
}

const DB_NAME = 'quick-notes';
const STORE = 'notes';
const DRAFT_KEY = 'quick-notes:draft';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listNotes(): Promise<Note[]> {
  const db = await openDb();
  const notes = await request(db.transaction(STORE, 'readonly').objectStore(STORE).getAll() as IDBRequest<Note[]>);
  return notes.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addNote(text: string): Promise<Note> {
  const note: Note = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, text, createdAt: Date.now() };
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).add(note);
  await transactionDone(tx);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await transactionDone(tx);
}

export function loadDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveDraft(text: string): void {
  try {
    if (text) localStorage.setItem(DRAFT_KEY, text);
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage may be unavailable (quota, private mode); the draft is best-effort.
  }
}

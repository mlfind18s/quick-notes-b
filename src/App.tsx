import { useEffect, useRef, useState } from 'react';
import { addNote, deleteNote, listNotes, loadDraft, saveDraft, type Note } from './storage';

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeStyle: 'short' });

function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

export function App() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [draft, setDraft] = useState(loadDraft);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const online = useOnline();

  useEffect(() => {
    listNotes().then(setNotes, (e: unknown) => setError(`Не вдалося прочитати нотатки: ${String(e)}`));
  }, []);

  function changeDraft(text: string) {
    setDraft(text);
    saveDraft(text);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    try {
      const note = await addNote(text);
      setNotes((current) => [note, ...(current ?? [])]);
      changeDraft('');
      input.current?.focus();
    } catch (e) {
      setError(`Не вдалося зберегти нотатку: ${String(e)}`);
    }
  }

  async function remove(id: string) {
    try {
      await deleteNote(id);
      setNotes((current) => (current ?? []).filter((n) => n.id !== id));
    } catch (e) {
      setError(`Не вдалося видалити нотатку: ${String(e)}`);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <h1>{__APP_NAME__}</h1>
        <span className="version" data-testid="version">v{__APP_VERSION__}</span>
      </header>

      <form className="composer" onSubmit={submit}>
        <label htmlFor="draft" className="visually-hidden">
          Нова нотатка
        </label>
        <textarea
          id="draft"
          ref={input}
          value={draft}
          placeholder="Нова нотатка…"
          rows={3}
          onChange={(e) => changeDraft(e.target.value)}
        />
        <button type="submit" disabled={!draft.trim()}>
          Додати
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {notes === null ? (
        <p className="muted">Завантаження…</p>
      ) : notes.length === 0 ? (
        <p className="muted">Нотаток ще немає. Вони зберігаються лише на цьому пристрої.</p>
      ) : (
        <ul className="notes" data-testid="notes">
          {notes.map((note) => (
            <li key={note.id}>
              <p>{note.text}</p>
              <div className="meta">
                <time dateTime={new Date(note.createdAt).toISOString()}>{dateFormat.format(note.createdAt)}</time>
                <button type="button" className="link" onClick={() => remove(note.id)} aria-label="Видалити нотатку">
                  Видалити
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="footer">
        <span>{online ? 'Онлайн' : 'Офлайн'}</span>
        <span>Нотаток: {notes?.length ?? '…'}</span>
        <span className="origin">{location.origin}</span>
      </footer>
    </main>
  );
}

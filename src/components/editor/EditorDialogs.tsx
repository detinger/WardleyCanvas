'use client';

// Section 15.2 deletion preview and Section 6.5 keyboard shortcut reference.

import * as React from 'react';
import { X } from 'lucide-react';
import DialogOverlay from './DialogOverlay';
import { DeletionImpactItem } from '@/domain/editing';
import { Id } from '@/domain/types';

/** Lets any editor control route deletions through the confirmation flow. */
export const DeleteRequestContext = React.createContext<((ids: Id[]) => void) | null>(null);

const panel: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  boxShadow: 'var(--shadow-lg)',
  width: 'min(480px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};
const header: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' };
const title: React.CSSProperties = { flex: 1, margin: 0, fontSize: 15, fontWeight: 650, color: 'var(--text)' };
const closeBtn: React.CSSProperties = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)' };
const button: React.CSSProperties = { height: 34, padding: '0 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 550 };

export function DeleteConfirmDialog({
  names,
  impact,
  onConfirm,
  onCancel,
}: {
  names: string[];
  impact: DeletionImpactItem[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const what = names.length === 1 ? `“${names[0]}”` : `${names.length} elements`;
  return (
    <DialogOverlay labelledBy="delete-dialog-title" onClose={onCancel}>
      <div style={panel}>
        <div style={header}>
          <h2 id="delete-dialog-title" style={title}>Delete {what}?</h2>
          <button onClick={onCancel} aria-label="Close" style={closeBtn}><X size={16} /></button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', fontSize: 13, color: 'var(--text)' }}>
          <p style={{ margin: '0 0 8px' }}>This will also remove:</p>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {impact.map((item, i) => <li key={i}>{item.description}</li>)}
          </ul>
          <p style={{ margin: '12px 0 0', color: 'var(--text-muted)' }}>You can undo this afterwards.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={onCancel} style={button}>Cancel</button>
          <button onClick={onConfirm} style={{ ...button, borderColor: 'var(--error)', color: 'var(--error)' }}>Delete</button>
        </div>
      </div>
    </DialogOverlay>
  );
}

export function SaveVersionDialog({ onSave, onCancel }: { onSave: (note: string) => void; onCancel: () => void }) {
  const [note, setNote] = React.useState('');
  return (
    <DialogOverlay labelledBy="save-dialog-title" onClose={onCancel}>
      <form
        style={panel}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(note.trim());
        }}
      >
        <div style={header}>
          <h2 id="save-dialog-title" style={title}>Save version</h2>
          <button type="button" onClick={onCancel} aria-label="Close" style={closeBtn}><X size={16} /></button>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="version-note" style={{ fontSize: 13, fontWeight: 550, color: 'var(--text)' }}>What changed? (optional)</label>
          <input
            id="version-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Moved hosting to commodity after supplier review"
            style={{ height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)', fontSize: 13 }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Saved versions never change. You can restore any of them later from Version history.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onCancel} style={button}>Cancel</button>
          <button type="submit" style={{ ...button, background: 'var(--primary)', borderColor: 'var(--primary)', color: 'var(--text-on-primary)' }}>Save version</button>
        </div>
      </form>
    </DialogOverlay>
  );
}

const SHORTCUTS: [string, string][] = [
  ['A', 'Add an anchor (user) and select it'],
  ['C', 'Add a component and select it'],
  ['S / H', 'Select tool / pan tool'],
  ['Enter or Space', 'Select the focused element (in the dependency tool: pick an endpoint)'],
  ['Shift + Enter', 'Add the focused element to the selection'],
  ['Arrow keys', 'Nudge the selection (Shift for larger steps)'],
  ['⌘/Ctrl + D', 'Duplicate the selection'],
  ['Delete / Backspace', 'Delete the selection (asks first if other parts of the map depend on it)'],
  ['⌘/Ctrl + Z', 'Undo'],
  ['⌘/Ctrl + Shift + Z or ⌘/Ctrl + Y', 'Redo'],
  ['F', 'Fit the map to the view'],
  ['= / -', 'Zoom in / out'],
  ['Escape', 'Clear the selection and return to the select tool'],
  ['?', 'Show this list'],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogOverlay labelledBy="shortcuts-dialog-title" onClose={onClose}>
      <div style={panel}>
        <div style={header}>
          <h2 id="shortcuts-dialog-title" style={title}>Keyboard shortcuts</h2>
          <button onClick={onClose} aria-label="Close" style={closeBtn}><X size={16} /></button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left', padding: '6px 8px', fontSize: 12, color: 'var(--text-subtle)' }}>Keys</th>
                <th scope="col" style={{ textAlign: 'left', padding: '6px 8px', fontSize: 12, color: 'var(--text-subtle)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUTS.map(([keys, action]) => (
                <tr key={keys} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', color: 'var(--text)' }}>{keys}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--text)' }}>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '12px 0 0' }}>
            Every action is also available without a pointer: the Outline lists all elements and the inspector edits positions numerically.
          </p>
        </div>
      </div>
    </DialogOverlay>
  );
}

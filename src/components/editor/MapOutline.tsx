'use client';

// Section 6.5: non-canvas outline of elements and dependencies, synchronised
// with selection, so the map never depends on SVG geometry alone.

import * as React from 'react';
import { WardleyMap, Id } from '@/domain/types';

function stage(map: WardleyMap, evolution: number): string {
  const [b0, b1, b2] = map.stageBoundaries;
  return map.evolutionLabels[evolution < b0 ? 0 : evolution < b1 ? 1 : evolution < b2 ? 2 : 3];
}

export default function MapOutline({
  map,
  selectedIds,
  onSelect,
}: {
  map: WardleyMap;
  selectedIds: Id[];
  onSelect: (id: Id) => void;
}) {
  const names = new Map(map.elements.map((e) => [e.id, e.name]));
  // Most visible first: reads top-down like the map
  const elements = [...map.elements].sort((a, b) => b.visibility - a.visibility || a.name.localeCompare(b.name));

  return (
    <nav aria-label="Map outline" className="editor-outline">
      <h2 style={{ fontSize: 12, fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', margin: '0 0 8px' }}>
        Outline · {map.elements.length} elements, {map.dependencies.length} dependencies
      </h2>
      {elements.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>No elements yet. Press A to add an anchor.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {elements.map((el) => {
            const deps = map.dependencies.filter((d) => d.fromId === el.id);
            const selected = selectedIds.includes(el.id);
            return (
              <li key={el.id}>
                <button
                  type="button"
                  onClick={() => onSelect(el.id)}
                  aria-current={selected ? 'true' : undefined}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: `1px solid ${selected ? 'var(--primary)' : 'transparent'}`,
                    background: selected ? 'var(--primary-soft)' : 'none',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontWeight: 550 }}>{el.name}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>
                    {el.kind} · {stage(map, el.evolution)} · visibility {el.visibility.toFixed(2)}
                    {el.inertia ? ' · inertia' : ''}
                  </span>
                </button>
                {deps.length > 0 && (
                  <ul aria-label={`${el.name} depends on`} style={{ listStyle: 'none', margin: '2px 0 0 12px', padding: 0 }}>
                    {deps.map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(d.id)}
                          aria-current={selectedIds.includes(d.id) ? 'true' : undefined}
                          style={{ background: 'none', border: 'none', padding: '2px 6px', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}
                        >
                          {d.kind === 'flow' ? 'flows to' : 'depends on'} {names.get(d.toId) ?? '?'}
                          {d.label ? ` (${d.label})` : ''}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}

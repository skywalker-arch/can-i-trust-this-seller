"use client";
import React from "react";

export default function Checklist({ items }: { items: string[] }) {
  const key = React.useMemo(() => `investigation_checklist:${items.join("||")}`, [items]);

  const [state, setState] = React.useState<boolean[]>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        if (Array.isArray(parsed) && parsed.length === items.length) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return items.map(() => false);
  });

  React.useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [key, state]);

  function toggle(i: number) {
    setState((s) => {
      const copy = [...s];
      copy[i] = !copy[i];
      return copy;
    });
  }

  if (!items || items.length === 0) return <div className="text-sm muted mt-2">No checklist items.</div>;

  return (
    <ul className="mt-3 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3">
          <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={!!state[i]} onChange={() => toggle(i)} className="focus-visible:ring-2" />
            <span className={`text-sm ${state[i] ? 'text-foreground line-through' : 'text-muted'}`}>{it}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

"use client";
import React from "react";

export default function Checklist({ items }: { items: string[] }) {
  const [state, setState] = React.useState<boolean[]>(() => items.map(() => false));

  React.useEffect(() => {
    setState(items.map(() => false));
  }, [items.join("||")]);

  function toggle(i: number) {
    setState((s) => {
      const copy = [...s];
      copy[i] = !copy[i];
      try {
        sessionStorage.setItem("investigation_checklist", JSON.stringify(copy));
      } catch (e) {
        // ignore
      }
      return copy;
    });
  }

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("investigation_checklist");
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        if (Array.isArray(parsed) && parsed.length === items.length) setState(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, []);

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

"use client";
import { useState } from "react";
import Form from "../components/seller-check/Form";
import Report from "../components/assessment/Report";
import { assess, simulate } from "../lib/risk/engine";
import type { SellerInput } from "../types/assessment";

export default function Home() {
  const [assessment, setAssessment] = useState<import("../types/assessment").Assessment | null>(null);
  const [lastInput, setLastInput] = useState<SellerInput | null>(null);
  const [simulated, setSimulated] = useState<{ label: string; result: import("../types/assessment").Assessment | null } | null>(null);
  const [running, setRunning] = useState(false);

  function handleRun(input: SellerInput) {
    setRunning(true);
    // small delay to show running state
    setTimeout(() => {
      const a = assess(input);
      setAssessment(a);
      setLastInput(input);
      setRunning(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 300);
  }

  function handleSimulate(changes: Partial<SellerInput>, label: string) {
    if (!lastInput) return;
    const result = simulate(lastInput, changes);
    setSimulated({ label, result });
  }

  function clearSimulation() {
    setSimulated(null);
  }

  return (
    <div className="min-h-screen bg-surface p-6 font-sans">
      <main className="container px-4">
        <header className="mb-6">
          <div className="card flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-foreground flex items-center justify-center text-background font-bold">CI</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Can I Trust This Seller?</h1>
              <p className="text-sm muted mt-1">Check the evidence before you send your money.</p>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Seller investigation</h2>
                  <p className="text-sm muted mt-1">Provide what you know — we'll surface the important signals.</p>
                </div>
                <div>
                  <button className="btn-ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Top</button>
                </div>
              </div>

              <div className="divider" />

              <Form onRun={handleRun} />

              {running && <div className="mt-3 text-sm muted">Running the check...</div>}
            </div>
          </div>

          <div>
            <div className="card">
              <Report assessment={assessment} simulated={simulated} onSimulate={handleSimulate} onClearSimulation={clearSimulation} lastInput={lastInput} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

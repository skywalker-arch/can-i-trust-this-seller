"use client";
import React from "react";
import { CheckCircle, AlertTriangle, ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import type { Assessment } from "../../types/assessment";
import type { SellerInput } from "../../types/assessment";

function PriceSlider({ lastInput, onSimulate }: { lastInput: SellerInput; onSimulate?: (changes: Record<string, any>, label: string) => void; }) {
  const seller = lastInput.sellerPrice as number;
  const market = lastInput.marketPrice as number;
  const [pct, setPct] = React.useState(0);

  function handleChange(v: number) {
    setPct(v);
    const newPrice = Math.round(seller + ((market - seller) * v) / 100);
    onSimulate?.({ sellerPrice: newPrice }, `Price moved ${v}% toward market`);
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <div className="text-sm muted">Seller: KSh {seller.toLocaleString()}</div>
        <div className="text-xs muted">→</div>
        <div className="text-sm muted">Market: KSh {market.toLocaleString()}</div>
      </div>
      <input
        aria-label="Price nudge slider"
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-full mt-3"
      />
      <div className="flex items-center justify-between text-sm muted mt-2">
        <div>Moved: {pct}%</div>
        <div>New: KSh {Math.round(seller + ((market - seller) * pct) / 100).toLocaleString()}</div>
      </div>
    </div>
  );
}

type Props = {
  assessment: Assessment | null;
  onSimulate?: (changes: Record<string, any>, label: string) => void;
  simulated?: { label: string; result: Assessment | null } | null;
  onClearSimulation?: () => void;
  lastInput?: any | null;
};

function RiskLevelPill({ level }: { level: Assessment["riskLevel"] }) {
  const map: Record<string, { cls: string; icon?: React.ReactNode }> = {
    "LOWER RISK": { cls: 'chip risk-low', icon: <CheckCircle size={16} /> },
    "MODERATE RISK": { cls: 'chip risk-moderate', icon: <AlertTriangle size={16} /> },
    "HIGH RISK": { cls: 'chip risk-high', icon: <AlertTriangle size={16} /> },
    "VERY HIGH RISK": { cls: 'chip risk-very-high', icon: <AlertTriangle size={16} color="#fff" /> },
  };
  const data = map[level];
  return (
    <span className={`${data.cls}`}>
      {data.icon}
      <span style={{ fontWeight: 600 }}>{level}</span>
    </span>
  );
}

export default function Report({ assessment, onSimulate, simulated, onClearSimulation, lastInput }: Props) {
  if (!assessment) {
    return (
      <section aria-live="polite" className="rounded border-dashed border p-6 bg-surface">
        <h3 className="text-lg font-semibold">NO INVESTIGATION YET</h3>
        <p className="mt-2 text-sm muted">Enter the seller and deal details to begin. The investigation panel will show evidence, score, and recommendations after you run the check.</p>
      </section>
    );
  }

  return (
    <section aria-live="polite" className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div style={{ flex: 1 }}>
          <div className="text-xs muted uppercase tracking-wide">INVESTIGATION COMPLETE</div>
          <div className="risk-card mt-2">
            <div>
              <div className="risk-score">{assessment.riskScore} / 100</div>
            </div>
            <div className="risk-legend">
              <div className="text-sm font-semibold">{assessment.riskLevel}</div>
              <div className="text-sm muted">{assessment.confidence} confidence</div>
              <div className="mt-2">
                <RiskLevelPill level={assessment.riskLevel} />
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div className="chip">Provided signals: <strong style={{ marginLeft:8 }}>{assessment.providedSignals}/{assessment.totalSignals}</strong></div>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-semibold">Summary</h3>
            <p className="text-sm muted mt-1">{assessment.warningSigns.length} warning sign{assessment.warningSigns.length === 1 ? '' : 's'} · {assessment.positiveSignals.length} positive signal{assessment.positiveSignals.length === 1 ? '' : 's'}.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4">
        {simulated && simulated.result && (
          <div className="rounded border p-4 bg-surface" role="region" aria-label="Simulation result">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">Simulation: {simulated.label}</div>
                <div className="text-sm text-muted">This is a hypothetical result based on a modified input.</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{simulated.result.riskScore} / 100</div>
                <div className="text-sm">{simulated.result.riskLevel}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-sm text-muted">Delta: {simulated.result.riskScore - assessment.riskScore >= 0 ? '+' : ''}{simulated.result.riskScore - assessment.riskScore}</div>
              <button onClick={() => onClearSimulation?.()} className="ml-auto text-sm rounded border px-3 py-1 focus:outline-none focus-visible:ring-2">Clear</button>
            </div>
          </div>
        )}

        {/* Price nudging slider */}
        {/** show only when both prices are known and numeric */}
        {assessment && lastInput && typeof lastInput.sellerPrice === 'number' && typeof lastInput.marketPrice === 'number' && (
          <div className="rounded border p-4" role="region" aria-label="Price simulation">
            <h4 className="font-semibold">Price simulation</h4>
            <p className="text-sm text-muted">Move the slider toward the market price to see how the risk score changes.</p>
            <PriceSlider lastInput={lastInput} onSimulate={onSimulate} />
          </div>
        )}
        {assessment.warningSigns.length > 0 && (
            <div className="rounded border p-4" role="region" aria-label="Warning signs">
            <h3 className="font-semibold">Warning signs</h3>
            <ul className="mt-3 space-y-3" role="list">
              {assessment.warningSigns.map((f) => (
                <li key={f.factor} className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">{f.title}</div>
                    <div className="text-sm text-muted">{f.reason}</div>
                  </div>
                  <div className="text-sm font-semibold text-rose-600">+{f.points}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {assessment.positiveSignals.length > 0 && (
            <div className="rounded border p-4 bg-surface" role="region" aria-label="Positive signals">
            <h3 className="font-semibold">Positive signals</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {assessment.positiveSignals.map((p) => (
                <li key={p.factor}>✓ {p.title}</li>
              ))}
            </ul>
          </div>
        )}

          <div className="rounded border p-4" role="region" aria-label="Recommendations">
          <h3 className="font-semibold">Recommendations</h3>
          <ul className="mt-3 list-disc pl-5 text-sm text-muted">
            {assessment.recommendations.length > 0 ? assessment.recommendations.map((r, i) => <li key={i}>{r}</li>) : <li>No specific recommendations.</li>}
          </ul>
        </div>

          <div className="rounded border p-4" role="region" aria-label="Questions to ask the seller">
          <h3 className="font-semibold">Questions to ask the seller</h3>
          <ul className="mt-3 list-none text-sm space-y-2">
            {assessment.questionsToAsk.length > 0 ? (
              assessment.questionsToAsk.map((q, i) => (
                <li key={i} className="rounded bg-surface p-2">{q}</li>
              ))
            ) : (
              <li className="text-muted">No specific questions identified.</li>
            )}
          </ul>
        </div>

          <div className="rounded border p-4" role="region" aria-label="Simulations">
          <h3 className="font-semibold">What would change the outcome?</h3>
          <p className="text-sm text-muted mt-2">Try small changes to see how the score would react (simulations only).</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button aria-label="Simulate pay on delivery" className="rounded border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2" onClick={() => onSimulate?.({ paymentMethod: "pay_on_delivery" }, "Pay on delivery")}>If pay-on-delivery</button>
            <button aria-label="Simulate add return policy" className="rounded border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2" onClick={() => onSimulate?.({ returnPolicy: true }, "Add return policy")}>If return policy existed</button>
            <button aria-label="Simulate no seller price" className="rounded border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2" onClick={() => onSimulate?.({ sellerPrice: undefined }, "Remove seller price")}>If no seller price</button>
          </div>
        </div>

        <div className="rounded border p-4" role="region" aria-label="Quick presets">
          <h4 className="font-semibold">Quick presets</h4>
          <p className="text-sm muted mt-2">One-click presets to explore common what-if scenarios.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button aria-label="Preset: marketplace checkout" className="btn-ghost" onClick={() => onSimulate?.({ paymentMethod: "marketplace_checkout" }, "Marketplace checkout")}>Marketplace checkout</button>
            <button aria-label="Preset: deposit plus balance" className="btn-ghost" onClick={() => onSimulate?.({ paymentMethod: "deposit_balance" }, "Deposit + balance on delivery")}>Deposit + balance</button>
            <button aria-label="Preset: full upfront" className="btn-ghost" onClick={() => onSimulate?.({ paymentMethod: "full_upfront" }, "Full payment upfront")}>Full upfront (risky)</button>
            <button aria-label="Preset: add return policy" className="btn-ghost" onClick={() => onSimulate?.({ returnPolicy: true }, "Add return policy")}>Add return policy</button>
            <button aria-label="Preset: seller photos" className="btn-ghost" onClick={() => onSimulate?.({ productPhotos: "own" }, "Seller's own photos")}>Seller's photos</button>
            <button aria-label="Preset: generic photos" className="btn-ghost" onClick={() => onSimulate?.({ productPhotos: "generic" }, "Generic photos")}>Generic photos</button>
          </div>
        </div>

        <div className="text-xs muted">This assessment does not confirm whether a seller is legitimate or fraudulent. It highlights signals worth investigating based on the information provided.</div>
      </div>
    </section>
  );
}

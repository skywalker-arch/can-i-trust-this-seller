import type { Assessment, RiskFactor, SellerInput } from "../../types/assessment";

const MAX_SCORE = 100;

export function calculatePriceGapPercent(market?: number | null, seller?: number | null) {
  if (!market || !seller || market <= 0) return null;
  const diff = market - seller;
  return (diff / market) * 100;
}

function clamp(v: number, a = 0, b = MAX_SCORE) {
  return Math.max(a, Math.min(b, v));
}

export function assess(input: SellerInput): Assessment {
  const factors: RiskFactor[] = [];
  const positives: RiskFactor[] = [];

  // Track provided signals
  const signalKeys = [
    input.sellerPrice != null,
    input.marketPrice != null,
    !!input.paymentMethod,
    !!input.accountAge,
    input.reviews != null,
    input.verified != null,
    input.physicalLocation != null,
    input.returnPolicy != null,
    !!input.productPhotos,
  ];
  let providedSignals = signalKeys.filter(Boolean).length;
  const totalSignals = signalKeys.length;
  // If market price is missing, reduce confidence because a key signal is absent
  if (!input.marketPrice) {
    providedSignals = Math.max(0, providedSignals - 1);
  }

  let score = 0;

  // Price gap (up to 25)
  const pricePercent = calculatePriceGapPercent(input.marketPrice, input.sellerPrice);
  if (pricePercent !== null) {
    let points = 0;
    const absPct = Math.abs(pricePercent);
    if (pricePercent < 0) {
      // seller above market -> small or no risk
      points = 0;
    } else {
      if (absPct < 5) points = 0;
      else if (absPct < 15) points = 7;
      else if (absPct < 30) points = 15;
      else points = 25;
    }
    if (points > 0) {
      factors.push({
        factor: "price_gap",
        points,
        severity: points >= 20 ? "high" : points >= 10 ? "medium" : "low",
        title: "Price gap",
        reason: `Seller price is ${pricePercent.toFixed(1)}% below the stated market price.`,
      });
      score += points;
    } else {
      positives.push({
        factor: "price_gap",
        points: 0,
        severity: "low",
        title: "Price gap",
        reason: `Price is within expected range (${pricePercent.toFixed(1)}%).`,
      });
    }
  }

  // Payment method (up to 20)
  if (input.paymentMethod) {
    const mapping: Record<string, { pts: number; title: string }> = {
      pay_on_delivery: { pts: 0, title: "Pay on delivery" },
      marketplace_checkout: { pts: 0, title: "Marketplace checkout" },
      deposit_balance: { pts: 10, title: "Deposit + balance on delivery" },
      full_upfront: { pts: 20, title: "Full payment upfront" },
    };
    const m = mapping[input.paymentMethod];
    if (m.pts > 0) {
      factors.push({
        factor: "payment",
        points: m.pts,
        severity: m.pts >= 15 ? "high" : "medium",
        title: m.title,
        reason: m.title === "Full payment upfront" ? "The seller requires payment before delivery." : "Partial payment before delivery increases risk.",
      });
      score += m.pts;
    } else {
      positives.push({
        factor: "payment",
        points: 0,
        severity: "low",
        title: m.title,
        reason: "Safer payment method compared with upfront-only options.",
      });
    }
  }

  // Account age (up to 15)
  if (input.accountAge) {
    const map: Record<string, { pts: number; title: string }> = {
      "<3m": { pts: 15, title: "Account under 3 months" },
      "3-12m": { pts: 10, title: "Account 3–12 months" },
      "1-3y": { pts: 5, title: "Account 1–3 years" },
      ">3y": { pts: 0, title: "Account over 3 years" },
    };
    const m = map[input.accountAge];
    if (m.pts > 0) {
      factors.push({
        factor: "account_age",
        points: m.pts,
        severity: m.pts >= 10 ? "high" : "medium",
        title: m.title,
        reason: `Short account history (${input.accountAge}). Newer accounts are less established.`,
      });
      score += m.pts;
    } else {
      positives.push({
        factor: "account_age",
        points: 0,
        severity: "low",
        title: m.title,
        reason: "Long account history reduces this particular risk.",
      });
    }
  }

  // Reviews (up to 15)
  if (typeof input.reviews === "number") {
    const r = input.reviews;
    let pts = 0;
    if (r < 0) pts = 0;
    else if (r <= 2) pts = 15;
    else if (r <= 10) pts = 10;
    else if (r <= 50) pts = 5;
    else pts = 0;
    if (pts > 0) {
      factors.push({
        factor: "reviews",
        points: pts,
        severity: pts >= 10 ? "high" : "medium",
        title: "Few reviews",
        reason: `Seller has ${r} review${r === 1 ? "" : "s"}. Fewer reviews reduce confidence in reputation.`,
      });
      score += pts;
    } else {
      positives.push({
        factor: "reviews",
        points: 0,
        severity: "low",
        title: "Established reviews",
        reason: `Seller has ${r} reviews, which indicates established activity.`,
      });
    }
  }

  // Return policy (up to 10)
  if (typeof input.returnPolicy === "boolean") {
    if (!input.returnPolicy) {
      const pts = 10;
      factors.push({
        factor: "return_policy",
        points: pts,
        severity: "medium",
        title: "No return policy",
        reason: "No return or refund policy was provided.",
      });
      score += pts;
    } else {
      positives.push({
        factor: "return_policy",
        points: 0,
        severity: "low",
        title: "Return policy provided",
        reason: "A stated return policy improves buyer protections.",
      });
    }
  }

  // Physical location (up to 5)
  if (typeof input.physicalLocation === "boolean") {
    if (!input.physicalLocation) {
      const pts = 5;
      factors.push({
        factor: "physical_location",
        points: pts,
        severity: "low",
        title: "No physical location",
        reason: "No verifiable physical location was provided.",
      });
      score += pts;
    } else {
      positives.push({
        factor: "physical_location",
        points: 0,
        severity: "low",
        title: "Physical location provided",
        reason: "Presence of a physical location increases confidence.",
      });
    }
  }

  // Verified (reduces risk slightly, up to -5)
  if (typeof input.verified === "boolean") {
    if (input.verified) {
      const pts = -5;
      positives.push({
        factor: "verified",
        points: pts,
        severity: "low",
        title: "Verified account",
        reason: "Platform verification is a positive signal but not decisive.",
      });
      score += pts;
    }
  }

  // Product photos (up to 5)
  if (input.productPhotos) {
    if (input.productPhotos === "generic") {
      const pts = 5;
      factors.push({
        factor: "photos",
        points: pts,
        severity: "low",
        title: "Generic or reused photos",
        reason: "Photos appear generic or reused; verify they match the actual item.",
      });
      score += pts;
    } else if (input.productPhotos === "not_sure") {
      const pts = 2;
      factors.push({
        factor: "photos",
        points: pts,
        severity: "low",
        title: "Uncertain photos",
        reason: "It's unclear whether the photos are seller-provided.",
      });
      score += pts;
    } else {
      positives.push({
        factor: "photos",
        points: 0,
        severity: "low",
        title: "Seller photos",
        reason: "Seller-provided photos are a positive signal when clearly original.",
      });
    }
  }

  // Ensure score is within 0..100
  score = clamp(Math.round(score));

  // Build recommendations and questions based on top factors
  const recommendations: string[] = [];
  const questions: string[] = [];

  const sorted = factors.slice().sort((a, b) => b.points - a.points);
  for (const f of sorted.slice(0, 5)) {
    if (f.factor === "payment") {
      recommendations.push("Ask whether you can use pay-on-delivery or marketplace checkout.");
      questions.push("Can I pay on delivery or via the marketplace checkout?");
    }
    if (f.factor === "price_gap") {
      recommendations.push("Confirm the item's condition and ask why the price is lower than market.");
      questions.push("Why is the price significantly lower than the typical market price?");
    }
    if (f.factor === "account_age") {
      recommendations.push("Request more seller history or references.");
      questions.push("Can you provide earlier listings or references from past buyers?");
    }
    if (f.factor === "return_policy") {
      recommendations.push("Ask for a written return or refund policy for this sale.");
      questions.push("What is your return or refund policy if the item is not as described?");
    }
    if (f.factor === "photos") {
      recommendations.push("Request recent, item-specific photos or serial numbers.");
      questions.push("Can you provide additional photos, serial numbers, or IMEI (for electronics)?");
    }
  }

  // Confidence
  let confidence: Assessment["confidence"]; // type error workaround with cast later
  const pct = providedSignals / totalSignals;
  if (pct >= 0.75) confidence = "HIGH";
  else if (pct >= 0.4) confidence = "MEDIUM";
  else confidence = "LOW";

  // If market price is missing, reduce confidence one step (e.g. HIGH -> MEDIUM)
  if (!input.marketPrice) {
    if (confidence === "HIGH") confidence = "MEDIUM";
    else if (confidence === "MEDIUM") confidence = "LOW";
  }

  // Risk level mapping
  let riskLevel: Assessment["riskLevel"]; // cast later
  if (score <= 24) riskLevel = "LOWER RISK";
  else if (score <= 49) riskLevel = "MODERATE RISK";
  else if (score <= 74) riskLevel = "HIGH RISK";
  else riskLevel = "VERY HIGH RISK";

  return {
    riskScore: score,
    riskLevel,
    confidence,
    providedSignals,
    totalSignals,
    warningSigns: factors,
    positiveSignals: positives,
    recommendations,
    questionsToAsk: questions,
  } as Assessment;
}

export function simulate(input: SellerInput, changes: Partial<SellerInput>) {
  const merged = { ...input, ...changes };
  return assess(merged);
}

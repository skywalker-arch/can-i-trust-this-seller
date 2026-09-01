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
  const warningSigns: RiskFactor[] = [];
  const positiveSignals: RiskFactor[] = [];
  const unknownSignals: RiskFactor[] = [];

  // Track provided signals
  const signalPresence = [
    input.sellerPrice != null,
    input.marketPrice != null,
    input.paymentMethod != null,
    input.sellerHistory != null,
    input.reviews != null,
    input.verified != null,
    input.physicalLocation != null,
    input.returnPolicy != null,
    input.productPhotos != null,
  ];
  const providedSignals = signalPresence.filter(Boolean).length;
  const totalSignals = signalPresence.length;

  let score = 0;

  // Price gap (up to 30)
  const pricePercent = calculatePriceGapPercent(input.marketPrice, input.sellerPrice);
  if (pricePercent !== null) {
    let points = 0;
    const absPct = Math.abs(pricePercent);
    if (pricePercent <= 0) {
      // seller at or above market -> no negative points
      points = 0;
    } else {
      if (absPct < 5) points = 0;
      else if (absPct < 15) points = 6;
      else if (absPct < 30) points = 14;
      else points = 30;
    }
    if (points > 0) {
      warningSigns.push({
        factor: "price_gap",
        points,
        severity: points >= 20 ? "high" : points >= 10 ? "medium" : "low",
        title: "Price difference",
        reason: `Seller price is ${pricePercent.toFixed(1)}% below the reference price. Significant differences deserve investigation.`,
      });
      score += points;
    } else {
      positiveSignals.push({
        factor: "price_gap",
        points: 0,
        severity: "low",
        title: "Price in line with market",
        reason: `Price is within expected range (${pricePercent.toFixed(1)}% difference).`,
      });
    }
  }

  // Payment safety mapping (higher points = more warning)
  if (input.paymentMethod == null) {
    unknownSignals.push({
      factor: "payment",
      points: 0,
      severity: "low",
      title: "Payment method unknown",
      reason: "Payment method was not specified. Check buyer protection before paying.",
    });
  } else {
    const mapping: Record<string, { pts: number; title: string; note: string }> = {
      pay_on_delivery: { pts: 0, title: "Pay on delivery", note: "Pay on delivery typically offers strong buyer protection." },
      marketplace_checkout: { pts: 0, title: "Marketplace checkout", note: "Marketplace checkout often provides buyer protection and dispute resolution." },
      card_protected: { pts: 0, title: "Card / protected payment", note: "Card or protected payment methods often allow chargebacks or disputes." },
      mobile_money: { pts: 10, title: "Mobile money before delivery", note: "Mobile money may have limited dispute options depending on provider." },
      bank_transfer: { pts: 20, title: "Bank transfer", note: "Bank transfers are often difficult to reverse; limited buyer protection." },
      cryptocurrency: { pts: 25, title: "Cryptocurrency", note: "Cryptocurrency transactions are typically irreversible and provide little buyer protection." },
      other_unclear: { pts: 10, title: "Other / unclear", note: "Unclear payment method — verify buyer protection." },
    };
    const m = mapping[input.paymentMethod];
    if (m.pts > 0) {
      warningSigns.push({
        factor: "payment",
        points: m.pts,
        severity: m.pts >= 20 ? "high" : "medium",
        title: m.title,
        reason: m.note,
      });
      score += m.pts;
    } else {
      positiveSignals.push({
        factor: "payment",
        points: 0,
        severity: "low",
        title: m.title,
        reason: m.note,
      });
    }
  }

  // Seller history: treat unknown as UNKNOWN signal (do not penalize)
  if (input.sellerHistory == null || input.sellerHistory === "unknown") {
    unknownSignals.push({
      factor: "seller_history",
      points: 0,
      severity: "low",
      title: "Seller history unknown",
      reason: "Not enough information to verify how long the seller has been active.",
    });
  } else {
    const map: Record<string, { pts: number; title: string; note?: string }> = {
      long_standing: { pts: 0, title: "Long-standing presence", note: "Consistent activity over a long period." },
      established: { pts: 3, title: "Established", note: "Active for several months or more." },
      new_limited: { pts: 14, title: "New / limited history", note: "Relatively little history to inspect." },
      unknown: { pts: 0, title: "Unknown", note: "Can't verify the seller history." },
    };
    const m = map[input.sellerHistory];
    if (m.pts > 0) {
      warningSigns.push({
        factor: "seller_history",
        points: m.pts,
        severity: m.pts >= 10 ? "high" : "medium",
        title: m.title,
        reason: m.note || "",
      });
      score += m.pts;
    } else {
      positiveSignals.push({
        factor: "seller_history",
        points: 0,
        severity: "low",
        title: m.title,
        reason: m.note || "",
      });
    }
  }

  // Reviews
  if (typeof input.reviews !== "number") {
    unknownSignals.push({ factor: "reviews", points: 0, severity: "low", title: "Reviews unknown", reason: "Number of reviews not specified." });
  } else {
    const r = input.reviews;
    let pts = 0;
    if (r < 0) pts = 0;
    else if (r <= 2) pts = 15;
    else if (r <= 10) pts = 10;
    else if (r <= 50) pts = 5;
    else pts = 0;
    if (pts > 0) {
      warningSigns.push({
        factor: "reviews",
        points: pts,
        severity: pts >= 10 ? "high" : "medium",
        title: "Few reviews",
        reason: `Seller has ${r} review${r === 1 ? "" : "s"}. Fewer reviews reduce confidence in reputation.`,
      });
      score += pts;
    } else {
      positiveSignals.push({ factor: "reviews", points: 0, severity: "low", title: "Established reviews", reason: `Seller has ${r} reviews.` });
    }
  }

  // Return policy
  if (typeof input.returnPolicy !== "boolean") {
    unknownSignals.push({ factor: "return_policy", points: 0, severity: "low", title: "Return policy unknown", reason: "Return/refund policy not specified." });
  } else if (!input.returnPolicy) {
    const pts = 10;
    warningSigns.push({ factor: "return_policy", points: pts, severity: "medium", title: "No return policy", reason: "No return or refund policy was provided." });
    score += pts;
  } else {
    positiveSignals.push({ factor: "return_policy", points: 0, severity: "low", title: "Return policy provided", reason: "A stated return policy improves buyer protections." });
  }

  // Physical location
  if (typeof input.physicalLocation !== "boolean") {
    unknownSignals.push({ factor: "physical_location", points: 0, severity: "low", title: "Physical location unknown", reason: "No clear physical location provided." });
  } else if (!input.physicalLocation) {
    const pts = 6;
    warningSigns.push({ factor: "physical_location", points: pts, severity: "low", title: "No physical location", reason: "No verifiable physical location was provided." });
    score += pts;
  } else {
    positiveSignals.push({ factor: "physical_location", points: 0, severity: "low", title: "Physical location provided", reason: "Presence of a physical location increases confidence." });
  }

  // Verified account: positive signal when present; absence is neutral/unknown
  if (input.verified === true) {
    positiveSignals.push({ factor: "verified", points: 0, severity: "low", title: "Verified account", reason: "Platform verification is a positive signal but not decisive." });
  } else if (input.verified === false) {
    unknownSignals.push({ factor: "verified", points: 0, severity: "low", title: "Not verified", reason: "Seller is not verified on the platform." });
  } else {
    unknownSignals.push({ factor: "verified", points: 0, severity: "low", title: "Verification unknown", reason: "Verification status not provided." });
  }

  // Product photos
  if (!input.productPhotos) {
    unknownSignals.push({ factor: "photos", points: 0, severity: "low", title: "Photos unknown", reason: "No information about product photos." });
  } else if (input.productPhotos === "generic") {
    const pts = 6;
    warningSigns.push({ factor: "photos", points: pts, severity: "low", title: "Generic or reused photos", reason: "Photos appear generic or reused; verify they match the actual item." });
    score += pts;
  } else if (input.productPhotos === "not_sure") {
    unknownSignals.push({ factor: "photos", points: 0, severity: "low", title: "Photos uncertain", reason: "It's unclear whether the photos are seller-provided." });
  } else {
    positiveSignals.push({ factor: "photos", points: 0, severity: "low", title: "Seller photos", reason: "Seller-provided photos are a positive signal when clearly original." });
  }

  // Ensure score is within 0..100
  score = clamp(Math.round(score));

  // Build recommendations, questions and checklist from top warnings and unknowns
  const recommendations: string[] = [];
  const questions: string[] = [];
  const checklist: string[] = [];

  const sortedWarnings = warningSigns.slice().sort((a, b) => b.points - a.points);
  for (const f of sortedWarnings.slice(0, 6)) {
    if (f.factor === "payment") {
      recommendations.push("Consider using payment methods with buyer protection (marketplace checkout or card).\n");
      questions.push("Does this payment method provide buyer protection or a dispute process?");
      checklist.push("Check whether the payment method allows you to dispute or recover funds");
    }
    if (f.factor === "price_gap") {
      recommendations.push("Confirm the item's condition and why the price is lower than comparable listings.");
      questions.push("Why is the price significantly lower than the reference price?");
      checklist.push("Compare the price with other sellers and ask why it's lower");
    }
    if (f.factor === "seller_history") {
      recommendations.push("Ask for older listings, references, or indicators of consistent activity.");
      questions.push("Can you provide earlier listings, posts, or references from past buyers?");
      checklist.push("Look through older posts, customer interactions, and previous product activity");
    }
    if (f.factor === "return_policy") {
      recommendations.push("Ask for a written return or refund policy for this sale.");
      questions.push("What is your return or refund policy if the item is not as described?");
      checklist.push("Confirm the seller's return/refund policy before paying");
    }
    if (f.factor === "photos") {
      recommendations.push("Request recent, item-specific photos or video showing the item and date.");
      questions.push("Can you provide additional photos, serial numbers, or a short video of the product?");
      checklist.push("Ask for a current photo or short video of the exact item being sold");
    }
  }

  // Unknown signals produce checklist items rather than points
  for (const u of unknownSignals.slice(0, 8)) {
    if (u.factor === "seller_history") checklist.push("Try to verify the seller's online history (posts, followers, timestamps)");
    if (u.factor === "payment") checklist.push("Confirm which payment methods are accepted and whether they provide buyer protection");
    if (u.factor === "return_policy") checklist.push("Ask the seller to state their return and refund terms in writing");
    if (u.factor === "physical_location") checklist.push("Verify the seller's physical location or address if possible");
    if (u.factor === "verified") checklist.push("Check whether the account shows platform verification or linked profiles");
    if (u.factor === "photos") checklist.push("Request recent photos or a video to confirm the item is real and current");
    if (u.factor === "reviews") checklist.push("Look for buyer comments, replies, or external reviews to assess reputation");
  }

  // Confidence
  let confidence: Assessment["confidence"]; // type error workaround with cast later
  const pct = providedSignals / totalSignals;
  if (pct >= 0.75) confidence = "HIGH";
  else if (pct >= 0.4) confidence = "MEDIUM";
  else confidence = "LOW";

  // If many unknowns (market price or payment unknown), reduce confidence
  if (!input.marketPrice || input.paymentMethod == null) {
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
    warningSigns,
    positiveSignals,
    unknownSignals,
    recommendations,
    questionsToAsk: questions,
    checklist,
  } as Assessment;
}

export function simulate(input: SellerInput, changes: Partial<SellerInput>) {
  const merged = { ...input, ...changes };
  return assess(merged);
}

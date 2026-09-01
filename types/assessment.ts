export type Severity = "low" | "medium" | "high";

export type RiskFactor = {
  factor: string;
  points: number;
  severity: Severity;
  title: string;
  reason: string;
};

export type RiskLevel = "LOWER RISK" | "MODERATE RISK" | "HIGH RISK" | "VERY HIGH RISK";

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type Assessment = {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  providedSignals: number;
  totalSignals: number;
  warningSigns: RiskFactor[];
  positiveSignals: RiskFactor[];
  unknownSignals: RiskFactor[];
  recommendations: string[];
  questionsToAsk: string[];
  checklist?: string[];
};

export type SellerInput = {
  productName: string;
  sellerPrice?: number | null;
  marketPrice?: number | null;
  sellerHistory?: "long_standing" | "established" | "new_limited" | "unknown" | null;
  reviews?: number | null;
  verified?: boolean | null;
  physicalLocation?: boolean | null;
  paymentMethod?:
    | "pay_on_delivery"
    | "marketplace_checkout"
    | "card_protected"
    | "mobile_money"
    | "bank_transfer"
    | "cryptocurrency"
    | "other_unclear"
    | null;
  returnPolicy?: boolean | null;
  productPhotos?: "own" | "generic" | "not_sure" | null;
};

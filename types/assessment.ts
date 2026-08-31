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
  recommendations: string[];
  questionsToAsk: string[];
};

export type SellerInput = {
  productName: string;
  sellerPrice?: number | null;
  marketPrice?: number | null;
  accountAge?: "<3m" | "3-12m" | "1-3y" | ">3y" | null;
  reviews?: number | null;
  verified?: boolean | null;
  physicalLocation?: boolean | null;
  paymentMethod?:
    | "pay_on_delivery"
    | "marketplace_checkout"
    | "deposit_balance"
    | "full_upfront"
    | null;
  returnPolicy?: boolean | null;
  productPhotos?: "own" | "generic" | "not_sure" | null;
};

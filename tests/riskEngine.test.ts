import { assess } from "../lib/risk/engine";

function makeBase(overrides: Record<string, any> = {}) {
  return {
    productName: "Phone",
    sellerPrice: 50000,
    marketPrice: 90000,
    accountAge: ">3y",
    reviews: 100,
    verified: true,
    physicalLocation: true,
    paymentMethod: "pay_on_delivery",
    returnPolicy: true,
    productPhotos: "own",
    ...overrides,
  } as any;
}

test("Scenario 1: established seller => low risk", () => {
  const a = assess(makeBase());
  expect(a.riskScore).toBeLessThanOrEqual(24);
});

test("Scenario 2: very risky seller => very high risk", () => {
  const a = assess(makeBase({ accountAge: "<3m", reviews: 0, verified: false, physicalLocation: false, paymentMethod: "full_upfront", returnPolicy: false, sellerPrice: 10000 }));
  expect(a.riskScore).toBeGreaterThanOrEqual(75);
});

test("Scenario 3: verified but full upfront => elevated risk", () => {
  const a = assess(makeBase({ verified: true, paymentMethod: "full_upfront", returnPolicy: false }));
  expect(a.riskScore).toBeGreaterThanOrEqual(50);
});

test("Scenario 4: missing market price => skip price and lower confidence", () => {
  const input = makeBase({ marketPrice: undefined });
  const a = assess(input as any);
  expect(a.confidence).not.toBe("HIGH");
});

test("Scenario 5: only a few fields provided => low confidence", () => {
  const a = assess({ productName: "Old Book" } as any);
  expect(a.confidence).toBe("LOW");
});

test("Scenario 6: extremely large price values", () => {
  const a = assess(makeBase({ sellerPrice: 9000000000, marketPrice: 10000000000 }));
  expect(typeof a.riskScore).toBe("number");
});

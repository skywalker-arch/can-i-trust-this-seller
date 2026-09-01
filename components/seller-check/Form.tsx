"use client";
import React, { useState } from "react";
import type { SellerInput } from "../../types/assessment";

type Props = {
  onRun: (input: SellerInput) => void;
};

export default function Form({ onRun }: Props) {
  const [productName, setProductName] = useState("");
  const [sellerPrice, setSellerPrice] = useState<string>("");
  const [marketPrice, setMarketPrice] = useState<string>("");
  const [sellerHistory, setSellerHistory] = useState<SellerInput["sellerHistory"]>(null);
  const [reviews, setReviews] = useState<string>("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [physicalLocation, setPhysicalLocation] = useState<boolean | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<SellerInput["paymentMethod"]>(null);
  const [returnPolicy, setReturnPolicy] = useState<boolean | null>(null);
  const [productPhotos, setProductPhotos] = useState<SellerInput["productPhotos"]>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function parseNumber(v: string) {
    if (!v) return null;
    const n = Number(v.replace(/[, ]+/g, ""));
    if (!isFinite(n)) return null;
    return n;
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!productName.trim()) e.productName = "Product name is required.";
    const s = parseNumber(sellerPrice);
    if (sellerPrice && (s === null || s <= 0 || Math.abs(s) > 1e12)) e.sellerPrice = "Enter a valid seller price.";
    const m = parseNumber(marketPrice);
    if (marketPrice && (m === null || m <= 0 || Math.abs(m) > 1e12)) e.marketPrice = "Enter a valid market price.";
    if (reviews && (!/^[0-9]+$/.test(reviews) || Number(reviews) < 0)) e.reviews = "Enter a valid number of reviews.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleRun(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) return;
    const payload: SellerInput = {
      productName: productName.trim(),
      sellerPrice: parseNumber(sellerPrice),
      marketPrice: parseNumber(marketPrice),
      sellerHistory,
      reviews: reviews ? Number(reviews) : null,
      verified,
      physicalLocation,
      paymentMethod,
      returnPolicy,
      productPhotos,
    };
    onRun(payload);
  }

  return (
    <form className="space-y-4" onSubmit={handleRun} noValidate>
      <div className="section">
        <div className="section-title">Seller & Listing</div>
        <div className="field">
          <label htmlFor="productName" className="field-label">What are you buying?</label>
          <input
            id="productName"
            name="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="input"
            placeholder="Item or product name"
          />
          {errors.productName && <p id="productName-error" className="text-rose-600 text-sm mt-1">{errors.productName}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field">
            <label htmlFor="sellerPrice" className="field-label">Seller price (KSh)</label>
            <input
              id="sellerPrice"
              name="sellerPrice"
              value={sellerPrice}
              onChange={(e) => setSellerPrice(e.target.value)}
              inputMode="numeric"
              className="input"
              placeholder="e.g. 55,000"
              aria-describedby={errors.sellerPrice ? 'sellerPrice-error' : undefined}
            />
            {errors.sellerPrice && <p id="sellerPrice-error" className="text-rose-600 text-sm mt-1">{errors.sellerPrice}</p>}
          </div>

          <div className="field">
            <label htmlFor="marketPrice" className="field-label">Typical market price (KSh)</label>
            <input
              id="marketPrice"
              name="marketPrice"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              inputMode="numeric"
              className="input"
              placeholder="e.g. 90,000"
              aria-describedby={errors.marketPrice ? 'marketPrice-error' : undefined}
            />
            {errors.marketPrice && <p id="marketPrice-error" className="text-rose-600 text-sm mt-1">{errors.marketPrice}</p>}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Seller history</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field">
            <label htmlFor="sellerHistory" className="field-label">How long does this seller&apos;s online presence appear active?</label>
            <select
              id="sellerHistory"
              name="sellerHistory"
              className="select"
              value={sellerHistory ?? ""}
              onChange={(e) => setSellerHistory((e.target.value as unknown as SellerInput["sellerHistory"]) || null)}
            >
              <option value="">Can't verify</option>
              <option value="long_standing">Long-standing presence (consistent activity)</option>
              <option value="established">Established (several months)</option>
              <option value="new_limited">New / limited history</option>
            </select>
            <p className="text-sm muted mt-1">If you can&apos;t verify history, choose "Can&apos;t verify" — unknown is not automatically risky.</p>
          </div>

          <div className="field">
            <label htmlFor="reviews" className="field-label">Number of reviews</label>
            <input
              id="reviews"
              name="reviews"
              value={reviews}
              onChange={(e) => setReviews(e.target.value)}
              inputMode="numeric"
              className="input"
              placeholder="e.g. 12"
              aria-describedby={errors.reviews ? 'reviews-error' : undefined}
            />
            {errors.reviews && <p id="reviews-error" className="text-rose-600 text-sm mt-1">{errors.reviews}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="field">
            <label className="field-label">Return / refund policy</label>
            <div className="mt-2 flex gap-2" role="group" aria-label="Return policy options">
              <button aria-pressed={returnPolicy === true} type="button" onClick={() => setReturnPolicy(true)} className={`chip ${returnPolicy === true ? 'bg-foreground text-background' : ''}`}>Yes</button>
              <button aria-pressed={returnPolicy === false} type="button" onClick={() => setReturnPolicy(false)} className={`chip ${returnPolicy === false ? 'bg-foreground text-background' : ''}`}>No</button>
              <button aria-pressed={returnPolicy === null} type="button" onClick={() => setReturnPolicy(null)} className={`chip ${returnPolicy === null ? 'bg-foreground text-background' : ''}`}>Unknown</button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="productPhotos" className="field-label">Product photos</label>
            <select id="productPhotos" name="productPhotos" className="select" value={productPhotos ?? ""} onChange={(e) => setProductPhotos((e.target.value as unknown as SellerInput["productPhotos"]) || null)}>
              <option value="">Unknown</option>
              <option value="own">Seller&apos;s own photos</option>
              <option value="generic">Generic / reused-looking photos</option>
              <option value="not_sure">Not sure</option>
            </select>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Seller verification</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field">
            <label className="field-label">Verified account</label>
            <div className="mt-2 flex gap-2" role="group" aria-label="Verified account options">
              <button aria-pressed={verified === true} type="button" onClick={() => setVerified(true)} className={`chip ${verified === true ? 'bg-foreground text-background' : ''}`}>Yes</button>
              <button aria-pressed={verified === false} type="button" onClick={() => setVerified(false)} className={`chip ${verified === false ? 'bg-foreground text-background' : ''}`}>No</button>
              <button aria-pressed={verified === null} type="button" onClick={() => setVerified(null)} className={`chip ${verified === null ? 'bg-foreground text-background' : ''}`}>Unknown</button>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Physical location</label>
            <div className="mt-2 flex gap-2" role="group" aria-label="Physical location options">
              <button aria-pressed={physicalLocation === true} type="button" onClick={() => setPhysicalLocation(true)} className={`chip ${physicalLocation === true ? 'bg-foreground text-background' : ''}`}>Yes</button>
              <button aria-pressed={physicalLocation === false} type="button" onClick={() => setPhysicalLocation(false)} className={`chip ${physicalLocation === false ? 'bg-foreground text-background' : ''}`}>No</button>
              <button aria-pressed={physicalLocation === null} type="button" onClick={() => setPhysicalLocation(null)} className={`chip ${physicalLocation === null ? 'bg-foreground text-background' : ''}`}>Unknown</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Payment & buyer protection</div>
        <div className="field">
          <label className="field-label">How will you pay the seller?</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" aria-pressed={paymentMethod === 'pay_on_delivery'} onClick={() => setPaymentMethod('pay_on_delivery')} className={`chip ${paymentMethod === 'pay_on_delivery' ? 'bg-foreground text-background' : ''}`}>Pay on delivery</button>
            <button type="button" aria-pressed={paymentMethod === 'marketplace_checkout'} onClick={() => setPaymentMethod('marketplace_checkout')} className={`chip ${paymentMethod === 'marketplace_checkout' ? 'bg-foreground text-background' : ''}`}>Marketplace checkout</button>
            <button type="button" aria-pressed={paymentMethod === 'card_protected'} onClick={() => setPaymentMethod('card_protected')} className={`chip ${paymentMethod === 'card_protected' ? 'bg-foreground text-background' : ''}`}>Card / protected payment</button>
            <button type="button" aria-pressed={paymentMethod === 'mobile_money'} onClick={() => setPaymentMethod('mobile_money')} className={`chip ${paymentMethod === 'mobile_money' ? 'bg-foreground text-background' : ''}`}>Mobile money before delivery</button>
            <button type="button" aria-pressed={paymentMethod === 'bank_transfer'} onClick={() => setPaymentMethod('bank_transfer')} className={`chip ${paymentMethod === 'bank_transfer' ? 'bg-foreground text-background' : ''}`}>Bank transfer</button>
            <button type="button" aria-pressed={paymentMethod === 'cryptocurrency'} onClick={() => setPaymentMethod('cryptocurrency')} className={`chip ${paymentMethod === 'cryptocurrency' ? 'bg-foreground text-background' : ''}`}>Cryptocurrency</button>
            <button type="button" aria-pressed={paymentMethod === 'other_unclear'} onClick={() => setPaymentMethod('other_unclear')} className={`chip ${paymentMethod === 'other_unclear' ? 'bg-foreground text-background' : ''}`}>Other / unclear</button>
            <button type="button" aria-pressed={paymentMethod === null} onClick={() => setPaymentMethod(null)} className={`chip ${paymentMethod === null ? 'bg-foreground text-background' : ''}`}>Unknown</button>
          </div>
          <p className="text-sm muted mt-2">Select the payment method you expect to use. This helps the tool indicate the level of buyer protection.</p>
        </div>
      </div>

        <div className="flex items-center gap-3 mt-2">
        <button type="submit" className="btn-primary">Run the check →</button>
        <button
          type="button"
          onClick={() => {
            setProductName(""); setSellerPrice(""); setMarketPrice(""); setSellerHistory(null); setReviews(""); setVerified(null); setPhysicalLocation(null); setPaymentMethod(null); setReturnPolicy(null); setProductPhotos(null); setErrors({});
          }}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

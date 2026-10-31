import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { calculateDividendTaxCredit } from "../stages/dividend-credit"

describe("Section 47 bis Dividend Tax Credit", () => {
	it("grosses up a 100,000 THB dividend at 20% corporate tax to a 25,000 THB credit", () => {
		// 100,000 * 0.2 / (1 - 0.2) = 25,000; grossed-up income 125,000
		const res = calculateDividendTaxCredit(100_000, 0.2)
		expect(res.isApplicable).toBe(true)
		expect(res.dividendAmount).toBe(100_000)
		expect(res.corpTaxRate).toBe(0.2)
		expect(res.credit).toBe(25_000)
		expect(res.grossedUpAmount).toBe(125_000)
	})

	it("rounds the credit half-up in satang", () => {
		// 1,000.02 THB (100,002 satang) * 0.25 = 25,000.5 satang -> 25,001 satang
		const res = calculateDividendTaxCredit(1_000.02, 0.2)
		expect(res.credit).toBe(250.01)
		expect(res.grossedUpAmount).toBe(1_250.03)
	})

	it("computes a 30% corporate rate credit as 3/7 of the dividend", () => {
		expect(calculateDividendTaxCredit(7_000, 0.3).credit).toBe(3_000)
	})

	it("is not applicable without a corporate tax rate", () => {
		const res = calculateDividendTaxCredit(50_000, undefined)
		expect(res.isApplicable).toBe(false)
		expect(res.corpTaxRate).toBe(0)
		expect(res.credit).toBe(0)
		expect(res.grossedUpAmount).toBe(50_000)
	})

	it("yields a zero credit for a zero rate or zero dividend", () => {
		expect(calculateDividendTaxCredit(50_000, 0).credit).toBe(0)
		expect(calculateDividendTaxCredit(0, 0.2).credit).toBe(0)
	})

	it("rejects invalid corporate tax rates and dividends", () => {
		for (const bad of [-0.1, 1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(() => calculateDividendTaxCredit(100, bad)).toThrow(TaxValidationError)
		}
		expect(() => calculateDividendTaxCredit(100, 0.999)).not.toThrow()
		expect(() => calculateDividendTaxCredit(-1, 0.2)).toThrow(TaxValidationError)
		expect(() => calculateDividendTaxCredit(100, 1)).toThrow(TaxValidationError)
	})
})

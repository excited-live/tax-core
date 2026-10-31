import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { applyRealEstateCap, calculateRealEstateTransfer } from "../stages/real-estate"

describe("Section 48(4) real estate transfer", () => {
	it("reports an empty breakdown when no transfer is given", () => {
		const res = calculateRealEstateTransfer(undefined)
		expect(res.grossTransferValue).toBe(0)
		expect(res.holdingYears).toBe(0)
		expect(res.tax).toBe(0)
		expect(res.wasClamped).toBe(false)
	})

	it("taxes a 3-year hold: 77% expense, annualised gain, regular brackets, times years", () => {
		// 5,000,000: expense 3,850,000; net 1,150,000; annual 383,333.33
		// Exact: annual tax 15,833.333...; x3 = 47,500.00 (no per-year satang rounding drift)
		const res = calculateRealEstateTransfer({ grossTransferValue: 5_000_000, holdingYears: 3 })
		expect(res.expenseRate).toBe(0.77)
		expect(res.expense).toBe(3_850_000)
		expect(res.netGain).toBe(1_150_000)
		expect(res.annualGain).toBe(383_333.33)
		expect(res.annualTax).toBe(15_833.33)
		expect(res.taxBeforeCap).toBe(47_500)
		expect(res.taxCap).toBe(1_000_000)
		expect(res.wasClamped).toBe(false)
		expect(res.tax).toBe(47_500)
		expect(res.brackets.marginalRate).toBe(0.1)
	})

	it("uses the 55% row at 7 years and the 50% row at 8 and more years", () => {
		// 7y: net 18,000,000; annual 2,571,428.571...; annual tax 536,428.571...; x7 = 3,755,000
		const seven = calculateRealEstateTransfer({ grossTransferValue: 40_000_000, holdingYears: 7 })
		expect(seven.expenseRate).toBe(0.55)
		expect(seven.tax).toBe(3_755_000)
		// 8y: net 20,000,000; annual 2,500,000; annual tax 515,000; x8 = 4,120,000
		const eight = calculateRealEstateTransfer({ grossTransferValue: 40_000_000, holdingYears: 8 })
		expect(eight.expenseRate).toBe(0.5)
		expect(eight.tax).toBe(4_120_000)
		const twenty = calculateRealEstateTransfer({ grossTransferValue: 40_000_000, holdingYears: 20 })
		expect(twenty.expenseRate).toBe(0.5)
	})

	it("maps every holding year 1 to 6 to the statutory expense rate", () => {
		const rates = [1, 2, 3, 4, 5, 6].map(
			(y) => calculateRealEstateTransfer({ grossTransferValue: 100, holdingYears: y }).expenseRate,
		)
		expect(rates).toEqual([0.92, 0.84, 0.77, 0.71, 0.65, 0.6])
	})

	it("is tax-free when the annualised gain is within the 150,000 exemption", () => {
		const res = calculateRealEstateTransfer({ grossTransferValue: 2_000_000, holdingYears: 10 })
		expect(res.annualGain).toBe(100_000)
		expect(res.tax).toBe(0)
	})

	it("handles a zero transfer value", () => {
		const res = calculateRealEstateTransfer({ grossTransferValue: 0, holdingYears: 1 })
		expect(res.tax).toBe(0)
		expect(res.taxCap).toBe(0)
	})

	it("clamps tax at 20% of gross transfer value", () => {
		const clamped = applyRealEstateCap(1_500_000_00, 10_000_000_00)
		expect(clamped).toEqual({ taxCap: 2_000_000_00, tax: 1_500_000_00, wasClamped: false })
		const over = applyRealEstateCap(3_000_000_00, 10_000_000_00)
		expect(over).toEqual({ taxCap: 2_000_000_00, tax: 2_000_000_00, wasClamped: true })
		expect(applyRealEstateCap(2_000_000_00, 10_000_000_00).wasClamped).toBe(false)
	})

	it("matches exact arithmetic to the satang for awkward holding periods", () => {
		// 9 years, 20,000,000: net 10,000,000; thresholds x9: 1.35M@0, 2.7M@5%, 4.5M@10%, 6.75M@15%,
		// 9M@20%, 18M@25%: tax = 67,500 + 180,000 + 337,500 + 450,000 + 0.25*1,000,000 = 1,285,000
		const nine = calculateRealEstateTransfer({ grossTransferValue: 20_000_000, holdingYears: 9 })
		expect(nine.netGain).toBe(10_000_000)
		expect(nine.taxBeforeCap).toBe(1_285_000)
		expect(nine.annualTax).toBe(142_777.78)
		expect(nine.brackets.totalTax).toBe(1_285_000)
	})

	it("rejects holding periods whose scaled brackets overflow safe integers", () => {
		const ok = { grossTransferValue: 1_000_000, holdingYears: 3 }
		for (const years of [2 ** 52, 1e10, 1e12]) {
			expect(() => calculateRealEstateTransfer({ ...ok, holdingYears: years })).toThrow(
				TaxValidationError,
			)
		}
		expect(calculateRealEstateTransfer({ ...ok, holdingYears: 1_000_000 }).tax).toBe(0)
	})

	it("rejects invalid values and holding years", () => {
		const ok = { grossTransferValue: 1_000_000, holdingYears: 3 }
		expect(() => calculateRealEstateTransfer({ ...ok, grossTransferValue: -1 })).toThrow(
			TaxValidationError,
		)
		expect(() => calculateRealEstateTransfer({ ...ok, grossTransferValue: Number.NaN })).toThrow(
			TaxValidationError,
		)
		for (const years of [0, -2, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
			expect(() => calculateRealEstateTransfer({ ...ok, holdingYears: years })).toThrow(
				TaxValidationError,
			)
		}
	})
})

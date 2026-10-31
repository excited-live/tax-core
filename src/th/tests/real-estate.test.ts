import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { applyRealEstateCap, calculateRealEstateTransfer } from "../stages/real-estate"
import {
	ThRealEstateAcquisitionType,
	ThRealEstateExpenseBasis,
	ThSpecialRegimeField,
} from "../types"

const { Commercial, InheritanceOrGift } = ThRealEstateAcquisitionType
const run = (grossTransferValue: number, holdingYears: number, acquisitionType?: string) =>
	calculateRealEstateTransfer({
		grossTransferValue,
		holdingYears,
		...(acquisitionType === undefined
			? {}
			: { acquisitionType: acquisitionType as ThRealEstateAcquisitionType }),
	})

// Schedule without the 0% tier: 5% to 300k, 10% to 500k, 15% to 750k, 20% to 1M, 25% to 2M,
// 30% to 5M, 35% above (the same ladder as the Section 48(5) separate sheet).
describe("Section 48(4) real estate transfer", () => {
	it("reports an empty commercial breakdown when no transfer is given", () => {
		const res = calculateRealEstateTransfer(undefined)
		expect(res.grossTransferValue).toBe(0)
		expect(res.requestedHoldingYears).toBe(0)
		expect(res.effectiveHoldingYears).toBe(0)
		expect(res.acquisitionType).toBe(Commercial)
		expect(res.tax).toBe(0)
		expect(res.wasClamped).toBe(false)
	})

	it("matches the Revenue Department example: inherited 2,000,000, 5 years", () => {
		// 50% flat expense -> net 1,000,000; /5 = 200,000; 5% = 10,000 a year; x5 = 50,000
		const res = run(2_000_000, 5, InheritanceOrGift)
		expect(res.acquisitionType).toBe(InheritanceOrGift)
		expect(res.expenseBasis).toBe(ThRealEstateExpenseBasis.FlatInheritance)
		expect(res.expenseRate).toBe(0.5)
		expect(res.expense).toBe(1_000_000)
		expect(res.netGain).toBe(1_000_000)
		expect(res.annualGain).toBe(200_000)
		expect(res.annualTax).toBe(10_000)
		expect(res.taxBeforeCap).toBe(50_000)
		expect(res.taxCap).toBe(400_000)
		expect(res.wasClamped).toBe(false)
		expect(res.tax).toBe(50_000)
	})

	it("taxes the first baht: there is no 0% tier in the annualised schedule", () => {
		// 2,000,000 over 10 years, commercial 50%: annual gain 100,000 x 5% x 10 = 50,000
		const res = run(2_000_000, 10)
		expect(res.annualGain).toBe(100_000)
		expect(res.tax).toBe(50_000)
		expect(res.brackets.slices[0]?.rate).toBe(0.05)
		expect(res.brackets.slices[0]?.lowerBound).toBe(0)
	})

	it("uses a flat 50% for inheritance or gift, never the holding-year table", () => {
		// 2,000,000 for 1 year: table would be 92%; flat 50% -> net 1,000,000
		// 15,000 + 20,000 + 37,500 + 50,000 = 122,500
		const res = run(2_000_000, 1, InheritanceOrGift)
		expect(res.expenseRate).toBe(0.5)
		expect(res.netGain).toBe(1_000_000)
		expect(res.tax).toBe(122_500)
	})

	it("defaults to a commercial acquisition using the holding-year table", () => {
		// 10,000,000 for 1 year: 92% expense -> net 800,000: 15,000 + 20,000 + 37,500 + 10,000
		const res = run(10_000_000, 1)
		expect(res.acquisitionType).toBe(Commercial)
		expect(res.expenseBasis).toBe(ThRealEstateExpenseBasis.HoldingPeriodTable)
		expect(res.expenseRate).toBe(0.92)
		expect(res.netGain).toBe(800_000)
		expect(res.tax).toBe(82_500)
		expect(run(10_000_000, 1, Commercial)).toEqual(res)
	})

	it("taxes a 3-year commercial hold: 77% expense, annualised, scaled back", () => {
		// 5,000,000: net 1,150,000; annual 383,333.33; annual tax 15,000 + 8,333.33 = 23,333.33; x3 = 70,000
		const res = run(5_000_000, 3)
		expect(res.expenseRate).toBe(0.77)
		expect(res.expense).toBe(3_850_000)
		expect(res.netGain).toBe(1_150_000)
		expect(res.annualGain).toBe(383_333.33)
		expect(res.annualTax).toBe(23_333.33)
		expect(res.taxBeforeCap).toBe(70_000)
		expect(res.brackets.marginalRate).toBe(0.1)
	})

	it("maps every holding year 1 to 8 to the statutory expense rate", () => {
		const rates = [1, 2, 3, 4, 5, 6, 7, 8].map((y) => run(100, y).expenseRate)
		expect(rates).toEqual([0.92, 0.84, 0.77, 0.71, 0.65, 0.6, 0.55, 0.5])
	})

	it("uses the 55% row at 7 years and the 50% row from 8 years", () => {
		// 7y: net 18,000,000 against bounds x7 = 105,000 + 140,000 + 262,500 + 350,000 + 1,750,000 + 1,200,000
		const seven = run(40_000_000, 7)
		expect(seven.expenseRate).toBe(0.55)
		expect(seven.tax).toBe(3_807_500)
		// 8y: net 20,000,000; annual 2,500,000; annual tax 522,500; x8 = 4,180,000
		const eight = run(40_000_000, 8)
		expect(eight.expenseRate).toBe(0.5)
		expect(eight.annualTax).toBe(522_500)
		expect(eight.tax).toBe(4_180_000)
	})

	it("counts more than 10 years as 10: 10 and 12 years give the same tax", () => {
		// net 20,000,000 / 10 = 2,000,000 a year: 372,500 x 10 = 3,725,000
		const ten = run(40_000_000, 10)
		const twelve = run(40_000_000, 12)
		expect(ten.tax).toBe(3_725_000)
		expect(twelve.tax).toBe(ten.tax)
		expect(twelve.annualGain).toBe(2_000_000)
		expect(ten.requestedHoldingYears).toBe(10)
		expect(ten.effectiveHoldingYears).toBe(10)
		expect(twelve.requestedHoldingYears).toBe(12)
		expect(twelve.effectiveHoldingYears).toBe(10)
		expect(run(40_000_000, 2 ** 52).tax).toBe(ten.tax)
	})

	it("matches exact arithmetic to the satang for awkward holding periods", () => {
		// 9 years, 20,000,000: net 10,000,000 against bounds x9:
		// 135,000 + 180,000 + 337,500 + 450,000 + 1,000,000 * 25% = 1,352,500
		const nine = run(20_000_000, 9)
		expect(nine.netGain).toBe(10_000_000)
		expect(nine.taxBeforeCap).toBe(1_352_500)
		expect(nine.annualTax).toBe(150_277.78)
		expect(nine.brackets.totalTax).toBe(1_352_500)
	})

	it("handles a zero transfer value", () => {
		const res = run(0, 1)
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

	it("never reaches the cap end to end: 35% of at most 50% is 17.5% of the value", () => {
		const res = run(100_000_000, 1, InheritanceOrGift)
		expect(res.taxBeforeCap).toBe(17_022_500)
		expect(res.taxCap).toBe(20_000_000)
		expect(res.wasClamped).toBe(false)
	})

	it("rejects invalid values, holding years and acquisition types", () => {
		expect(() => run(-1, 3)).toThrow(TaxValidationError)
		expect(() => run(Number.NaN, 3)).toThrow(TaxValidationError)
		for (const years of [0, -2, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
			expect(() => run(1_000_000, years)).toThrow(TaxValidationError)
		}
		try {
			run(1_000_000, 3, "gift")
			throw new Error("expected TaxValidationError")
		} catch (error) {
			expect(error).toBeInstanceOf(TaxValidationError)
			expect((error as TaxValidationError).field).toBe(
				ThSpecialRegimeField.RealEstateAcquisitionType,
			)
		}
	})
})

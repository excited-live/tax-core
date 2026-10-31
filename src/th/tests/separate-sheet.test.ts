import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { calculateSeparateSheet } from "../stages/separate-sheet"
import { ThSeparateSheetPaymentType, ThSpecialRegimeField } from "../types"

describe("Section 48(5) Separate Sheet (ใบแนบ ภ.ง.ด.90/91)", () => {
	it("reports an empty ineligible sheet when no lump sum is given", () => {
		const res = calculateSeparateSheet(undefined)
		expect(res.isEligible).toBe(false)
		expect(res.amount).toBe(0)
		expect(res.addedToSection40_1).toBe(0)
		expect(res.tax).toBe(0)
	})

	it("applies the 600,000 ceiling, 7,000 per year, then 50% of the remainder", () => {
		// exemption min(1.5M, 400*2,000=800k, 600k) = 600,000; remainder 900,000
		// fixed 7,000*20 = 140,000; left 760,000; 50% = 380,000; net 380,000
		// tax: 300,000*5% + 80,000*10% = 23,000
		const res = calculateSeparateSheet({
			amount: 1_500_000,
			yearsOfService: 20,
			lastDailyWage: 2_000,
		})
		expect(res.isEligible).toBe(true)
		expect(res.addedToSection40_1).toBe(0)
		expect(res.wageBasedCap).toBe(800_000)
		expect(res.exemptionCeiling).toBe(600_000)
		expect(res.exemption).toBe(600_000)
		expect(res.remainder).toBe(900_000)
		expect(res.fixedExpense).toBe(140_000)
		expect(res.percentageExpense).toBe(380_000)
		expect(res.netTaxable).toBe(380_000)
		expect(res.brackets.marginalRate).toBe(0.1)
		expect(res.tax).toBe(23_000)
	})

	it("uses the 400-day wage cap when it is below the ceiling", () => {
		// exemption min(500k, 400*600=240k, 600k) = 240,000; remainder 260,000
		// fixed 70,000; left 190,000; 50% = 95,000; tax 95,000*5% = 4,750
		const res = calculateSeparateSheet({ amount: 500_000, yearsOfService: 10, lastDailyWage: 600 })
		expect(res.exemption).toBe(240_000)
		expect(res.netTaxable).toBe(95_000)
		expect(res.tax).toBe(4_750)
	})

	it("is fully exempt when the lump sum is within the exemption", () => {
		const res = calculateSeparateSheet({ amount: 300_000, yearsOfService: 5, lastDailyWage: 1_000 })
		expect(res.isEligible).toBe(true)
		expect(res.exemption).toBe(300_000)
		expect(res.remainder).toBe(0)
		expect(res.netTaxable).toBe(0)
		expect(res.tax).toBe(0)
	})

	it("limits the 7,000-per-year expense to the remainder", () => {
		// exemption 600,000; remainder 100,000; fixed min(210,000, 100,000) = 100,000
		const res = calculateSeparateSheet({
			amount: 700_000,
			yearsOfService: 30,
			lastDailyWage: 1_500,
		})
		expect(res.fixedExpense).toBe(100_000)
		expect(res.percentageExpense).toBe(0)
		expect(res.netTaxable).toBe(0)
	})

	it("taxes large lump sums through every separate-sheet bracket", () => {
		// net 9,595,000: 15,000 + 20,000 + 37,500 + 50,000 + 250,000 + 900,000 + 1,608,250
		const res = calculateSeparateSheet({
			amount: 20_000_000,
			yearsOfService: 30,
			lastDailyWage: 100_000,
		})
		expect(res.netTaxable).toBe(9_595_000)
		expect(res.tax).toBe(2_880_750)
		expect(res.brackets.marginalRate).toBe(0.35)
	})

	it("rounds the 50% expense half-up in satang", () => {
		// 400,000.01 - 35,000 = 365,000.01 = 36,500,001 satang; 50% -> 18,250,001; net 182,500.00
		const res = calculateSeparateSheet({ amount: 400_000.01, yearsOfService: 5, lastDailyWage: 0 })
		expect(res.percentageExpense).toBe(182_500.01)
		expect(res.netTaxable).toBe(182_500)
		expect(res.tax).toBe(9_125)
	})

	it("exempts severance first, then adds only the remainder to Section 40(1) under 5 years", () => {
		// exemption min(800k, 400*2,000=800k, 600k) = 600,000; remainder 200,000 goes to 40(1)
		const res = calculateSeparateSheet({ amount: 800_000, yearsOfService: 4, lastDailyWage: 2_000 })
		expect(res.isEligible).toBe(false)
		expect(res.exemption).toBe(600_000)
		expect(res.remainder).toBe(200_000)
		expect(res.addedToSection40_1).toBe(200_000)
		expect(res.fixedExpense).toBe(0)
		expect(res.percentageExpense).toBe(0)
		expect(res.netTaxable).toBe(0)
		expect(res.tax).toBe(0)
	})

	it("has no years-of-service floor for the severance exemption", () => {
		// 3 years, wage cap 400*1,000 = 400,000 >= amount 300,000: fully exempt
		const full = calculateSeparateSheet({
			amount: 300_000,
			yearsOfService: 3,
			lastDailyWage: 1_000,
		})
		expect(full.exemption).toBe(300_000)
		expect(full.addedToSection40_1).toBe(0)
		// 0 years: wage cap 400*500 = 200,000 exempt, 100,000 remains
		const zero = calculateSeparateSheet({ amount: 300_000, yearsOfService: 0, lastDailyWage: 500 })
		expect(zero.wageBasedCap).toBe(200_000)
		expect(zero.exemption).toBe(200_000)
		expect(zero.addedToSection40_1).toBe(100_000)
	})

	it("defaults the payment type to severance", () => {
		const res = calculateSeparateSheet({ amount: 1, yearsOfService: 6, lastDailyWage: 1 })
		expect(res.paymentType).toBe(ThSeparateSheetPaymentType.Severance)
		expect(calculateSeparateSheet(undefined).paymentType).toBe(ThSeparateSheetPaymentType.Severance)
	})

	it("gives retirement payments no exemption at 5 or more years", () => {
		// remainder 1,500,000; fixed 140,000; 50% of 1,360,000 = 680,000; net 680,000
		// tax: 15,000 + 20,000 + 180,000 * 15% = 62,000
		const res = calculateSeparateSheet({
			amount: 1_500_000,
			yearsOfService: 20,
			lastDailyWage: 2_000,
			paymentType: ThSeparateSheetPaymentType.Retirement,
		})
		expect(res.paymentType).toBe(ThSeparateSheetPaymentType.Retirement)
		expect(res.wageBasedCap).toBe(0)
		expect(res.exemption).toBe(0)
		expect(res.remainder).toBe(1_500_000)
		expect(res.netTaxable).toBe(680_000)
		expect(res.tax).toBe(62_000)
	})

	it("adds the whole retirement payment to Section 40(1) under 5 years", () => {
		const res = calculateSeparateSheet({
			amount: 800_000,
			yearsOfService: 4,
			lastDailyWage: 2_000,
			paymentType: ThSeparateSheetPaymentType.Retirement,
		})
		expect(res.isEligible).toBe(false)
		expect(res.exemption).toBe(0)
		expect(res.addedToSection40_1).toBe(800_000)
		expect(res.tax).toBe(0)
	})

	it("rejects an unknown payment type against its typed field", () => {
		const paymentType = "pension" as unknown as ThSeparateSheetPaymentType
		const input = { amount: 1, yearsOfService: 6, lastDailyWage: 1, paymentType }
		try {
			calculateSeparateSheet(input)
			throw new Error("expected TaxValidationError")
		} catch (error) {
			expect(error).toBeInstanceOf(TaxValidationError)
			expect((error as TaxValidationError).field).toBe(
				ThSpecialRegimeField.SeparateSheetPaymentType,
			)
		}
	})

	it("rejects wage or service years whose scaled satang amounts exceed safe integers", () => {
		const ok = { amount: 100_000, yearsOfService: 6, lastDailyWage: 500 }
		expect(() => calculateSeparateSheet({ ...ok, lastDailyWage: 1e13 })).toThrow(TaxValidationError)
		for (const years of [2 ** 52, 1e11]) {
			expect(() => calculateSeparateSheet({ ...ok, yearsOfService: years })).toThrow(
				TaxValidationError,
			)
		}
	})

	it("rejects invalid amounts, wages, and years of service", () => {
		const ok = { amount: 100_000, yearsOfService: 6, lastDailyWage: 500 }
		expect(() => calculateSeparateSheet({ ...ok, amount: -1 })).toThrow(TaxValidationError)
		expect(() => calculateSeparateSheet({ ...ok, amount: Number.NaN })).toThrow(TaxValidationError)
		expect(() => calculateSeparateSheet({ ...ok, lastDailyWage: -1 })).toThrow(TaxValidationError)
		for (const years of [-1, 5.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
			expect(() => calculateSeparateSheet({ ...ok, yearsOfService: years })).toThrow(
				TaxValidationError,
			)
		}
	})
})

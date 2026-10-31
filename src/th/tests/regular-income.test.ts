import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { buildRegularIncome } from "../stages/regular-income"

const none = { lumpSum: 0, section40_4: 0, dividendCredit: 0 }

describe("Regular-schedule income assembly", () => {
	it("adds an ineligible lump sum to Section 40(1) and replaces Section 40(4)", () => {
		const res = buildRegularIncome(
			{ section40_1: 500_000, section40_2: 20_000 },
			{ lumpSum: 80_000, section40_4: 15_000, dividendCredit: 2_500.5 },
		)
		expect(res.section40_1).toBe(580_000)
		expect(res.section40_4).toBe(17_500.5)
		expect(res.section40_2).toBe(20_000)
	})

	it("treats missing income as empty", () => {
		const res = buildRegularIncome(undefined, none)
		expect(res.section40_1).toBe(0)
		expect(res.section40_4).toBe(0)
	})

	it("validates the original Section 40(1) before summing", () => {
		expect(() => buildRegularIncome({ section40_1: -10 }, { ...none, lumpSum: 50 })).toThrow(
			TaxValidationError,
		)
		expect(() => buildRegularIncome({ section40_1: Number.NaN }, none)).toThrow(TaxValidationError)
	})

	it("sums in satang to avoid float drift", () => {
		expect(buildRegularIncome({ section40_1: 0.1 }, { ...none, lumpSum: 0.2 }).section40_1).toBe(
			0.3,
		)
	})
})

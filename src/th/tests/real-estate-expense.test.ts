import { describe, expect, it } from "bun:test"
import { effectiveHoldingYears, resolveRealEstateExpense } from "../stages/real-estate-expense"
import { ThRealEstateAcquisitionType, ThRealEstateExpenseBasis } from "../types"

describe("Section 48(4) expense selection", () => {
	it("caps holding years at 10", () => {
		expect([1, 9, 10, 11, 50].map(effectiveHoldingYears)).toEqual([1, 9, 10, 10, 10])
	})

	it("uses the holding-year table for commercial acquisitions", () => {
		const one = resolveRealEstateExpense(ThRealEstateAcquisitionType.Commercial, 1)
		expect(one).toEqual({ basis: ThRealEstateExpenseBasis.HoldingPeriodTable, rate: 0.92 })
		expect(resolveRealEstateExpense(ThRealEstateAcquisitionType.Commercial, 10).rate).toBe(0.5)
	})

	it("uses a flat 50% for inheritance or gift at every holding length", () => {
		for (const years of [1, 4, 10]) {
			const res = resolveRealEstateExpense(ThRealEstateAcquisitionType.InheritanceOrGift, years)
			expect(res).toEqual({ basis: ThRealEstateExpenseBasis.FlatInheritance, rate: 0.5 })
		}
	})
})

import { describe, expect, it } from "bun:test"
import { calculateMinimumGrossTax } from "../stages/minimum-tax"

describe("Section 48(2) Minimum Gross Tax", () => {
	it("returns non-applicable when eligible gross income is under 60,000 THB", () => {
		const res = calculateMinimumGrossTax(50_000, 1_000)
		expect(res.grossEligibleIncome).toBe(50_000)
		expect(res.calculatedTax).toBe(0)
		expect(res.isApplicable).toBe(false)
		expect(res.wasApplied).toBe(false)
	})

	it("waives tax when calculated minimum gross tax is 5,000 THB or less", () => {
		// 800,000 THB * 0.5% = 4,000 THB (<= 5,000 statutory threshold)
		const res = calculateMinimumGrossTax(800_000, 2_000)
		expect(res.grossEligibleIncome).toBe(800_000)
		expect(res.calculatedTax).toBe(4_000)
		expect(res.isApplicable).toBe(false)
		expect(res.wasApplied).toBe(false)
	})

	it("applies minimum gross tax when > 5,000 THB and exceeds progressive tax", () => {
		// 2,000,000 THB * 0.5% = 10,000 THB (> 5,000 threshold and > progressive tax 4,000)
		const res = calculateMinimumGrossTax(2_000_000, 4_000)
		expect(res.calculatedTax).toBe(10_000)
		expect(res.isApplicable).toBe(true)
		expect(res.wasApplied).toBe(true)
	})

	it("does not apply minimum gross tax when progressive tax is higher", () => {
		// 2,000,000 THB * 0.5% = 10,000 THB, but progressive tax is 25,000 THB
		const res = calculateMinimumGrossTax(2_000_000, 25_000)
		expect(res.calculatedTax).toBe(10_000)
		expect(res.isApplicable).toBe(true)
		expect(res.wasApplied).toBe(false)
	})
})

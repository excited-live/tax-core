import { describe, expect, it } from "bun:test"
import { toMinorUnits, usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsPreferentialStacking } from "./preferential"

describe("Preferential Stacking Stage", () => {
	const singleBrackets = US_2026_PARAMETERS.preferentialBrackets.single

	it("computes zero preferential tax when preferential taxable income is zero", () => {
		const ordinaryCents = toMinorUnits(50_000, "USD")
		const taxableCents = toMinorUnits(50_000, "USD")
		const res = calculateUsPreferentialStacking(ordinaryCents, taxableCents, singleBrackets)
		expect(res.preferentialTax).toBe(usd(0))
		expect(res.slices.length).toBe(3)
		expect(res.slices[0]?.taxableAmount).toBe(usd(0))
		expect(res.slices[1]?.taxableAmount).toBe(usd(0))
		expect(res.slices[2]?.taxableAmount).toBe(usd(0))
	})

	it("taxes preferential income at 0% when totally under the 0% threshold", () => {
		// Single 0% threshold is 49,450
		const ordinaryCents = toMinorUnits(20_000, "USD")
		const taxableCents = toMinorUnits(40_000, "USD") // pref = 20,000
		const res = calculateUsPreferentialStacking(ordinaryCents, taxableCents, singleBrackets)
		expect(res.preferentialTax).toBe(usd(0))
		expect(res.slices[0]?.taxableAmount).toBe(usd(20_000))
		expect(res.slices[0]?.tax).toBe(usd(0))
		expect(res.slices[1]?.taxableAmount).toBe(usd(0))
	})

	it("stacks preferential income across 0% and 15% tiers", () => {
		// Single 0% threshold: 49,450.
		// Ordinary: 30,000. Total taxable: 60,000. Pref = 30,000.
		// Sits between 30,000 and 60,000:
		// 0% tier: [30,000, 49,450] -> 19,450
		// 15% tier: [49,450, 60,000] -> 10,550
		// 15% tax: 10,550 * 0.15 = 1,582.50
		const ordinaryCents = toMinorUnits(30_000, "USD")
		const taxableCents = toMinorUnits(60_000, "USD")
		const res = calculateUsPreferentialStacking(ordinaryCents, taxableCents, singleBrackets)
		expect(res.slices[0]?.taxableAmount).toBe(usd(19_450))
		expect(res.slices[0]?.tax).toBe(usd(0))
		expect(res.slices[1]?.taxableAmount).toBe(usd(10_550))
		expect(res.slices[1]?.tax).toBe(usd(1_582.5))
		expect(res.preferentialTax).toBe(usd(1_582.5))
	})

	it("stacks preferential income across 15% and 20% tiers for high earners", () => {
		// Single 15% threshold ends at 545,500.
		// Ordinary: 500,000. Total taxable: 600,000. Pref = 100,000.
		// 15% tier: [500,000, 545,500] -> 45,500 * 0.15 = 6,825.00
		// 20% tier: [545,500, 600,000] -> 54,500 * 0.20 = 10,900.00
		// Total pref tax = 17,725.00
		const ordinaryCents = toMinorUnits(500_000, "USD")
		const taxableCents = toMinorUnits(600_000, "USD")
		const res = calculateUsPreferentialStacking(ordinaryCents, taxableCents, singleBrackets)
		expect(res.slices[0]?.taxableAmount).toBe(usd(0))
		expect(res.slices[1]?.taxableAmount).toBe(usd(45_500))
		expect(res.slices[1]?.tax).toBe(usd(6_825))
		expect(res.slices[2]?.taxableAmount).toBe(usd(54_500))
		expect(res.slices[2]?.tax).toBe(usd(10_900))
		expect(res.preferentialTax).toBe(usd(17_725))
	})
})

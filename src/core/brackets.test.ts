import { describe, expect, it } from "bun:test"
import { evaluateBrackets, type TaxBracket } from "./brackets"
import { TaxValidationError } from "./money"

describe("Progressive bracket evaluator (evaluateBrackets)", () => {
	const sampleBrackets: readonly TaxBracket[] = [
		{ upTo: 150_000, rate: 0.0 },
		{ upTo: 300_000, rate: 0.05 },
		{ upTo: 500_000, rate: 0.1 },
		{ upTo: null, rate: 0.15 },
	]

	it("computes zero tax for income entirely within 0% first bracket", () => {
		const result = evaluateBrackets(100_000, sampleBrackets)
		expect(result.totalTax).toBe(0)
		expect(result.effectiveRate).toBe(0)
		expect(result.marginalRate).toBe(0)
		expect(result.slices).toHaveLength(4)
		expect(result.slices[0]?.taxableAmount).toBe(100_000)
		expect(result.slices[0]?.tax).toBe(0)
		expect(result.slices[1]?.taxableAmount).toBe(0)
	})

	it("computes progressive slices correctly across multiple tiers", () => {
		// 200,000 income:
		// Slice 0 (0 - 150,000 @ 0%): 150,000 -> 0 tax
		// Slice 1 (150,000 - 300,000 @ 5%): 50,000 -> 2,500 tax
		// Slices 2 & 3: 0 -> 0 tax
		// Total tax = 2,500
		const result = evaluateBrackets(200_000, sampleBrackets)
		expect(result.totalTax).toBe(2500)
		expect(result.effectiveRate).toBeCloseTo(2500 / 200_000, 6)
		expect(result.marginalRate).toBe(0.05)

		expect(result.slices[0]).toEqual({
			bracketIndex: 0,
			lowerBound: 0,
			upperBound: 150_000,
			rate: 0.0,
			taxableAmount: 150_000,
			tax: 0,
		})

		expect(result.slices[1]).toEqual({
			bracketIndex: 1,
			lowerBound: 150_000,
			upperBound: 300_000,
			rate: 0.05,
			taxableAmount: 50_000,
			tax: 2500,
		})

		expect(result.slices[2]?.taxableAmount).toBe(0)
		expect(result.slices[2]?.tax).toBe(0)
		expect(result.slices[3]?.taxableAmount).toBe(0)
		expect(result.slices[3]?.tax).toBe(0)
	})

	it("evaluates income in top unbounded bracket", () => {
		// 600,000 income:
		// [0, 150k] @ 0% = 0
		// [150k, 300k] @ 5% = 7,500
		// [300k, 500k] @ 10% = 20,000
		// [500k, inf] @ 15% (100k) = 15,000
		// Total tax = 42,500
		const result = evaluateBrackets(600_000, sampleBrackets)
		expect(result.totalTax).toBe(42_500)
		expect(result.effectiveRate).toBeCloseTo(42_500 / 600_000, 6)
		expect(result.marginalRate).toBe(0.15)
		expect(result.slices[3]?.taxableAmount).toBe(100_000)
		expect(result.slices[3]?.tax).toBe(15_000)
	})

	it("computes marginal rate on boundary transition (next unit)", () => {
		// Exactly at 150,000:
		// Next unit (150,001) will be taxed at 5%
		const boundaryResult = evaluateBrackets(150_000, sampleBrackets)
		expect(boundaryResult.totalTax).toBe(0)
		expect(boundaryResult.marginalRate).toBe(0.05)
	})

	it("computes 0 effective rate when taxable amount is 0", () => {
		const zeroResult = evaluateBrackets(0, sampleBrackets)
		expect(zeroResult.totalTax).toBe(0)
		expect(zeroResult.effectiveRate).toBe(0)
		expect(zeroResult.marginalRate).toBe(0.0)
	})

	it("validates taxable amount boundary conditions", () => {
		expect(() => evaluateBrackets(Number.NaN, sampleBrackets)).toThrow(TaxValidationError)
		expect(() => evaluateBrackets(Number.POSITIVE_INFINITY, sampleBrackets)).toThrow(
			TaxValidationError,
		)
		expect(() => evaluateBrackets(-1000, sampleBrackets)).toThrow(TaxValidationError)
	})
})

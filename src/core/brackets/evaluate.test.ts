import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../money"
import { evaluateBrackets } from "./evaluate"
import type { TaxBracket } from "./types"

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
	})

	it("computes progressive slices correctly across multiple tiers", () => {
		const result = evaluateBrackets(200_000, sampleBrackets)
		expect(result.totalTax).toBe(2500)
		expect(result.effectiveRate).toBeCloseTo(2500 / 200_000, 6)
		expect(result.marginalRate).toBe(0.05)
		expect(result.slices[0]?.tax).toBe(0)
		expect(result.slices[1]?.tax).toBe(2500)
	})

	it("computes effective rate based on grossIncome when provided", () => {
		const result = evaluateBrackets(200_000, sampleBrackets, 500_000)
		expect(result.totalTax).toBe(2500)
		expect(result.effectiveRate).toBeCloseTo(2500 / 500_000, 6)
	})

	it("evaluates income in top unbounded bracket", () => {
		const result = evaluateBrackets(600_000, sampleBrackets)
		expect(result.totalTax).toBe(42_500)
		expect(result.marginalRate).toBe(0.15)
	})

	it("validates statutory bracket configurations strictly", () => {
		expect(() => evaluateBrackets(100_000, [])).toThrow(TaxValidationError)

		// Non-monotonic bounds
		expect(() =>
			evaluateBrackets(100_000, [
				{ upTo: 300_000, rate: 0.05 },
				{ upTo: 200_000, rate: 0.1 },
				{ upTo: null, rate: 0.15 },
			]),
		).toThrow(TaxValidationError)

		// Non-terminal null
		expect(() =>
			evaluateBrackets(100_000, [
				{ upTo: null, rate: 0.05 },
				{ upTo: 500_000, rate: 0.1 },
			]),
		).toThrow(TaxValidationError)

		// Non-integer bounds
		expect(() =>
			evaluateBrackets(100_000, [
				{ upTo: 150_000.5, rate: 0.05 },
				{ upTo: null, rate: 0.1 },
			]),
		).toThrow(TaxValidationError)

		// Missing trailing null
		expect(() =>
			evaluateBrackets(100_000, [
				{ upTo: 150_000, rate: 0.0 },
				{ upTo: 300_000, rate: 0.05 },
			]),
		).toThrow(TaxValidationError)
	})
})

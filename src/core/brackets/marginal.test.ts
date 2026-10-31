import { describe, expect, it } from "bun:test"
import { marginalRateAt } from "./marginal"
import type { TaxBracket } from "./types"

describe("Marginal Rate evaluator (marginalRateAt)", () => {
	const sampleBrackets: readonly TaxBracket[] = [
		{ upTo: 150_000, rate: 0.0 },
		{ upTo: 300_000, rate: 0.05 },
		{ upTo: 500_000, rate: 0.1 },
		{ upTo: null, rate: 0.15 },
	]

	it("computes marginal rate within initial bracket tier", () => {
		expect(marginalRateAt(sampleBrackets, 50_000)).toBe(0.0)
	})

	it("computes marginal rate on boundary transition", () => {
		expect(marginalRateAt(sampleBrackets, 150_001)).toBe(0.05)
		expect(marginalRateAt(sampleBrackets, 300_001)).toBe(0.1)
		expect(marginalRateAt(sampleBrackets, 500_001)).toBe(0.15)
	})
})

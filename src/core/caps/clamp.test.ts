import { describe, expect, it } from "bun:test"
import { clampCap } from "./clamp"
import { resolveCap } from "./resolve"

describe("Statutory Cap clamping helper (clampCap)", () => {
	it("returns allowed equal to requested when below cap", () => {
		const result = clampCap(50_000, 100_000)
		expect(result).toEqual({
			requested: 50_000,
			allowed: 50_000,
			cap: 100_000,
			wasClamped: false,
		})
	})

	it("clamps to cap when requested exceeds statutory ceiling", () => {
		const result = clampCap(150_000, 100_000)
		expect(result).toEqual({
			requested: 150_000,
			allowed: 100_000,
			cap: 100_000,
			wasClamped: true,
		})
	})

	it("resolves percentage-based statutory cap with ceiling", () => {
		const cap = resolveCap({
			base: 300_000,
			rate: 0.5,
			ceiling: 100_000,
		})
		expect(cap).toBe(100_000)

		const result = clampCap(120_000, {
			base: 300_000,
			rate: 0.5,
			ceiling: 100_000,
		})
		expect(result.allowed).toBe(100_000)
		expect(result.wasClamped).toBe(true)

		// Non-integer base without currency specified
		const nonIntCap = resolveCap({
			base: 100.5,
			rate: 0.1,
		})
		expect(nonIntCap).toBe(10)

		// Base with currency specified
		const currencyCap = resolveCap({
			base: 100.5,
			rate: 0.1,
			currency: "THB",
		})
		expect(currencyCap).toBe(10.05)
	})
})

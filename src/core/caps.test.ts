import { describe, expect, it } from "bun:test"
import { clampCap } from "./caps"
import { TaxValidationError } from "./money"

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

	it("returns allowed equal to requested when exactly at cap", () => {
		const result = clampCap(100_000, 100_000)
		expect(result).toEqual({
			requested: 100_000,
			allowed: 100_000,
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

	it("clamps with percentage-based statutory cap", () => {
		// 15% of 1,000,000 assessable income = 150,000 cap
		const result = clampCap(160_000, {
			base: 1_000_000,
			rate: 0.15,
		})
		expect(result).toEqual({
			requested: 160_000,
			allowed: 150_000,
			cap: 150_000,
			wasClamped: true,
		})
	})

	it("clamps with percentage cap combined with ceiling", () => {
		// 50% of 300,000 = 150,000, but ceiling is 100,000 -> effective cap is 100,000
		const result = clampCap(120_000, {
			base: 300_000,
			rate: 0.5,
			ceiling: 100_000,
		})
		expect(result).toEqual({
			requested: 120_000,
			allowed: 100_000,
			cap: 100_000,
			wasClamped: true,
		})
	})

	it("validates requested and cap amounts", () => {
		expect(() => clampCap(Number.NaN, 100_000, "allowance")).toThrow(TaxValidationError)
		expect(() => clampCap(-500, 100_000, "allowance")).toThrow(TaxValidationError)
		expect(() => clampCap(500, -100, "cap")).toThrow(TaxValidationError)
		expect(() => clampCap(500, Number.NaN, "cap")).toThrow(TaxValidationError)
	})
})

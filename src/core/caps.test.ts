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

	it("validates requested and cap amounts", () => {
		expect(() => clampCap(Number.NaN, 100_000, "allowance")).toThrow(TaxValidationError)
		expect(() => clampCap(-500, 100_000, "allowance")).toThrow(TaxValidationError)
		expect(() => clampCap(500, -100, "cap")).toThrow(TaxValidationError)
		expect(() => clampCap(500, Number.NaN, "cap")).toThrow(TaxValidationError)
	})
})

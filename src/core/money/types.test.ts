import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "./errors"
import { money, thb, usd } from "./types"

describe("Branded Money constructors", () => {
	it("creates branded money values", () => {
		const salary = thb(60_000)
		const price = usd(49.99)
		const yen = money(10_000, "JPY")

		expect(Number(salary)).toBe(60_000)
		expect(Number(price)).toBe(49.99)
		expect(Number(yen)).toBe(10_000)
		expect(salary).toBe(thb(60_000))
		expect(price).toBe(usd(49.99))
		expect(yen).toBe(money(10_000, "JPY"))
	})

	it("validates boundary inputs in branded money helpers", () => {
		expect(() => thb(Number.NaN)).toThrow(TaxValidationError)
		expect(() => usd(-10)).toThrow(TaxValidationError)
		expect(() => money(Number.POSITIVE_INFINITY, "JPY")).toThrow(TaxValidationError)
	})
})

import { describe, expect, it } from "bun:test"
import { CURRENCIES, getCurrencyPrecision } from "./currency"

describe("ISO 4217 Currency Precision Table", () => {
	it("provides correct precision for standard currencies", () => {
		expect(CURRENCIES.THB.precision).toBe(2)
		expect(CURRENCIES.USD.precision).toBe(2)
		expect(CURRENCIES.JPY.precision).toBe(0)
		expect(CURRENCIES.KWD.precision).toBe(3)
		expect(CURRENCIES.EUR.precision).toBe(2)
		expect(CURRENCIES.GBP.precision).toBe(2)
	})

	it("retrieves currency precision via helper and ignores prototype keys", () => {
		expect(getCurrencyPrecision("THB")).toBe(2)
		expect(getCurrencyPrecision("USD")).toBe(2)
		expect(getCurrencyPrecision("JPY")).toBe(0)
		expect(getCurrencyPrecision("KWD")).toBe(3)
		expect(getCurrencyPrecision("UNKNOWN")).toBe(2)
		expect(getCurrencyPrecision("toString")).toBe(2)
		expect(getCurrencyPrecision("constructor")).toBe(2)
	})
})

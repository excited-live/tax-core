import { describe, expect, it } from "bun:test"
import {
	applyPercentage,
	CURRENCIES,
	fromMinorUnits,
	getCurrencyPrecision,
	money,
	roundHalfUp,
	TaxValidationError,
	thb,
	toMinorUnits,
	usd,
	validateMonetaryAmount,
} from "./money"

describe("ISO 4217 Currency Precision Table", () => {
	it("provides correct precision for standard currencies", () => {
		expect(CURRENCIES.THB.precision).toBe(2)
		expect(CURRENCIES.USD.precision).toBe(2)
		expect(CURRENCIES.JPY.precision).toBe(0)
		expect(CURRENCIES.KWD.precision).toBe(3)
		expect(CURRENCIES.EUR.precision).toBe(2)
		expect(CURRENCIES.GBP.precision).toBe(2)
	})

	it("retrieves currency precision via helper", () => {
		expect(getCurrencyPrecision("THB")).toBe(2)
		expect(getCurrencyPrecision("USD")).toBe(2)
		expect(getCurrencyPrecision("JPY")).toBe(0)
		expect(getCurrencyPrecision("KWD")).toBe(3)
		expect(getCurrencyPrecision("UNKNOWN")).toBe(2)
	})
})

describe("Branded Money constructors", () => {
	it("creates branded money values", () => {
		const salary = thb(60_000)
		const price = usd(49.99)
		const yen = money(10_000, "JPY")

		expect(salary).toBe(60_000)
		expect(price).toBe(49.99)
		expect(yen).toBe(10_000)
	})
})

describe("Minor Unit conversions without floating-point drift", () => {
	it("converts 2-decimal currencies to integer minor units without float drift", () => {
		// 1.14 * 100 in native IEEE 754 float evaluates to 113.99999999999999
		expect(toMinorUnits(1.14, "USD")).toBe(114)
		// 0.07 * 100 in native IEEE 754 float evaluates to 7.000000000000001
		expect(toMinorUnits(0.07, "USD")).toBe(7)
		// Standard Thai Baht to Satang
		expect(toMinorUnits(10.55, "THB")).toBe(1055)
		expect(toMinorUnits(thb(100_000.5), "THB")).toBe(10_000_050)
	})

	it("converts 0-decimal currencies (JPY) correctly", () => {
		expect(toMinorUnits(100, "JPY")).toBe(100)
		expect(toMinorUnits(2500, "JPY")).toBe(2500)
	})

	it("converts 3-decimal currencies (KWD) correctly", () => {
		expect(toMinorUnits(1.234, "KWD")).toBe(1234)
	})

	it("converts from integer minor units back to major units", () => {
		expect(fromMinorUnits(114, "USD")).toBe(1.14)
		expect(fromMinorUnits(7, "USD")).toBe(0.07)
		expect(fromMinorUnits(1055, "THB")).toBe(10.55)
		expect(fromMinorUnits(100, "JPY")).toBe(100)
		expect(fromMinorUnits(1234, "KWD")).toBe(1.234)
	})

	it("handles fractional rounding at minor-unit boundary", () => {
		expect(toMinorUnits(10.555, "THB")).toBe(1056)
		expect(toMinorUnits(10.554, "THB")).toBe(1055)
	})
})

describe("Rounding & percentage application", () => {
	it("performs half-up rounding on numbers", () => {
		expect(roundHalfUp(1.4)).toBe(1)
		expect(roundHalfUp(1.5)).toBe(2)
		expect(roundHalfUp(2.5)).toBe(3)
		expect(roundHalfUp(-1.5)).toBe(-1)
	})

	it("applies statutory percentage in minor units with various rounding modes", () => {
		// 5% of 100.00 THB (10000 satang) = 500 satang
		expect(applyPercentage(10_000, 0.05)).toBe(500)
		// 33.333% of 1000 satang = 333 satang
		expect(applyPercentage(1000, 0.33333)).toBe(333)
		// Floor and ceil modes
		expect(applyPercentage(100, 0.025, "floor")).toBe(2)
		expect(applyPercentage(100, 0.025, "ceil")).toBe(3)
		expect(applyPercentage(100, 0.025, "half-up")).toBe(3)
	})
})

describe("Boundary validation and TaxValidationError", () => {
	it("throws TaxValidationError on NaN", () => {
		expect(() => validateMonetaryAmount(Number.NaN, "income")).toThrow(TaxValidationError)
		try {
			validateMonetaryAmount(Number.NaN, "salary")
		} catch (e) {
			const err = e as TaxValidationError
			expect(err.name).toBe("TaxValidationError")
			expect(err.field).toBe("salary")
			expect(Number.isNaN(err.value as number)).toBe(true)
			expect(err.reason).toContain("NaN")
		}
	})

	it("throws TaxValidationError on Infinity", () => {
		expect(() => validateMonetaryAmount(Number.POSITIVE_INFINITY, "bonus")).toThrow(
			TaxValidationError,
		)
		expect(() => validateMonetaryAmount(Number.NEGATIVE_INFINITY, "bonus")).toThrow(
			TaxValidationError,
		)
	})

	it("throws TaxValidationError on negative amounts when not allowed", () => {
		expect(() => validateMonetaryAmount(-100, "deduction")).toThrow(TaxValidationError)
		try {
			validateMonetaryAmount(-50, "expense")
		} catch (e) {
			const err = e as TaxValidationError
			expect(err.field).toBe("expense")
			expect(err.value).toBe(-50)
			expect(err.reason).toContain("negative")
		}
	})

	it("allows negative numbers when allowNegative option is true", () => {
		expect(() =>
			validateMonetaryAmount(-100, "netTaxPayable", { allowNegative: true }),
		).not.toThrow()
	})

	it("toMinorUnits enforces boundary validation", () => {
		expect(() => toMinorUnits(Number.NaN, "THB")).toThrow(TaxValidationError)
		expect(() => toMinorUnits(Number.POSITIVE_INFINITY, "USD")).toThrow(TaxValidationError)
		expect(() => toMinorUnits(-50, "THB")).toThrow(TaxValidationError)
	})
})

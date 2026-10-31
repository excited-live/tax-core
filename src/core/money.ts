export type StandardCurrencyCode = "THB" | "USD" | "JPY" | "KWD" | "EUR" | "GBP"

export type CurrencyCode = StandardCurrencyCode | (string & {})

export interface CurrencyInfo {
	readonly code: CurrencyCode
	readonly precision: number
	readonly minorUnitName?: string
}

export const CURRENCIES: Record<StandardCurrencyCode, CurrencyInfo> = {
	THB: { code: "THB", precision: 2, minorUnitName: "satang" },
	USD: { code: "USD", precision: 2, minorUnitName: "cent" },
	JPY: { code: "JPY", precision: 0, minorUnitName: "yen" },
	KWD: { code: "KWD", precision: 3, minorUnitName: "fils" },
	EUR: { code: "EUR", precision: 2, minorUnitName: "cent" },
	GBP: { code: "GBP", precision: 2, minorUnitName: "penny" },
}

export function getCurrencyPrecision(currency: CurrencyCode): number {
	if (currency in CURRENCIES) {
		return CURRENCIES[currency as StandardCurrencyCode].precision
	}
	return 2
}

export type Money<C extends CurrencyCode = CurrencyCode> = number & {
	readonly __currencyBrand?: C
}

export function money<C extends CurrencyCode>(amount: number, _currency?: C): Money<C> {
	return amount as Money<C>
}

export function thb(amount: number): Money<"THB"> {
	return amount as Money<"THB">
}

export function usd(amount: number): Money<"USD"> {
	return amount as Money<"USD">
}

export class TaxValidationError extends Error {
	readonly field: string
	readonly value: unknown
	readonly reason: string

	constructor(field: string, value: unknown, reason: string) {
		super(`Tax validation error on field '${field}': ${reason} (received: ${String(value)})`)
		this.name = "TaxValidationError"
		this.field = field
		this.value = value
		this.reason = reason
		Object.setPrototypeOf(this, TaxValidationError.prototype)
	}
}

export interface ValidateAmountOptions {
	readonly allowNegative?: boolean
}

export function validateMonetaryAmount(
	value: number,
	field: string,
	options?: ValidateAmountOptions,
): void {
	if (Number.isNaN(value)) {
		throw new TaxValidationError(field, value, "Value cannot be NaN")
	}
	if (!Number.isFinite(value)) {
		throw new TaxValidationError(field, value, "Value must be a finite number")
	}
	if (!options?.allowNegative && value < 0) {
		throw new TaxValidationError(field, value, "Value cannot be negative")
	}
}

export function roundHalfUp(value: number): number {
	return Math.round(value)
}

export function toMinorUnits(amount: number, currency: CurrencyCode, field = "amount"): number {
	validateMonetaryAmount(amount, field)
	const precision = getCurrencyPrecision(currency)
	if (precision === 0) {
		return Math.round(amount)
	}
	const factor = 10 ** precision
	return Math.round(amount * factor)
}

export function fromMinorUnits(minorUnits: number, currency: CurrencyCode): number {
	const precision = getCurrencyPrecision(currency)
	if (precision === 0) {
		return minorUnits
	}
	const factor = 10 ** precision
	return Number((minorUnits / factor).toFixed(precision))
}

export type RoundingMode = "half-up" | "floor" | "ceil"

export function applyPercentage(
	minorUnits: number,
	rate: number,
	rounding: RoundingMode = "half-up",
): number {
	const raw = minorUnits * rate
	if (rounding === "floor") {
		return Math.floor(raw)
	}
	if (rounding === "ceil") {
		return Math.ceil(raw)
	}
	return roundHalfUp(raw)
}

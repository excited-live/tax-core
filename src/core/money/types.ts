import type { CurrencyCode } from "./currency"
import { type ValidateAmountOptions, validateMonetaryAmount } from "./validate"

/**
 * Branded nominal type representing a monetary value in a specific currency.
 * Enforces compile-time type safety preventing accidental cross-currency mixing.
 */
export type Money<C extends CurrencyCode = CurrencyCode> = number & {
	readonly __currencyBrand: C
}

/**
 * Constructs a branded Money value with immediate input boundary validation.
 *
 * @param amount Numerical amount in major units.
 * @param _currency Currency code tag.
 * @param field Diagnostic field name.
 * @param options Validation options.
 * @returns Branded Money value.
 * @throws {TaxValidationError} if amount is NaN, infinite, or negative without allowNegative.
 */
export function money<C extends CurrencyCode>(
	amount: number,
	_currency?: C,
	field = "amount",
	options?: ValidateAmountOptions,
): Money<C> {
	validateMonetaryAmount(amount, field, options)
	return amount as Money<C>
}

/**
 * Constructs a branded Thai Baht (THB) money value with input boundary validation.
 *
 * @param amount Amount in Baht.
 * @param field Diagnostic field name.
 * @param options Validation options.
 * @returns Branded Money<"THB"> value.
 * @throws {TaxValidationError} if amount is NaN, infinite, or negative without allowNegative.
 */
export function thb(
	amount: number,
	field = "amount",
	options?: ValidateAmountOptions,
): Money<"THB"> {
	validateMonetaryAmount(amount, field, options)
	return amount as Money<"THB">
}

/**
 * Constructs a branded US Dollar (USD) money value with input boundary validation.
 *
 * @param amount Amount in Dollars.
 * @param field Diagnostic field name.
 * @param options Validation options.
 * @returns Branded Money<"USD"> value.
 * @throws {TaxValidationError} if amount is NaN, infinite, or negative without allowNegative.
 */
export function usd(
	amount: number,
	field = "amount",
	options?: ValidateAmountOptions,
): Money<"USD"> {
	validateMonetaryAmount(amount, field, options)
	return amount as Money<"USD">
}

import { type ValidateAmountOptions, validateIntegerMinorUnits, validateRate } from "./validate"

/**
 * Supported rounding modes for statutory tax computations.
 */
export type RoundingMode = "half-up" | "floor" | "ceil"

/**
 * Rounds a number to the nearest integer, breaking ties away from zero (standard half-up).
 *
 * Math: Rounds fractional halves away from zero (e.g. 1.5 -> 2, -1.5 -> -2).
 *
 * @param value Floating-point value.
 * @returns Rounded integer.
 */
export function roundHalfUp(value: number): number {
	if (value < 0) {
		const res = -Math.round(Math.abs(value))
		return res + 0
	}
	return Math.round(value) + 0
}

function parseRateRational(rate: number): { num: bigint; den: bigint } {
	const rateStr = rate.toString().includes("e")
		? rate.toFixed(10).replace(/\.?0+$/, "")
		: rate.toString()
	const parts = rateStr.split(".")
	const decimals = parts[1] ? parts[1].length : 0
	return {
		num: BigInt(parts.join("")),
		den: 10n ** BigInt(decimals),
	}
}

/**
 * Applies a statutory percentage rate to an integer minor unit amount using exact rational arithmetic.
 *
 * Math: Exact rational scaling via BigInt `(minorUnits * num + modeAdjust) / den`
 * to eliminate IEEE 754 binary floating-point drift on exact statutory tax rates.
 * Units: Input and output are integer minor units (satang/cents).
 *
 * @param minorUnits Integer minor units amount.
 * @param rate Statutory rate ratio (e.g. 0.05 for 5%, 0.35 for 35%).
 * @param rounding Rounding mode (`half-up`, `floor`, or `ceil`).
 * @param options Validation options (e.g. allowNegative).
 * @returns Computed tax in integer minor units.
 * @throws {TaxValidationError} if minorUnits is not a safe integer or rate is outside [0, 1].
 * @example applyPercentage(90, 0.35) // 32 (exact statutory satang calculation)
 */
export function applyPercentage(
	minorUnits: number,
	rate: number,
	rounding: RoundingMode = "half-up",
	options?: ValidateAmountOptions,
): number {
	validateIntegerMinorUnits(minorUnits, "minorUnits", options)
	validateRate(rate, "rate")

	const { num, den } = parseRateRational(rate)
	const m = BigInt(minorUnits)
	const prod = m * num

	let result: bigint
	if (rounding === "floor") {
		result = prod >= 0n ? prod / den : (prod - (den - 1n)) / den
	} else if (rounding === "ceil") {
		result = prod >= 0n ? (prod + (den - 1n)) / den : prod / den
	} else {
		// half-up: away from zero
		result = prod >= 0n ? (prod * 2n + den) / (den * 2n) : (prod * 2n - den) / (den * 2n)
	}

	return Number(result) + 0
}

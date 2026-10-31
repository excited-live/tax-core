import { validateIntegerMinorUnits, validateRate } from "./validate"

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
		return -Math.round(Math.abs(value))
	}
	return Math.round(value)
}

/**
 * Applies a statutory percentage rate to an integer minor unit amount.
 *
 * Math: `round(minorUnits * rate)` where `rate` is a ratio (0.05 = 5%), not a percent.
 * Units: Input and output are integer minor units (satang/cents).
 *
 * @param minorUnits Integer minor units amount.
 * @param rate Statutory rate ratio (e.g. 0.05 for 5%).
 * @param rounding Rounding mode (`half-up`, `floor`, or `ceil`).
 * @returns Computed tax in integer minor units.
 * @throws {TaxValidationError} if minorUnits is not a safe integer or rate is outside [0, 1].
 * @example applyPercentage(10_000, 0.05) // 500 (5.00 THB tax on 100.00 THB)
 */
export function applyPercentage(
	minorUnits: number,
	rate: number,
	rounding: RoundingMode = "half-up",
): number {
	validateIntegerMinorUnits(minorUnits, "minorUnits")
	validateRate(rate, "rate")

	const raw = minorUnits * rate
	if (rounding === "floor") {
		return Math.floor(raw)
	}
	if (rounding === "ceil") {
		return Math.ceil(raw)
	}
	return roundHalfUp(raw)
}

import { validateMonetaryAmount } from "./money"

export interface ClampedAmount {
	readonly requested: number
	readonly allowed: number
	readonly cap: number
	readonly wasClamped: boolean
}

export function clampCap(requested: number, cap: number, field = "amount"): ClampedAmount {
	validateMonetaryAmount(requested, field)
	validateMonetaryAmount(cap, `${field}Cap`)

	const wasClamped = requested > cap
	const allowed = wasClamped ? cap : requested

	return {
		requested,
		allowed,
		cap,
		wasClamped,
	}
}

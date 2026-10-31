import { applyPercentage, validateMonetaryAmount } from "./money"

export interface ClampedAmount {
	readonly requested: number
	readonly allowed: number
	readonly cap: number
	readonly wasClamped: boolean
}

export interface StatutoryCapOptions {
	readonly base?: number
	readonly rate?: number
	readonly ceiling?: number
	readonly field?: string
}

export function clampCap(
	requested: number,
	capOrOptions: number | StatutoryCapOptions,
	field = "amount",
): ClampedAmount {
	let cap: number
	let fieldName = field

	if (typeof capOrOptions === "number") {
		cap = capOrOptions
	} else {
		fieldName = capOrOptions.field ?? field
		const { base, rate, ceiling } = capOrOptions

		let computedCap = Number.POSITIVE_INFINITY

		if (base !== undefined && rate !== undefined) {
			validateMonetaryAmount(base, `${fieldName}Base`)
			validateMonetaryAmount(rate, `${fieldName}Rate`)
			computedCap = applyPercentage(base, rate)
		}

		if (ceiling !== undefined) {
			validateMonetaryAmount(ceiling, `${fieldName}Ceiling`)
			computedCap = Math.min(computedCap, ceiling)
		}

		if (!Number.isFinite(computedCap)) {
			validateMonetaryAmount(computedCap, `${fieldName}Cap`)
		}

		cap = computedCap
	}

	validateMonetaryAmount(requested, fieldName)
	validateMonetaryAmount(cap, `${fieldName}Cap`)

	const wasClamped = requested > cap
	const allowed = wasClamped ? cap : requested

	return {
		requested,
		allowed,
		cap,
		wasClamped,
	}
}

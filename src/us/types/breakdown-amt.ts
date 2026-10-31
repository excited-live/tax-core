import type { Money } from "../../core/money"

/**
 * Breakdown of Form 6251 Alternative Minimum Tax (AMT).
 *
 * @statute IRC § 55
 */
export interface UsAmtBreakdown {
	readonly taxableIncome: Money<"USD">
	readonly saltAddBack: Money<"USD">
	readonly preferences: Money<"USD">
	readonly amti: Money<"USD">
	readonly baseExemption: Money<"USD">
	readonly phaseoutThreshold: Money<"USD">
	readonly exemptionReduction: Money<"USD">
	readonly allowedExemption: Money<"USD">
	readonly amtTaxableBase: Money<"USD">
	readonly tentativeMinimumTax: Money<"USD">
	readonly regularTax: Money<"USD">
	readonly amtTax: Money<"USD">
}

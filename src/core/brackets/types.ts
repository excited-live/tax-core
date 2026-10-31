/**
 * Specification for a single statutory tax bracket tier.
 */
export interface TaxBracket {
	/** Upper threshold of this bracket tier in integer minor units (or null for unbounded top tier). */
	readonly upTo: number | null
	/** Statutory tax rate ratio for this bracket tier (e.g. 0.05 for 5%). */
	readonly rate: number
}

/**
 * Result of evaluating income falling within a single tax bracket tier.
 */
export interface BracketSlice {
	/** Zero-based index of this bracket tier. */
	readonly bracketIndex: number
	/** Lower income boundary of this slice in minor units. */
	readonly lowerBound: number
	/** Upper income boundary of this slice in minor units (null if top tier). */
	readonly upperBound: number | null
	/** Statutory rate applied to this slice. */
	readonly rate: number
	/** Portions of taxable income falling strictly into this slice. */
	readonly taxableAmount: number
	/** Tax computed for this slice in minor units. */
	readonly tax: number
}

/**
 * Aggregated result of progressive bracket evaluation.
 */
export interface BracketEvaluationResult {
	/** Total progressive tax computed across all slices in integer minor units. */
	readonly totalTax: number
	/** Slice-by-slice detailed breakdown for auditability. */
	readonly slices: readonly BracketSlice[]
	/** Effective tax rate ratio (totalTax / grossIncome, or totalTax / taxableAmount). */
	readonly effectiveRate: number
	/** Marginal tax rate on the next unit of ordinary income. */
	readonly marginalRate: number
}

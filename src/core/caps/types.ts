/**
 * Result of clamping an amount against a statutory cap ceiling.
 */
export interface ClampedAmount {
	/** Original requested or eligible amount before cap. */
	readonly requested: number
	/** Allowed amount after statutory cap clamping. */
	readonly allowed: number
	/** Effective statutory cap applied. */
	readonly cap: number
	/** Whether the requested amount exceeded the cap and was clamped. */
	readonly wasClamped: boolean
}

/**
 * Options defining a percentage-based and/or ceiling-capped statutory limit.
 */
export interface StatutoryCapOptions {
	/** Base amount on which percentage is calculated (e.g. assessable income). */
	readonly base?: number
	/** Statutory percentage rate ratio (e.g. 0.15 for 15%). */
	readonly rate?: number
	/** Absolute monetary ceiling (e.g. 500,000 THB). */
	readonly ceiling?: number
	/** Diagnostic field name for error reporting. */
	readonly field?: string
}

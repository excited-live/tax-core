/**
 * Error thrown when input values violate mathematical boundaries or statutory constraints.
 * Exposes field, raw value, and validation reason for transparency and structured error reporting.
 */
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

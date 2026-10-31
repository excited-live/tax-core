import { TaxValidationError } from "../core/money"
import type { UsFilingStatus, UsTaxInput } from "./types"

const VALID_STATUSES: readonly UsFilingStatus[] = [
	"single",
	"married_filing_jointly",
	"married_filing_separately",
	"head_of_household",
]

export function validateUsInput(input: UsTaxInput): void {
	if (input.taxYear !== undefined && input.taxYear !== 2026) {
		throw new TaxValidationError(
			"taxYear",
			input.taxYear,
			"Unsupported tax year; currently only 2026 is supported",
		)
	}
	if (!VALID_STATUSES.includes(input.filingStatus)) {
		throw new TaxValidationError("filingStatus", input.filingStatus, "Invalid filing status")
	}
}

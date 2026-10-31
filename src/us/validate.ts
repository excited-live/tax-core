import { TaxValidationError } from "../core/money"
import type { UsFilingStatus, UsTaxInput } from "./types"

const VALID_STATUSES: readonly UsFilingStatus[] = [
	"single",
	"married_filing_jointly",
	"married_filing_separately",
	"head_of_household",
]

function checkFiniteNumber(field: string, val: number | undefined): void {
	if (val === undefined) return
	if (typeof val !== "number" || !Number.isFinite(val)) {
		throw new TaxValidationError(field, val, "Must be a finite number")
	}
}

function checkNonNegative(field: string, val: number | undefined): void {
	if (val === undefined) return
	if (typeof val !== "number" || !Number.isFinite(val) || val < 0) {
		throw new TaxValidationError(field, val, "Must be a non-negative finite number")
	}
}

function checkNonNegativeInt(field: string, val: number | undefined): void {
	if (val === undefined) return
	if (typeof val !== "number" || !Number.isSafeInteger(val) || val < 0) {
		throw new TaxValidationError(field, val, "Must be a non-negative integer")
	}
}

function validateCreditsInput(credits: UsTaxInput["credits"]): void {
	if (!credits) return
	checkNonNegativeInt(
		"qualifyingChildrenForChildTaxCredit",
		credits.qualifyingChildrenForChildTaxCredit,
	)
	checkNonNegativeInt("otherDependents", credits.otherDependents)
	checkNonNegativeInt("eitcQualifyingChildren", credits.eitcQualifyingChildren)
	checkNonNegative("eitcInvestmentIncome", credits.eitcInvestmentIncome)
	checkNonNegativeInt("qualifyingIndividualsForCare", credits.qualifyingIndividualsForCare)
	checkNonNegative("childAndDependentCareExpenses", credits.childAndDependentCareExpenses)
	checkNonNegative("foreignTaxCredit", credits.foreignTaxCredit)
	checkNonNegative("customNonRefundableCredits", credits.customNonRefundableCredits)
	checkNonNegative("customRefundableCredits", credits.customRefundableCredits)
	for (const student of credits.educationStudents ?? []) {
		if (!student) {
			throw new TaxValidationError("educationStudents", student, "Invalid student entry")
		}
		checkNonNegative("educationStudent.qualifiedExpenses", student.qualifiedExpenses)
	}
}

/**
 * Validates statutory US tax input parameters against bounds and types.
 */
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
	checkNonNegative("withholding", input.withholding)
	checkNonNegative("amtPreferences", input.amtPreferences)
	checkNonNegative("income.w2Wages", input.income.w2Wages)
	// Self-employment may be negative for Schedule C net business losses
	checkFiniteNumber("income.selfEmploymentNetEarnings", input.income.selfEmploymentNetEarnings)
	validateCreditsInput(input.credits)
}

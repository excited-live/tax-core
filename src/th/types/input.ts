import type { ThAllowancesInput } from "./allowances"
import type { ThFilingStatus } from "./filing-status"
import type { ThAssessableIncomeInput } from "./income"
import type { ThRealEstateTransferInput, ThSeparateSheetInput } from "./special-input"

/**
 * Top-level input schema for Thailand Personal Income Tax calculation.
 */
export interface ThTaxInput {
	/** Tax year governing this calculation (defaults to 2026). */
	readonly taxYear?: 2026
	/** Filing status governing personal/family allowances (defaults to "single"). */
	readonly filingStatus?: ThFilingStatus
	/** Section 40(1)–40(8) assessable income categories. */
	readonly income?: ThAssessableIncomeInput
	/** Personal, family, insurance, retirement, and donation allowances. */
	readonly allowances?: ThAllowancesInput
	/** Section 48(5) one-time severance/retirement lump sum (ใบแนบ ภ.ง.ด.90/91). */
	readonly separateSheet?: ThSeparateSheetInput
	/** Section 48(4) real estate transfer taxed separately. */
	readonly realEstateTransfer?: ThRealEstateTransferInput
	/** Withholding tax already paid at source. */
	readonly withholdingTax?: number
}

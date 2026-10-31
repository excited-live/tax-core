import type { BracketEvaluationResult } from "../../core/brackets"
import type { ThFinalWithholdingElection } from "./special-input"

/** Final withholding detail for one Section 40(4) source. Units: THB major units. */
export interface ThFinalWithholdingSourceBreakdown {
	readonly election: ThFinalWithholdingElection
	readonly amount: number
	readonly rate: number
	/** Tax withheld at source; zero unless the election is `"final"`. */
	readonly tax: number
}

/** Section 40(4) final withholding audit trail. Units: THB major units. */
export interface ThFinalWithholdingBreakdown {
	readonly interest: ThFinalWithholdingSourceBreakdown
	readonly dividends: ThFinalWithholdingSourceBreakdown
	readonly digitalAssets: ThFinalWithholdingSourceBreakdown
	/** Sum of amounts elected `"final"` (excluded from regular brackets). */
	readonly totalAmount: number
	readonly totalTax: number
}

/** Section 47 bis dividend tax credit audit trail. Units: THB major units. */
export interface ThDividendTaxCreditBreakdown {
	readonly isApplicable: boolean
	readonly dividendAmount: number
	readonly corpTaxRate: number
	readonly credit: number
	readonly grossedUpAmount: number
}

/** Section 48(5) separate sheet audit trail. Units: THB major units. */
export interface ThSeparateSheetBreakdown {
	readonly amount: number
	readonly yearsOfService: number
	readonly lastDailyWage: number
	readonly isEligible: boolean
	/** Lump sum folded into Section 40(1) when ineligible; zero otherwise. */
	readonly addedToSection40_1: number
	readonly wageBasedCap: number
	readonly exemptionCeiling: number
	readonly exemption: number
	readonly remainder: number
	readonly fixedExpense: number
	readonly percentageExpense: number
	readonly netTaxable: number
	readonly brackets: BracketEvaluationResult
	readonly tax: number
}

/** Section 48(4) real estate transfer audit trail. Units: THB major units. */
export interface ThRealEstateBreakdown {
	readonly grossTransferValue: number
	readonly holdingYears: number
	readonly expenseRate: number
	readonly expense: number
	readonly netGain: number
	readonly annualGain: number
	readonly brackets: BracketEvaluationResult
	readonly annualTax: number
	readonly taxBeforeCap: number
	readonly taxCap: number
	readonly wasClamped: boolean
	readonly tax: number
}

/** Combined liability audit trail. Units: THB major units. */
export interface ThCombinedTaxBreakdown {
	/** Regular + separate sheet + real estate + final withholding, before credits. */
	readonly totalCombinedTax: number
	/** Final withholding + dividend credit + input withholding tax. */
	readonly creditsAndPayments: number
	readonly netTaxPayable: number
}

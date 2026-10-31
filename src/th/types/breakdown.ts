import type { BracketEvaluationResult } from "../../core/brackets"
import type { ClampedAmount } from "../../core/caps"
import type {
	ThDividendTaxCreditBreakdown,
	ThFinalWithholdingBreakdown,
	ThRealEstateBreakdown,
	ThSeparateSheetBreakdown,
} from "./special-breakdown"

export interface ThAssessableIncomeBreakdown {
	readonly section40_1: number
	readonly section40_2: number
	readonly section40_3: number
	readonly section40_4: number
	readonly section40_5: number
	readonly section40_6: number
	readonly section40_7: number
	readonly section40_8: number
	readonly total: number
	readonly grossNonEmploymentIncome: number
}

export interface ThExpenseDeductionsBreakdown {
	readonly section40_1_2: ClampedAmount
	readonly section40_3: ClampedAmount
	readonly section40_4: ClampedAmount
	readonly section40_5: ClampedAmount
	readonly section40_6: ClampedAmount
	readonly section40_7: ClampedAmount
	readonly section40_8: ClampedAmount
	readonly total: number
}

export interface ThRetirementClusterBreakdown {
	readonly rmf: ClampedAmount
	readonly ssf: ClampedAmount
	readonly pvd: ClampedAmount
	readonly gpf: ClampedAmount
	readonly nsf: ClampedAmount
	readonly pensionLifeInsurance: ClampedAmount
	readonly combined: ClampedAmount
}

export interface ThDonationsBreakdown {
	readonly donation2x: ClampedAmount
	readonly donation1x: ClampedAmount
	readonly total: number
}

export interface ThAllowancesBreakdown {
	readonly personal: ClampedAmount
	readonly spouse: ClampedAmount
	readonly children: ClampedAmount
	readonly parents: ClampedAmount
	readonly disabled: ClampedAmount
	readonly socialSecurity: ClampedAmount
	readonly lifeInsurance: ClampedAmount
	readonly parentHealthInsurance: ClampedAmount
	readonly spouseLifeInsurance: ClampedAmount
	readonly mortgageInterest: ClampedAmount
	readonly retirementCluster: ThRetirementClusterBreakdown
	readonly thaiEsg: ClampedAmount
	readonly donations: ThDonationsBreakdown
	readonly total: number
}

export interface ThMinimumGrossTaxBreakdown {
	readonly grossEligibleIncome: number
	readonly rate: number
	readonly calculatedTax: number
	readonly threshold: number
	readonly isApplicable: boolean
	readonly wasApplied: boolean
}

export interface ThBreakdown {
	readonly assessableIncome: ThAssessableIncomeBreakdown
	readonly expenseDeductions: ThExpenseDeductionsBreakdown
	readonly netIncomeAfterExpenses: number
	readonly allowances: ThAllowancesBreakdown
	readonly netTaxableIncome: number
	readonly progressiveTax: number
	readonly progressiveBrackets: BracketEvaluationResult
	readonly minimumGrossTax: ThMinimumGrossTaxBreakdown
	readonly withholdingTax: number
	readonly netTaxPayable: number
	/** Regular-schedule tax: max(progressive, minimum gross tax). */
	readonly regularTax: number
	readonly separateSheet: ThSeparateSheetBreakdown
	readonly realEstate: ThRealEstateBreakdown
	readonly finalWithholding: ThFinalWithholdingBreakdown
	readonly dividendTaxCredit: ThDividendTaxCreditBreakdown
	readonly totalCombinedTax: number
}

import type { BracketSlice } from "../../core/brackets"
import type { ClampedAmount } from "../../core/caps"
import type { Money } from "../../core/money"

/**
 * Audit slice for Long-Term Capital Gains & Qualified Dividends preferential stacking.
 *
 * @statute IRC § 1(h)
 */
export interface UsPreferentialSlice {
	readonly tier: number
	readonly rate: number
	readonly taxableAmount: Money<"USD">
	readonly tax: Money<"USD">
}

/**
 * Breakdown of Standard Deduction evaluation including additional amounts for age and blindness.
 *
 * @statute IRC § 63(c), § 63(f)
 */
export interface UsStandardDeductionBreakdown {
	readonly base: Money<"USD">
	readonly additionalConditionsCount: number
	readonly additionalPerCondition: Money<"USD">
	readonly additionalTotal: Money<"USD">
	readonly total: Money<"USD">
}

/**
 * Breakdown of Schedule A Itemized Deductions audit trail.
 *
 * @statute IRC §§ 164, 170, 213
 */
export interface UsItemizedBreakdown {
	readonly medical: ClampedAmount
	readonly salt: ClampedAmount
	readonly mortgageInterest: Money<"USD">
	readonly charity: ClampedAmount
	readonly total: Money<"USD">
}

/**
 * Breakdown of Schedule 1 Above-the-Line Adjustments to income.
 *
 * @statute IRC § 62
 */
export interface UsAdjustmentsBreakdown {
	readonly educatorExpenses: ClampedAmount
	readonly hsa: ClampedAmount
	readonly traditionalIra: ClampedAmount
	readonly studentLoanInterest: ClampedAmount
	readonly preTaxDeferrals401k: ClampedAmount
	readonly deductibleSelfEmploymentTax: Money<"USD">
	readonly totalAdjustments: Money<"USD">
}

/**
 * Breakdown of Net Investment Income Tax (NIIT) computation.
 *
 * @statute IRC § 1411
 */
export interface UsNiitBreakdown {
	readonly netInvestmentIncome: Money<"USD">
	readonly magi: Money<"USD">
	readonly threshold: Money<"USD">
	readonly excessMagi: Money<"USD">
	readonly subjectAmount: Money<"USD">
	readonly tax: Money<"USD">
}

/**
 * Detailed audit trail breakdown for US Federal Individual Income Tax calculation.
 *
 * @statute IRC § 1 et seq.
 */
export interface UsTaxBreakdown {
	readonly ordinaryGrossIncome: Money<"USD">
	readonly preferentialGrossIncome: Money<"USD">
	readonly grossIncome: Money<"USD">
	readonly adjustments: UsAdjustmentsBreakdown
	readonly agi: Money<"USD">
	readonly electedDeduction: "standard" | "itemized"
	readonly standardDeduction: UsStandardDeductionBreakdown
	readonly itemizedDeductions?: UsItemizedBreakdown | undefined
	readonly allowableDeduction: Money<"USD">
	readonly ordinaryTaxableIncome: Money<"USD">
	readonly preferentialTaxableIncome: Money<"USD">
	readonly taxableIncome: Money<"USD">
	readonly ordinaryTax: Money<"USD">
	readonly ordinarySlices: readonly BracketSlice[]
	readonly preferentialTax: Money<"USD">
	readonly preferentialSlices: readonly UsPreferentialSlice[]
	readonly regularIncomeTax: Money<"USD">
	readonly niit: UsNiitBreakdown
	readonly totalTax: Money<"USD">
	readonly withholding: Money<"USD">
	readonly netTaxPayable: Money<"USD">
}

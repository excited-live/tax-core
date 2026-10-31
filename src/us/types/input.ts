/**
 * Four statutory US Federal individual income tax filing statuses.
 *
 * @statute IRC § 1
 */
export type UsFilingStatus =
	| "single"
	| "married_filing_jointly"
	| "married_filing_separately"
	| "head_of_household"

/**
 * Gross income components categorized by ordinary vs preferential tax treatment.
 *
 * Units: Amounts in major currency units ($ USD).
 * @statute IRC § 61, § 1(h)
 */
export interface UsIncomeInput {
	/** W-2 wage and salary earnings. */
	readonly w2Wages?: number
	/** Net self-employment business profit or earnings. */
	readonly selfEmploymentNetEarnings?: number
	/** Ordinary interest income. */
	readonly ordinaryInterest?: number
	/** Non-qualified / ordinary dividends. */
	readonly ordinaryDividends?: number
	/** Net short-term capital gains (taxed at ordinary rates). */
	readonly shortTermCapitalGains?: number
	/** Rental, royalty, partnership, or other ordinary income. */
	readonly rentalAndOtherOrdinaryIncome?: number
	/** Net long-term capital gains (eligible for preferential rates). */
	readonly longTermCapitalGains?: number
	/** Qualified dividend income (eligible for preferential rates). */
	readonly qualifiedDividends?: number
}

/**
 * Schedule 1 Above-the-Line Adjustments to gross income to arrive at AGI.
 *
 * Units: Amounts in major currency units ($ USD).
 * @statute IRC § 62, § 219, § 223, § 221
 */
export interface UsAdjustmentsInput {
	/** Qualified educator expenses (clamped to statutory cap). */
	readonly educatorExpenses?: number
	/** Flag indicating both spouses on MFJ return are qualifying educators ($700 combined cap). */
	readonly bothSpousesEducators?: boolean
	/** Traditional HSA contributions. */
	readonly hsaContributions?: number
	/** High-deductible health plan coverage type for HSA limit. Default is "self_only". */
	readonly hsaCoverageType?: "self_only" | "family"
	/** Traditional IRA contributions. */
	readonly traditionalIraContributions?: number
	/** Qualified student loan interest paid. */
	readonly studentLoanInterest?: number
	/** Traditional 401(k), 403(b), or 457 elective pre-tax deferrals. */
	readonly preTaxDeferrals401k?: number
	/** Whether taxpayer is age 50 or older (allows 401(k) and IRA catch-up contributions). */
	readonly age50OrOlder?: boolean
	/** Whether taxpayer is age 55 or older (allows HSA catch-up contribution). */
	readonly age55OrOlder?: boolean
	/** Deductible 50% portion of self-employment tax from Schedule SE. */
	readonly deductibleSelfEmploymentTax?: number
}

/**
 * Schedule A Itemized Deductions subject to statutory floors and caps.
 *
 * Units: Amounts in major currency units ($ USD).
 * @statute IRC §§ 164, 170, 213
 */
export interface UsItemizedDeductionsInput {
	/** Unreimbursed medical and dental expenses (subject to 7.5% AGI floor). */
	readonly medicalExpenses?: number
	/** State and local income/sales and property taxes (SALT, subject to statutory cap). */
	readonly stateAndLocalTaxes?: number
	/** Qualified residence mortgage interest. */
	readonly mortgageInterest?: number
	/** Qualified charitable contributions (subject to statutory AGI percentage ceiling). */
	readonly charitableContributions?: number
}

/**
 * Complete statutory input for US Federal Individual Income Tax calculation.
 *
 * @statute IRC § 1 et seq.
 */
export interface UsTaxInput {
	/** Applicable tax year. Defaults to 2026. */
	readonly taxYear?: 2026 | number
	/** US Federal filing status. */
	readonly filingStatus: UsFilingStatus
	/** Categorized gross income sources. */
	readonly income: UsIncomeInput
	/** Schedule 1 Above-the-Line Adjustments to income. */
	readonly adjustments?: UsAdjustmentsInput
	/** Schedule A Itemized deductions. */
	readonly itemizedDeductions?: UsItemizedDeductionsInput
	/** Deduction method election. Default is "auto" (selects higher). */
	readonly deductionElection?: "auto" | "standard" | "itemized"
	/** Taxpayer is age 65 or older before end of tax year. */
	readonly taxpayerAge65OrOlder?: boolean
	/** Taxpayer is legally blind. */
	readonly taxpayerBlind?: boolean
	/** Spouse is age 65 or older before end of tax year (MFJ/MFS only). */
	readonly spouseAge65OrOlder?: boolean
	/** Spouse is legally blind (MFJ/MFS only). */
	readonly spouseBlind?: boolean
	/** Federal income tax withheld or pre-paid. */
	readonly withholding?: number
	/** Net investment income override for NIIT calculation. */
	readonly netInvestmentIncome?: number
	/** Modified Adjusted Gross Income (MAGI) override for NIIT calculation. */
	readonly magi?: number
}

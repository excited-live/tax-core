/**
 * Qualifying education expense item per student for Education Credits (Form 8863).
 *
 * @statute IRC § 25A
 */
export interface UsEducationCreditStudent {
	/** Education credit type elected: American Opportunity (AOTC) or Lifetime Learning (LLC). */
	readonly type: "aotc" | "llc"
	/** Adjusted qualified education expenses paid during the tax year. */
	readonly qualifiedExpenses: number
}

/**
 * Statutory federal tax credits inputs.
 *
 * Units: Amounts in major currency units ($ USD) and integer counts.
 * @statute IRC §§ 21, 24, 25A, 32, 901
 */
export interface UsCreditsInput {
	/** Number of qualifying children under age 17 for Child Tax Credit (CTC). */
	readonly qualifyingChildrenForChildTaxCredit?: number
	/** Number of other qualifying dependents for Other Dependent Credit (ODC). */
	readonly otherDependents?: number
	/** Number of qualifying children for Earned Income Tax Credit (EITC: 0, 1, 2, 3+). */
	readonly eitcQualifyingChildren?: 0 | 1 | 2 | 3 | number
	/** Disqualifying investment income test for EITC. */
	readonly eitcInvestmentIncome?: number
	/** Qualified child and dependent care expenses paid (Form 2441). */
	readonly childAndDependentCareExpenses?: number
	/** Number of qualifying individuals for child and dependent care credit (1 or 2+). */
	readonly qualifyingIndividualsForCare?: number
	/** Qualified education expenses per student (Form 8863). */
	readonly educationStudents?: readonly UsEducationCreditStudent[]
	/** Foreign taxes paid or accrued eligible for Foreign Tax Credit (Form 1116). */
	readonly foreignTaxCredit?: number
	/** Custom non-refundable credits offsetting income and AMT tax. */
	readonly customNonRefundableCredits?: number
	/** Custom refundable credits offsetting total tax liability. */
	readonly customRefundableCredits?: number
}

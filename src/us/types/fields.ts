/**
 * Diagnostic and reporting field identifiers for US income sources.
 */
export enum UsIncomeField {
	W2Wages = "income.w2Wages",
	SelfEmploymentNetEarnings = "income.selfEmploymentNetEarnings",
	OrdinaryInterest = "income.ordinaryInterest",
	OrdinaryDividends = "income.ordinaryDividends",
	ShortTermCapitalGains = "income.shortTermCapitalGains",
	RentalAndOtherOrdinaryIncome = "income.rentalAndOtherOrdinaryIncome",
	LongTermCapitalGains = "income.longTermCapitalGains",
	QualifiedDividends = "income.qualifiedDividends",
}

/**
 * Diagnostic and reporting field identifiers for Schedule 1 adjustments.
 */
export enum UsAdjustmentField {
	EducatorExpenses = "adjustments.educatorExpenses",
	HsaContributions = "adjustments.hsaContributions",
	TraditionalIra = "adjustments.traditionalIra",
	StudentLoanInterest = "adjustments.studentLoanInterest",
	PreTaxDeferrals401k = "adjustments.preTaxDeferrals401k",
	DeductibleSeTax = "adjustments.deductibleSeTax",
}

/**
 * Diagnostic and reporting field identifiers for Schedule A itemized deductions.
 */
export enum UsDeductionField {
	MedicalExpenses = "itemized.medicalExpenses",
	StateAndLocalTaxes = "itemized.stateAndLocalTaxes",
	MortgageInterest = "itemized.mortgageInterest",
	CharitableContributions = "itemized.charitableContributions",
	StandardDeduction = "deductions.standard",
}

/**
 * Diagnostic and reporting field identifiers for Payroll and Self-Employment taxes.
 */
export enum UsPayrollField {
	FicaSocialSecurity = "payroll.fica.socialSecurity",
	FicaMedicare = "payroll.fica.medicare",
	FicaAdditionalMedicare = "payroll.fica.additionalMedicare",
	SeSocialSecurity = "payroll.se.socialSecurity",
	SeMedicare = "payroll.se.medicare",
	SeDeductiblePortion = "payroll.se.deductiblePortion",
}

export { UsPayrollField as UsFicaField }

/**
 * Diagnostic and reporting field identifiers for Alternative Minimum Tax.
 */
export enum UsAmtField {
	Amti = "amt.amti",
	Exemption = "amt.exemption",
	Preferences = "amt.preferences",
	TentativeMinimumTax = "amt.tentativeMinimumTax",
	AmtTax = "amt.tax",
}

/**
 * Diagnostic and reporting field identifiers for Federal Tax Credits.
 */
export enum UsCreditField {
	ChildTaxCredit = "credits.ctc",
	AdditionalChildTaxCredit = "credits.actc",
	OtherDependentCredit = "credits.odc",
	EarnedIncomeTaxCredit = "credits.eitc",
	ChildAndDependentCare = "credits.care",
	Aotc = "credits.aotc",
	Llc = "credits.llc",
	ForeignTaxCredit = "credits.ftc",
	CustomNonRefundable = "credits.customNonRefundable",
	CustomRefundable = "credits.customRefundable",
}

/**
 * Diagnostic and reporting field identifiers for US federal tax totals.
 */
export enum UsTaxField {
	GrossIncome = "grossIncome",
	TaxableIncome = "taxableIncome",
	RegularIncomeTax = "regularIncomeTax",
	TotalTax = "totalTax",
	Withholding = "withholding",
	NetTaxPayable = "netTaxPayable",
}

/**
 * Diagnostic and reporting field identifiers for Section 40 assessable income categories.
 */
export enum ThAssessableField {
	Section40_1 = "income.section40_1",
	Section40_2 = "income.section40_2",
	Section40_3 = "income.section40_3",
	Section40_4 = "income.section40_4",
	Section40_5_Building = "income.section40_5.building",
	Section40_5_AgriculturalLand = "income.section40_5.agriculturalLand",
	Section40_5_NonAgriculturalLand = "income.section40_5.nonAgriculturalLand",
	Section40_5_Vehicles = "income.section40_5.vehicles",
	Section40_5_Other = "income.section40_5.other",
	Section40_6_Medical = "income.section40_6.medical",
	Section40_6_Law = "income.section40_6.law",
	Section40_6_Engineering = "income.section40_6.engineering",
	Section40_6_Architecture = "income.section40_6.architecture",
	Section40_6_Accounting = "income.section40_6.accounting",
	Section40_6_FineArts = "income.section40_6.fineArts",
	Section40_6_Other = "income.section40_6.other",
	Section40_7 = "income.section40_7",
	Section40_8 = "income.section40_8",
	Section40_8_General = "income.section40_8.general",
	Section40_8_Entertainer = "income.section40_8.entertainer",
}

/**
 * Diagnostic field identifiers for Thailand expense deduction caps and allowances.
 */
export enum ThExpenseField {
	Section40_1_2 = "expense.40_1_2",
	Section40_3 = "expense.40_3",
	Section40_4 = "expense.40_4",
	Section40_5_Building = "expense.40_5.building",
	Section40_5_AgriculturalLand = "expense.40_5.agri",
	Section40_5_NonAgriculturalLand = "expense.40_5.nonAgri",
	Section40_5_Vehicles = "expense.40_5.vehicles",
	Section40_5_Other = "expense.40_5.other",
	Section40_6_Medical = "expense.40_6.medical",
	Section40_6_Law = "expense.40_6.law",
	Section40_6_Engineering = "expense.40_6.eng",
	Section40_6_Architecture = "expense.40_6.arch",
	Section40_6_Accounting = "expense.40_6.acc",
	Section40_6_FineArts = "expense.40_6.art",
	Section40_6_Other = "expense.40_6.other",
	Section40_7 = "expense.40_7",
	Section40_8_General = "expense.40_8.general",
	Section40_8_Entertainer = "expense.40_8.entertainer",
}

/**
 * Diagnostic field identifiers for Thailand personal, family, insurance, retirement, and donation allowances.
 */
export enum ThAllowanceField {
	Personal = "allowance.personal",
	Spouse = "allowance.spouse",
	Children = "allowance.children",
	Parents = "allowance.parents",
	Disabled = "allowance.disabled",
	SocialSecurity = "allowance.social_security",
	LifeHealthCombined = "allowance.life_health_combined",
	HealthInsurance = "allowance.health_insurance",
	ParentHealthInsurance = "allowance.parent_health_insurance",
	SpouseLifeInsurance = "allowance.spouse_life_insurance",
	MortgageInterest = "allowance.mortgage_interest",
	Rmf = "allowance.retirement.rmf",
	Ssf = "allowance.retirement.ssf",
	Pvd = "allowance.retirement.pvd",
	Gpf = "allowance.retirement.gpf",
	Nsf = "allowance.retirement.nsf",
	PensionLife = "allowance.retirement.pension_life",
	RetirementCluster = "allowance.retirement_cluster",
	ThaiEsg = "allowance.thai_esg",
	Donation2x = "allowance.donation_2x",
	Donation1x = "allowance.donation_1x",
}

/**
 * Field identifiers for progressive bracket calculation.
 */
export enum ThBracketField {
	TaxableIncome = "taxableIncome",
	GrossIncome = "grossIncome",
}

/**
 * Field identifiers for Thailand tax result and withholding tax.
 */
export enum ThTaxField {
	TaxYear = "taxYear",
	WithholdingTax = "withholdingTax",
	TotalTax = "totalTax",
	NetTaxPayable = "netTaxPayable",
	MinimumGrossTax = "minimumGrossTax",
}

import type { ThParameters } from "./parameters-types"

/**
 * Section 40(4) final withholding rates for Tax Year 2026.
 *
 * @statute Thailand Revenue Code Sections 40(4), 50(2)(g), 57 ter.
 */
export const TH_2026_FINAL_WITHHOLDING: ThParameters["finalWithholding"] = {
	interestRate: 0.15,
	dividendRate: 0.1,
	// Assumption: the issue gives no digital asset rate; 15% mirrors interest.
	digitalAssetRate: 0.15,
}

/**
 * Section 48(5) separate sheet parameters for Tax Year 2026: exemption, expenses, and schedule.
 *
 * @statute Thailand Revenue Code Section 48(5), Section 42(1).
 */
export const TH_2026_SEPARATE_SHEET: ThParameters["separateSheet"] = {
	minYearsOfService: 5,
	exemptionWageDays: 400,
	exemptionCeiling: 600_000,
	expensePerYearOfService: 7_000,
	remainderExpenseRate: 0.5,
	brackets: [
		{ upTo: 300_000, rate: 0.05 },
		{ upTo: 500_000, rate: 0.1 },
		{ upTo: 750_000, rate: 0.15 },
		{ upTo: 1_000_000, rate: 0.2 },
		{ upTo: 2_000_000, rate: 0.25 },
		{ upTo: 5_000_000, rate: 0.3 },
		{ upTo: null, rate: 0.35 },
	],
}

/**
 * Section 48(4) real estate transfer parameters for Tax Year 2026.
 *
 * @statute Thailand Revenue Code Section 48(4), Ministerial Regulation No. 126.
 */
export const TH_2026_REAL_ESTATE: ThParameters["realEstate"] = {
	expenseTable: [
		{ minYears: 1, rate: 0.92 },
		{ minYears: 2, rate: 0.84 },
		{ minYears: 3, rate: 0.77 },
		{ minYears: 4, rate: 0.71 },
		{ minYears: 5, rate: 0.65 },
		{ minYears: 6, rate: 0.6 },
		{ minYears: 7, rate: 0.55 },
		{ minYears: 8, rate: 0.5 },
	],
	taxCapRate: 0.2,
}

/**
 * Expense deduction election method under Thailand Revenue Code.
 */
export type ThExpenseElection = "standard" | "actual"

/**
 * Income item that supports standard vs actual expense election.
 */
export interface ThExpenseElectableIncome {
	readonly amount: number
	readonly expenseElection?: ThExpenseElection
	readonly actualExpense?: number
}

/**
 * Section 40(5) rental income categories.
 */
export interface ThSection40_5Input {
	readonly building?: number | ThExpenseElectableIncome
	readonly agriculturalLand?: number | ThExpenseElectableIncome
	readonly nonAgriculturalLand?: number | ThExpenseElectableIncome
	readonly vehicles?: number | ThExpenseElectableIncome
	readonly other?: number | ThExpenseElectableIncome
}

/**
 * Section 40(6) liberal professions income categories.
 */
export interface ThSection40_6Input {
	readonly medical?: number | ThExpenseElectableIncome
	readonly law?: number | ThExpenseElectableIncome
	readonly engineering?: number | ThExpenseElectableIncome
	readonly architecture?: number | ThExpenseElectableIncome
	readonly accounting?: number | ThExpenseElectableIncome
	readonly fineArts?: number | ThExpenseElectableIncome
	readonly other?: number | ThExpenseElectableIncome
}

/**
 * Section 40(8) business, commerce, and entertainer income categories.
 */
export interface ThSection40_8Input {
	readonly general?: number | ThExpenseElectableIncome
	readonly entertainer?: number | ThExpenseElectableIncome
}

/**
 * Thailand Assessable Income input across Section 40(1) through Section 40(8).
 */
export interface ThAssessableIncomeInput {
	/** Section 40(1) - Employment / Salary. */
	readonly section40_1?: number
	/** Section 40(2) - Service / Freelance / Hire of work. */
	readonly section40_2?: number
	/** Section 40(3) - Royalties / Goodwill / Copyright. */
	readonly section40_3?: number | ThExpenseElectableIncome
	/** Section 40(4) - Interest / Dividends / Digital assets. */
	readonly section40_4?: number | { readonly amount: number }
	/** Section 40(5) - Rental income across asset types. */
	readonly section40_5?: ThSection40_5Input
	/** Section 40(6) - Liberal professions (medical, legal, accounting, etc.). */
	readonly section40_6?: ThSection40_6Input
	/** Section 40(7) - Contracting with materials. */
	readonly section40_7?: number | ThExpenseElectableIncome
	/** Section 40(8) - Business, commerce, transport, entertainers. */
	readonly section40_8?: number | ThExpenseElectableIncome | ThSection40_8Input
}

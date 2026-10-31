/**
 * Election values for a Section 40(4) source: keep source withholding as final tax, or include
 * the income in the regular progressive computation. Plain `"final"`/`"include"` strings are
 * accepted wherever {@link ThFinalWithholdingElection} is expected.
 *
 * @statute Thailand Revenue Code Sections 40(4), 50(2)(g), 57 ter.
 */
export const ThFinalWithholdingElection = {
	Final: "final",
	Include: "include",
} as const

/** Union of {@link ThFinalWithholdingElection} values. */
export type ThFinalWithholdingElection =
	(typeof ThFinalWithholdingElection)[keyof typeof ThFinalWithholdingElection]

/**
 * Section 40(4) interest or digital asset income with an optional final withholding election.
 * Units: THB major units.
 *
 * @statute Thailand Revenue Code Sections 40(4), 50(2)(g), 57 ter.
 */
export interface ThSection40_4Source {
	/** Gross amount received, in THB (non-negative, finite). */
	readonly amount: number
	/** Defaults to `"include"`. */
	readonly election?: ThFinalWithholdingElection
}

/**
 * Section 40(4) dividend income with election and optional Thai corporate tax rate.
 * Units: THB major units; `corpTaxRate` is a ratio.
 *
 * @statute Thailand Revenue Code Sections 40(4), 47 bis.
 */
export interface ThSection40_4Dividend extends ThSection40_4Source {
	/** Corporate income tax rate in [0, 1) paid by the distributing company (Section 47 bis). */
	readonly corpTaxRate?: number
}

/**
 * Structured Section 40(4) input splitting interest, dividends, and digital assets.
 * Units: THB major units.
 *
 * @statute Thailand Revenue Code Section 40(4).
 */
export interface ThSection40_4Input {
	/** Other Section 40(4) income always included in regular brackets. */
	readonly amount?: number
	/** Interest; a bare number means included in regular brackets. */
	readonly interest?: number | ThSection40_4Source
	/** Dividends; a bare number means included, with no Section 47 bis credit. */
	readonly dividends?: number | ThSection40_4Dividend
	/** Digital asset income; a bare number means included in regular brackets. */
	readonly digitalAssets?: number | ThSection40_4Source
}

/**
 * Section 48(5) one-time severance or retirement lump sum.
 * Units: THB major units; `yearsOfService` is a count.
 *
 * @statute Thailand Revenue Code Section 48(5), Section 42(1).
 */
export interface ThSeparateSheetInput {
	/** Lump sum received, in THB. */
	readonly amount: number
	/** Completed years of service (non-negative safe integer). */
	readonly yearsOfService: number
	/** Last daily wage in THB, basis for the 400-day exemption. */
	readonly lastDailyWage: number
}

/**
 * Section 48(4) real estate transfer subject to separate computation.
 * Units: THB major units; `holdingYears` is a count.
 *
 * @statute Thailand Revenue Code Section 48(4).
 */
export interface ThRealEstateTransferInput {
	/** Gross transfer value in THB. */
	readonly grossTransferValue: number
	/** Whole years the property was held (positive safe integer). */
	readonly holdingYears: number
}

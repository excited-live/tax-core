/**
 * Election for a Section 40(4) source: keep source withholding as final tax, or include the
 * income in the regular progressive computation.
 */
export type ThFinalWithholdingElection = "final" | "include"

/**
 * Section 40(4) interest or digital asset income with an optional final withholding election.
 */
export interface ThSection40_4Source {
	readonly amount: number
	/** Defaults to `"include"`. */
	readonly election?: ThFinalWithholdingElection
}

/**
 * Section 40(4) dividend income with election and optional Thai corporate tax rate.
 */
export interface ThSection40_4Dividend extends ThSection40_4Source {
	/** Corporate income tax rate in [0, 1) paid by the distributing company (Section 47 bis). */
	readonly corpTaxRate?: number
}

/**
 * Structured Section 40(4) input splitting interest, dividends, and digital assets.
 */
export interface ThSection40_4Input {
	/** Other Section 40(4) income always included in regular brackets. */
	readonly amount?: number
	readonly interest?: number | ThSection40_4Source
	readonly dividends?: number | ThSection40_4Dividend
	readonly digitalAssets?: number | ThSection40_4Source
}

/**
 * Section 48(5) one-time severance or retirement lump sum.
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
 */
export interface ThRealEstateTransferInput {
	/** Gross transfer value in THB. */
	readonly grossTransferValue: number
	/** Years the property was held (positive safe integer). */
	readonly holdingYears: number
}

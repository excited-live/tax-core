/**
 * Diagnostic input paths for the Thailand special tax regimes: Section 40(4) final withholding,
 * Section 47 bis dividend credit, Section 48(5) separate sheet, and Section 48(4) real estate.
 * Each value is the path of a field on the caller's `ThTaxInput`.
 *
 * @statute Thailand Revenue Code Sections 40(4), 47 bis, 48(4), 48(5).
 */
export enum ThSpecialRegimeField {
	Interest = "income.section40_4.interest",
	Dividends = "income.section40_4.dividends",
	DigitalAssets = "income.section40_4.digitalAssets",
	InterestElection = "income.section40_4.interest.election",
	DividendsElection = "income.section40_4.dividends.election",
	DigitalAssetsElection = "income.section40_4.digitalAssets.election",
	CorpTaxRate = "income.section40_4.dividends.corpTaxRate",
	SeparateSheetAmount = "separateSheet.amount",
	SeparateSheetYears = "separateSheet.yearsOfService",
	SeparateSheetLastDailyWage = "separateSheet.lastDailyWage",
	SeparateSheetPaymentType = "separateSheet.paymentType",
	RealEstateGrossValue = "realEstateTransfer.grossTransferValue",
	RealEstateHoldingYears = "realEstateTransfer.holdingYears",
	RealEstateAcquisitionType = "realEstateTransfer.acquisitionType",
}

/**
 * Diagnostic output keys for computed component taxes and credits, used when combining the
 * regular schedule with the special regimes into one liability. These name calculated values,
 * not caller input.
 *
 * @statute Thailand Revenue Code Sections 40(4), 47 bis, 48(1)–(5).
 */
export enum ThCombineField {
	RegularTax = "regularTax",
	SeparateSheetTax = "separateSheetTax",
	RealEstateTax = "realEstateTax",
	FinalWithholdingTax = "finalWithholdingTax",
	DividendTaxCredit = "dividendTaxCredit",
}

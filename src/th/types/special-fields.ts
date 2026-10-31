/**
 * Diagnostic field identifiers for Thailand special tax regimes: Section 40(4) final withholding,
 * Section 47 bis dividend credit, Section 48(5) separate sheet, and Section 48(4) real estate.
 */
export enum ThSpecialRegimeField {
	Interest = "income.section40_4.interest",
	Dividends = "income.section40_4.dividends",
	DigitalAssets = "income.section40_4.digitalAssets",
	CorpTaxRate = "income.section40_4.dividends.corpTaxRate",
	FinalWithholdingTax = "finalWithholdingTax",
	DividendTaxCredit = "dividendTaxCredit",
	SeparateSheetAmount = "separateSheet.amount",
	SeparateSheetYears = "separateSheet.yearsOfService",
	SeparateSheetLastDailyWage = "separateSheet.lastDailyWage",
	SeparateSheetTax = "separateSheetTax",
	RealEstateGrossValue = "realEstateTransfer.grossTransferValue",
	RealEstateHoldingYears = "realEstateTransfer.holdingYears",
	RealEstateTax = "realEstateTax",
	RegularTax = "regularTax",
}

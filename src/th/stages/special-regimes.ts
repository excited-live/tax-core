import {
	type ThAssessableIncomeInput,
	ThBracketField,
	type ThDividendTaxCreditBreakdown,
	type ThFinalWithholdingBreakdown,
	type ThRealEstateBreakdown,
	type ThSeparateSheetBreakdown,
	type ThTaxInput,
} from "../types"
import { sumThAmounts } from "../units"
import { calculateDividendTaxCredit } from "./dividend-credit"
import { resolveSection40_4 } from "./final-withholding"
import { calculateRealEstateTransfer } from "./real-estate"
import { buildRegularIncome } from "./regular-income"
import { calculateSeparateSheet } from "./separate-sheet"

/** Outcome of every special regime plus the income left for the regular schedule. */
export interface ThSpecialRegimes {
	/** Income flowing through the regular progressive schedule (Section 40(1)–(8)). */
	readonly regularIncome: ThAssessableIncomeInput
	/** Gross amounts taxed outside the regular schedule: final 40(4), eligible 48(5), 48(4). */
	readonly grossOutsideRegular: number
	readonly finalWithholding: ThFinalWithholdingBreakdown
	readonly dividendTaxCredit: ThDividendTaxCreditBreakdown
	readonly separateSheet: ThSeparateSheetBreakdown
	readonly realEstate: ThRealEstateBreakdown
}

/**
 * Resolves Section 40(4) elections, the Section 47 bis credit, the Section 48(5) separate sheet,
 * and the Section 48(4) real estate transfer, then assembles the remaining regular income.
 *
 * Math: Regular Section 40(4) = included sources + dividend gross-up; ineligible lump sum joins
 * Section 40(1). Gross outside the regular schedule = final-elected 40(4) + eligible lump sum (or, if
 * ineligible, its severance exemption) + real estate gross transfer value.
 * Units: THB major units; sums performed in integer satang.
 * Throws: TaxValidationError for any invalid special-regime input.
 *
 * @statute Thailand Revenue Code Sections 40(4), 47 bis, 48(4), 48(5).
 */
export function resolveSpecialRegimes(input: ThTaxInput): ThSpecialRegimes {
	const section40_4 = resolveSection40_4(input.income?.section40_4)
	const dividendTaxCredit = calculateDividendTaxCredit(
		section40_4.includedDividends,
		section40_4.corpTaxRate,
	)
	const separateSheet = calculateSeparateSheet(input.separateSheet)
	const realEstate = calculateRealEstateTransfer(input.realEstateTransfer)
	return {
		regularIncome: buildRegularIncome(input.income, {
			lumpSum: separateSheet.addedToSection40_1,
			section40_4: section40_4.includedAmount,
			dividendCredit: dividendTaxCredit.credit,
		}),
		grossOutsideRegular: sumThAmounts(
			[
				section40_4.finalWithholding.totalAmount,
				separateSheet.isEligible ? separateSheet.amount : separateSheet.exemption,
				realEstate.grossTransferValue,
			],
			ThBracketField.GrossIncome,
		),
		finalWithholding: section40_4.finalWithholding,
		dividendTaxCredit,
		separateSheet,
		realEstate,
	}
}

import { type ThCombinedTaxBreakdown, ThCombineField, ThTaxField } from "../types"
import { fromSatang, toSatang } from "../units"

/** Component taxes, credits, and payments to combine. Units: THB major units. */
export interface ThCombineInput {
	/** Section 48(1)/48(2) tax on the regular schedule. */
	readonly regularTax: number
	/** Section 48(5) separate sheet tax. */
	readonly separateSheetTax: number
	/** Section 48(4) real estate transfer tax. */
	readonly realEstateTax: number
	/** Section 40(4) tax withheld at source and elected final. */
	readonly finalWithholdingTax: number
	/** Section 47 bis dividend tax credit. */
	readonly dividendTaxCredit: number
	/** Other tax already withheld/paid, credited against the liability. */
	readonly withholdingTax: number
}

/**
 * Combines regular, separate sheet, real estate, and final withholding taxes into one liability.
 *
 * Purpose: Produces the single audited total and the amount still payable (or refundable).
 * Math: totalCombinedTax = regular + separate sheet + real estate + final withholding (before credits);
 * netTaxPayable = totalCombinedTax - final withholding (already withheld at source)
 * - Section 47 bis dividend credit - withholding tax paid. May be negative (refund).
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError if any component is negative or non-finite.
 *
 * @param input Component taxes, credits, and payments in THB.
 * @statute Thailand Revenue Code Sections 40(4), 47 bis, 48(1)–(5).
 */
export function combineThLiability(input: ThCombineInput): ThCombinedTaxBreakdown {
	const regular = toSatang(input.regularTax, ThCombineField.RegularTax)
	const separateSheet = toSatang(input.separateSheetTax, ThCombineField.SeparateSheetTax)
	const realEstate = toSatang(input.realEstateTax, ThCombineField.RealEstateTax)
	const finalWithholding = toSatang(input.finalWithholdingTax, ThCombineField.FinalWithholdingTax)
	const dividendCredit = toSatang(input.dividendTaxCredit, ThCombineField.DividendTaxCredit)
	const withheld = toSatang(input.withholdingTax, ThTaxField.WithholdingTax)

	const total = regular + separateSheet + realEstate + finalWithholding
	const credits = finalWithholding + dividendCredit + withheld
	return {
		totalCombinedTax: fromSatang(total, ThTaxField.TotalTax),
		netTaxPayable: fromSatang(total - credits, ThTaxField.NetTaxPayable, { allowNegative: true }),
	}
}

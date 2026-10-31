import { applyGrossUp, validateMonetaryAmount } from "../../core/money"
import { ThCombineField, type ThDividendTaxCreditBreakdown, ThSpecialRegimeField } from "../types"
import { fromSatang, toSatang } from "../units"
import { validateCorpTaxRate } from "../validate"

/**
 * Calculates the Section 47 bis dividend tax credit for dividends included in regular income.
 *
 * Purpose: Recovers the corporate tax already paid on dividends taxed again in the regular schedule.
 * Math: credit = dividend * corpTaxRate / (1 - corpTaxRate), exact in satang and rounded half-up.
 * The grossed-up amount (dividend + credit) is assessable; the credit offsets tax payable.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError if dividend is negative/non-finite or the rate is invalid.
 *
 * @param includedDividends Dividends elected `"include"`, in THB.
 * @param corpTaxRate Corporate tax rate in [0, 1); `undefined` means no credit.
 * @statute Thailand Revenue Code Section 47 bis.
 */
export function calculateDividendTaxCredit(
	includedDividends: number,
	corpTaxRate: number | undefined,
): ThDividendTaxCreditBreakdown {
	validateMonetaryAmount(includedDividends, ThSpecialRegimeField.Dividends)
	if (corpTaxRate === undefined) {
		return {
			isApplicable: false,
			dividendAmount: includedDividends,
			corpTaxRate: 0,
			credit: 0,
			grossedUpAmount: includedDividends,
		}
	}
	validateCorpTaxRate(corpTaxRate)
	const dividendSatang = toSatang(includedDividends, ThSpecialRegimeField.Dividends)
	const creditSatang = applyGrossUp(dividendSatang, corpTaxRate, ThSpecialRegimeField.Dividends)
	return {
		isApplicable: true,
		dividendAmount: includedDividends,
		corpTaxRate,
		credit: fromSatang(creditSatang, ThCombineField.DividendTaxCredit),
		grossedUpAmount: fromSatang(dividendSatang + creditSatang, ThCombineField.DividendTaxCredit),
	}
}

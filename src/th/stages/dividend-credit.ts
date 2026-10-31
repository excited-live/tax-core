import {
	applyGrossUp,
	fromMinorUnits,
	TaxValidationError,
	toMinorUnits,
	validateMonetaryAmount,
} from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import { type ThDividendTaxCreditBreakdown, ThSpecialRegimeField } from "../types"

/**
 * Validates a Thai corporate income tax rate used for the Section 47 bis gross-up.
 *
 * Math: Requires `0 <= rate < 1` so `rate / (1 - rate)` is finite.
 * Units: Rate ratio (0.2 = 20%).
 * Throws: TaxValidationError if rate is NaN, non-finite, negative, or at least 1.
 *
 * @statute Thailand Revenue Code Section 47 bis.
 */
export function validateCorpTaxRate(rate: number): void {
	if (!Number.isFinite(rate) || rate < 0 || rate >= 1) {
		throw new TaxValidationError(
			ThSpecialRegimeField.CorpTaxRate,
			rate,
			"Corporate tax rate must be finite and satisfy 0 <= rate < 1",
		)
	}
}

/**
 * Calculates the Section 47 bis dividend tax credit for dividends included in regular income.
 *
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
	const currency = TH_2026_PARAMETERS.currency
	const minorDividend = toMinorUnits(includedDividends, currency, ThSpecialRegimeField.Dividends)
	const minorCredit = applyGrossUp(minorDividend, corpTaxRate)
	return {
		isApplicable: true,
		dividendAmount: includedDividends,
		corpTaxRate,
		credit: fromMinorUnits(minorCredit, currency, ThSpecialRegimeField.DividendTaxCredit),
		grossedUpAmount: fromMinorUnits(minorDividend + minorCredit, currency),
	}
}

import { applyPercentage, fromMinorUnits, toMinorUnits } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	ThAssessableField,
	type ThFinalWithholdingBreakdown,
	type ThFinalWithholdingSourceBreakdown,
	type ThSection40_4Dividend,
	type ThSection40_4Input,
	type ThSection40_4Source,
	ThSpecialRegimeField,
} from "../types"
import { extractElectableAmount } from "./assessable"
import { validateCorpTaxRate } from "./dividend-credit"

/** Section 40(4) split into regular-bracket income and final-withheld income. */
export interface ThResolvedSection40_4 {
	/** Section 40(4) income included in regular brackets, before any dividend gross-up. */
	readonly includedAmount: number
	/** Dividends elected `"include"`. */
	readonly includedDividends: number
	/** Corporate tax rate for included dividends, if given. */
	readonly corpTaxRate: number | undefined
	readonly finalWithholding: ThFinalWithholdingBreakdown
}

type SourceInput = number | ThSection40_4Source | ThSection40_4Dividend | undefined

function resolveSource(
	input: SourceInput,
	field: ThSpecialRegimeField,
	rate: number,
): ThFinalWithholdingSourceBreakdown & { readonly minorAmount: number; readonly minorTax: number } {
	const amount = extractElectableAmount(input, field)
	const election = typeof input === "object" ? (input.election ?? "include") : "include"
	const currency = TH_2026_PARAMETERS.currency
	const minorAmount = toMinorUnits(amount, currency, field)
	const minorTax = election === "final" ? applyPercentage(minorAmount, rate) : 0
	return {
		election,
		amount,
		rate,
		tax: fromMinorUnits(minorTax, currency),
		minorAmount,
		minorTax,
	}
}

function toBreakdownSource(s: ReturnType<typeof resolveSource>): ThFinalWithholdingSourceBreakdown {
	return { election: s.election, amount: s.amount, rate: s.rate, tax: s.tax }
}

function normalize(input: number | ThSection40_4Input | undefined): ThSection40_4Input {
	return typeof input === "number" ? { amount: input } : (input ?? {})
}

/**
 * Splits Section 40(4) income into regular-bracket income and final-withheld income.
 *
 * Math: For each source with election `"final"`, tax = amount * rate (satang, half-up) and the
 * income is excluded from regular brackets. `"include"` (default) adds the income to Section 40(4)
 * assessable income at a 0% expense rate.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError for negative/non-finite amounts or an invalid `corpTaxRate`.
 *
 * @statute Thailand Revenue Code Sections 40(4), 50(2)(g), 56, 57 ter.
 */
export function resolveSection40_4(
	input: number | ThSection40_4Input | undefined,
): ThResolvedSection40_4 {
	const s = normalize(input)
	const p = TH_2026_PARAMETERS.finalWithholding
	const base = extractElectableAmount(s.amount, ThAssessableField.Section40_4)
	const interest = resolveSource(s.interest, ThSpecialRegimeField.Interest, p.interestRate)
	const dividends = resolveSource(s.dividends, ThSpecialRegimeField.Dividends, p.dividendRate)
	const digital = resolveSource(
		s.digitalAssets,
		ThSpecialRegimeField.DigitalAssets,
		p.digitalAssetRate,
	)
	const rate = typeof s.dividends === "object" ? s.dividends.corpTaxRate : undefined
	if (rate !== undefined) validateCorpTaxRate(rate)

	const sources = [interest, dividends, digital]
	const currency = TH_2026_PARAMETERS.currency
	const finalSources = sources.filter((x) => x.election === "final")
	const totalMinor = finalSources.reduce((sum, x) => sum + x.minorAmount, 0)
	const totalTaxMinor = finalSources.reduce((sum, x) => sum + x.minorTax, 0)
	const includedMinor = sources
		.filter((x) => x.election === "include")
		.reduce((sum, x) => sum + x.minorAmount, toMinorUnits(base, currency))

	const isDividendIncluded = dividends.election === "include"
	return {
		includedAmount: fromMinorUnits(includedMinor, currency),
		includedDividends: isDividendIncluded ? dividends.amount : 0,
		corpTaxRate: isDividendIncluded ? rate : undefined,
		finalWithholding: {
			interest: toBreakdownSource(interest),
			dividends: toBreakdownSource(dividends),
			digitalAssets: toBreakdownSource(digital),
			totalAmount: fromMinorUnits(totalMinor, currency),
			totalTax: fromMinorUnits(totalTaxMinor, currency),
		},
	}
}

import { applyPercentage } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	ThAssessableField,
	type ThFinalWithholdingBreakdown,
	ThFinalWithholdingElection,
	type ThFinalWithholdingSourceBreakdown,
	type ThSection40_4Dividend,
	type ThSection40_4Input,
	type ThSection40_4Source,
	ThSpecialRegimeField,
} from "../types"
import { fromSatang, toSatang } from "../units"
import { validateCorpTaxRate } from "../validate"
import { extractElectableAmount } from "./assessable"

/**
 * Section 40(4) split into regular-bracket income and final-withheld income.
 * Units: THB major units.
 *
 * @statute Thailand Revenue Code Sections 40(4), 47 bis, 50(2)(g), 57 ter.
 */
export interface ThResolvedSection40_4 {
	/** Section 40(4) income included in regular brackets, before any dividend gross-up. */
	readonly includedAmount: number
	/** Dividends elected `"include"`. */
	readonly includedDividends: number
	/** Corporate tax rate (ratio) for included dividends, if given. */
	readonly corpTaxRate: number | undefined
	/** Audit trail of the sources elected `"final"` and their withheld tax. */
	readonly finalWithholding: ThFinalWithholdingBreakdown
}

type SourceInput = number | ThSection40_4Source | ThSection40_4Dividend | undefined

interface ResolvedSource {
	readonly breakdown: ThFinalWithholdingSourceBreakdown
	readonly satang: number
	readonly taxSatang: number
}

function electionOf(input: SourceInput): ThFinalWithholdingElection {
	const election = typeof input === "object" ? input.election : undefined
	return election ?? ThFinalWithholdingElection.Include
}

function resolveSource(
	input: SourceInput,
	field: ThSpecialRegimeField,
	rate: number,
): ResolvedSource {
	const amount = extractElectableAmount(input, field)
	const election = electionOf(input)
	const satang = toSatang(amount, field)
	const isFinal = election === ThFinalWithholdingElection.Final
	const taxSatang = isFinal ? applyPercentage(satang, rate) : 0
	return { breakdown: { election, amount, rate, tax: fromSatang(taxSatang) }, satang, taxSatang }
}

function toStructuredInput(input: number | ThSection40_4Input | undefined): ThSection40_4Input {
	return typeof input === "number" ? { amount: input } : (input ?? {})
}

function sumSatang(sources: readonly ResolvedSource[], seed = 0): number {
	return sources.reduce((sum, source) => sum + source.satang, seed)
}

/**
 * Splits Section 40(4) income into regular-bracket income and final-withheld income.
 *
 * Purpose: Applies each source's election so only included income reaches the regular schedule.
 * Math: For each source elected `"final"`, tax = amount * rate (satang, half-up) and the income is
 * excluded from regular brackets. `"include"` (default) adds the income to Section 40(4)
 * assessable income at a 0% expense rate.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError for negative/non-finite amounts or an invalid `corpTaxRate`.
 *
 * @param input Bare amount, structured sources, or undefined.
 * @statute Thailand Revenue Code Sections 40(4), 50(2)(g), 56, 57 ter.
 */
export function resolveSection40_4(
	input: number | ThSection40_4Input | undefined,
): ThResolvedSection40_4 {
	const section = toStructuredInput(input)
	const rates = TH_2026_PARAMETERS.finalWithholding
	const base = extractElectableAmount(section.amount, ThAssessableField.Section40_4)
	const interest = resolveSource(
		section.interest,
		ThSpecialRegimeField.Interest,
		rates.interestRate,
	)
	const dividends = resolveSource(
		section.dividends,
		ThSpecialRegimeField.Dividends,
		rates.dividendRate,
	)
	const digital = resolveSource(
		section.digitalAssets,
		ThSpecialRegimeField.DigitalAssets,
		rates.digitalAssetRate,
	)
	const corpTaxRate =
		typeof section.dividends === "object" ? section.dividends.corpTaxRate : undefined
	if (corpTaxRate !== undefined) validateCorpTaxRate(corpTaxRate)

	const sources = [interest, dividends, digital]
	const isFinal = (source: ResolvedSource): boolean =>
		source.breakdown.election === ThFinalWithholdingElection.Final
	const finalSources = sources.filter(isFinal)
	const includedSatang = sumSatang(
		sources.filter((source) => !isFinal(source)),
		toSatang(base, ThAssessableField.Section40_4),
	)
	const isDividendIncluded = !isFinal(dividends)
	return {
		includedAmount: fromSatang(includedSatang),
		includedDividends: isDividendIncluded ? dividends.breakdown.amount : 0,
		corpTaxRate: isDividendIncluded ? corpTaxRate : undefined,
		finalWithholding: {
			interest: interest.breakdown,
			dividends: dividends.breakdown,
			digitalAssets: digital.breakdown,
			totalAmount: fromSatang(sumSatang(finalSources)),
			totalTax: fromSatang(finalSources.reduce((sum, source) => sum + source.taxSatang, 0)),
		},
	}
}

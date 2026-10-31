import { applyPercentage } from "../../core/money"
import {
	ThFinalWithholdingElection,
	type ThFinalWithholdingSourceBreakdown,
	type ThSection40_4Dividend,
	type ThSection40_4Source,
	type ThSpecialRegimeField,
} from "../types"
import { fromSatang, toSatang } from "../units"
import { resolveChoice } from "../validate"
import { extractElectableAmount } from "./assessable"

export type ThSourceInput = number | ThSection40_4Source | ThSection40_4Dividend | undefined

/** One Section 40(4) source after its election is applied. Units: integer satang. */
export interface ResolvedSource {
	readonly breakdown: ThFinalWithholdingSourceBreakdown
	readonly satang: number
	readonly taxSatang: number
}

function electionOf(input: ThSourceInput, field: ThSpecialRegimeField): ThFinalWithholdingElection {
	const election = typeof input === "object" ? input.election : undefined
	return resolveChoice(
		election,
		ThFinalWithholdingElection,
		ThFinalWithholdingElection.Include,
		field,
	)
}

/**
 * Resolves one Section 40(4) source: validates its amount and election, withholds if final.
 *
 * Purpose: Applies the per-source final withholding election.
 * Math: tax = amount * rate (satang, half-up) when the election is `"final"`, otherwise 0.
 * Units: Input in THB major units; `satang` and `taxSatang` in integer satang.
 * Throws: TaxValidationError for a negative/non-finite amount or an unknown election value.
 *
 * @param input Bare amount, source object, or undefined.
 * @param field Diagnostic path of the amount.
 * @param electionField Diagnostic path of the election.
 * @param rate Final withholding rate (ratio).
 * @statute Thailand Revenue Code Sections 40(4), 50(2)(g), 57 ter.
 */
export function resolveSource(
	input: ThSourceInput,
	field: ThSpecialRegimeField,
	electionField: ThSpecialRegimeField,
	rate: number,
): ResolvedSource {
	const amount = extractElectableAmount(input, field)
	const election = electionOf(input, electionField)
	const satang = toSatang(amount, field)
	const isFinal = election === ThFinalWithholdingElection.Final
	const taxSatang = isFinal ? applyPercentage(satang, rate) : 0
	return { breakdown: { election, amount, rate, tax: fromSatang(taxSatang) }, satang, taxSatang }
}

import { fromMinorUnits, type Money, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type {
	UsFilingStatus,
	UsItemizedBreakdown,
	UsStandardDeductionBreakdown,
	UsTaxInput,
} from "../types"
import { calculateUsItemizedDeductions } from "./itemized-deduction"
import { calculateUsStandardDeduction } from "./standard-deduction"

export interface UsDeductionsStageResult {
	readonly electedDeduction: "standard" | "itemized"
	readonly allowableDeductionCents: number
	readonly allowableDeduction: Money<"USD">
	readonly taxableIncomeCents: number
	readonly taxableIncome: Money<"USD">
	readonly ordinaryTaxableCents: number
	readonly ordinaryTaxableIncome: Money<"USD">
	readonly preferentialTaxableCents: number
	readonly preferentialTaxableIncome: Money<"USD">
	readonly standardBreakdown: UsStandardDeductionBreakdown
	readonly itemizedBreakdown?: UsItemizedBreakdown | undefined
}

function resolveElectedMethod(
	election: "auto" | "standard" | "itemized" | undefined,
	itemizedCents: number,
	standardCents: number,
	hasItemized: boolean,
): "standard" | "itemized" {
	if (election === "itemized") return "itemized"
	if (election === "standard") return "standard"
	return hasItemized && itemizedCents > standardCents ? "itemized" : "standard"
}

/**
 * Evaluates Standard vs. Schedule A Itemized Deduction election and slices taxable income.
 *
 * @statute IRC § 63, § 1(h)
 */
export function calculateUsDeductions(
	input: UsTaxInput,
	agiCents: number,
	preferentialGrossCents: number,
	filingStatus: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsDeductionsStageResult {
	const std = calculateUsStandardDeduction(input, filingStatus, params)
	const hasItemized = input.itemizedDeductions !== undefined
	const itm = hasItemized
		? calculateUsItemizedDeductions(input.itemizedDeductions!, agiCents, filingStatus, params)
		: undefined

	const elected = resolveElectedMethod(
		input.deductionElection,
		itm?.totalCents ?? 0,
		std.totalCents,
		hasItemized,
	)
	const allowableCents = elected === "itemized" && itm ? itm.totalCents : std.totalCents
	const taxableCents = Math.max(0, agiCents - allowableCents)
	const ordinaryTaxableCents = Math.max(0, taxableCents - preferentialGrossCents)
	const preferentialTaxableCents = taxableCents - ordinaryTaxableCents

	return {
		electedDeduction: elected,
		allowableDeductionCents: allowableCents,
		allowableDeduction: usd(fromMinorUnits(allowableCents, "USD")),
		taxableIncomeCents: taxableCents,
		taxableIncome: usd(fromMinorUnits(taxableCents, "USD")),
		ordinaryTaxableCents,
		ordinaryTaxableIncome: usd(fromMinorUnits(ordinaryTaxableCents, "USD")),
		preferentialTaxableCents,
		preferentialTaxableIncome: usd(fromMinorUnits(preferentialTaxableCents, "USD")),
		standardBreakdown: std.breakdown,
		itemizedBreakdown: itm?.breakdown,
	}
}

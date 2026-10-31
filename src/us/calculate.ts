import { evaluateBrackets } from "../core/brackets"
import { toMinorUnits } from "../core/money"
import type { TaxResult } from "../core/system"
import { buildUsTaxResult } from "./calculate-result"
import { US_2026_PARAMETERS } from "./parameters"
import { calculateUsAgi } from "./stages/agi"
import { calculateUsAmt } from "./stages/amt"
import { calculateUsCredits } from "./stages/credits"
import { calculateUsDeductions } from "./stages/deductions"
import { calculateUsFica } from "./stages/fica"
import { calculateUsNiit } from "./stages/niit"
import { calculateUsPreferentialStacking } from "./stages/preferential"
import { calculateUsScheduleSe } from "./stages/se"
import type { UsTaxBreakdown, UsTaxInput } from "./types"
import { validateUsInput } from "./validate"

/**
 * Executes complete statutory 2026 US Federal individual income tax calculation pipeline.
 *
 * @statute IRC § 1 et seq.
 */
export function executeUsTaxCalculation(input: UsTaxInput): TaxResult<"USD", UsTaxBreakdown> {
	validateUsInput(input)
	const seRes = calculateUsScheduleSe(input.income, US_2026_PARAMETERS)
	const deductibleSelfEmploymentTax =
		input.adjustments?.deductibleSelfEmploymentTax ?? seRes.deductiblePortionDollars
	const adjustments = { ...input.adjustments, deductibleSelfEmploymentTax }

	const agiRes = calculateUsAgi(input.income, adjustments, input.filingStatus, US_2026_PARAMETERS)
	const dedRes = calculateUsDeductions(
		input,
		agiRes.agiCents,
		agiRes.preferentialGrossCents,
		input.filingStatus,
		US_2026_PARAMETERS,
	)
	const ordRes = evaluateBrackets(
		dedRes.ordinaryTaxableCents,
		US_2026_PARAMETERS.ordinaryBrackets[input.filingStatus],
		Math.max(0, agiRes.grossIncomeCents),
		"ordinaryTaxableIncome",
	)
	const prefRes = calculateUsPreferentialStacking(
		dedRes.ordinaryTaxableCents,
		dedRes.taxableIncomeCents,
		US_2026_PARAMETERS.preferentialBrackets[input.filingStatus],
	)
	const regularTaxCents = ordRes.totalTax + prefRes.preferentialTaxCents

	const saltCents =
		dedRes.electedDeduction === "itemized" && dedRes.itemizedBreakdown
			? toMinorUnits(dedRes.itemizedBreakdown.salt.allowed, "USD")
			: 0
	const amtRes = calculateUsAmt(
		dedRes.taxableIncomeCents,
		saltCents,
		input.amtPreferences,
		regularTaxCents,
		input.filingStatus,
		US_2026_PARAMETERS,
	)
	const niitRes = calculateUsNiit(input, agiRes.agiCents, input.filingStatus, US_2026_PARAMETERS)
	const ficaRes = calculateUsFica(
		input.income,
		input.filingStatus,
		input.includeFica ?? true,
		US_2026_PARAMETERS,
	)

	const creditsRes = calculateUsCredits(
		input,
		agiRes.agiCents,
		regularTaxCents + amtRes.amtTaxCents,
		US_2026_PARAMETERS,
	)
	const taxAfterNonRefCents =
		regularTaxCents + amtRes.amtTaxCents - creditsRes.allowedNonRefundableCents
	const totalTaxCents =
		taxAfterNonRefCents + niitRes.taxCents + ficaRes.totalFicaCents + seRes.totalSeTaxCents
	const withhCents = toMinorUnits(input.withholding ?? 0, "USD", "withholding")
	const netTaxCents = totalTaxCents - creditsRes.totalRefundableCents - withhCents

	return buildUsTaxResult({
		agiRes,
		dedRes,
		ordTaxCents: ordRes.totalTax,
		ordMarginalRate: ordRes.marginalRate,
		ordSlices: ordRes.slices,
		prefRes,
		regularTaxCents,
		amtRes,
		niitRes,
		ficaRes,
		seRes,
		creditsRes,
		totalTaxCents,
		withhCents,
		netTaxCents,
	})
}

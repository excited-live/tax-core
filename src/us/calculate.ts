import { evaluateBrackets } from "../core/brackets"
import { fromMinorUnits, TaxValidationError, toMinorUnits, usd } from "../core/money"
import type { TaxResult } from "../core/system"
import { US_2026_PARAMETERS } from "./parameters"
import { calculateUsAgi } from "./stages/agi"
import { calculateUsDeductions } from "./stages/deductions"
import { calculateUsNiit } from "./stages/niit"
import { calculateUsPreferentialStacking } from "./stages/preferential"
import type { UsFilingStatus, UsTaxBreakdown, UsTaxInput } from "./types"

const VALID_STATUSES: readonly UsFilingStatus[] = [
	"single",
	"married_filing_jointly",
	"married_filing_separately",
	"head_of_household",
]

function validateUsInput(input: UsTaxInput): void {
	if (input.taxYear !== undefined && input.taxYear !== 2026) {
		throw new TaxValidationError(
			"taxYear",
			input.taxYear,
			"Unsupported tax year; currently only 2026 is supported",
		)
	}
	if (!VALID_STATUSES.includes(input.filingStatus)) {
		throw new TaxValidationError("filingStatus", input.filingStatus, "Invalid filing status")
	}
}

/**
 * Executes complete statutory 2026 US Federal individual income tax calculation pipeline.
 *
 * @statute IRC § 1 et seq.
 */
export function executeUsTaxCalculation(input: UsTaxInput): TaxResult<"USD", UsTaxBreakdown> {
	validateUsInput(input)
	const agiRes = calculateUsAgi(
		input.income,
		input.adjustments,
		input.filingStatus,
		US_2026_PARAMETERS,
	)
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
		agiRes.grossIncomeCents,
		"ordinaryTaxableIncome",
	)
	const prefRes = calculateUsPreferentialStacking(
		dedRes.ordinaryTaxableCents,
		dedRes.taxableIncomeCents,
		US_2026_PARAMETERS.preferentialBrackets[input.filingStatus],
	)
	const regularTaxCents = ordRes.totalTax + prefRes.preferentialTaxCents
	const niitRes = calculateUsNiit(input, agiRes.agiCents, input.filingStatus, US_2026_PARAMETERS)
	const totalTaxCents = regularTaxCents + niitRes.taxCents

	const withhCents = toMinorUnits(input.withholding ?? 0, "USD", "withholding")
	const netTaxCents = totalTaxCents - withhCents
	const effectiveRate = agiRes.grossIncomeCents > 0 ? totalTaxCents / agiRes.grossIncomeCents : 0
	const netTaxPayable = usd(
		fromMinorUnits(netTaxCents, "USD", "netTaxPayable", { allowNegative: true }),
		"netTaxPayable",
		{ allowNegative: true },
	)

	return {
		jurisdiction: "US",
		taxYear: 2026,
		currency: "USD",
		grossIncome: agiRes.grossIncome,
		taxableIncome: dedRes.taxableIncome,
		totalTax: usd(fromMinorUnits(totalTaxCents, "USD")),
		effectiveRate,
		marginalRate: ordRes.marginalRate,
		netTaxPayable,
		breakdown: {
			ordinaryGrossIncome: agiRes.ordinaryGrossIncome,
			preferentialGrossIncome: agiRes.preferentialGrossIncome,
			grossIncome: agiRes.grossIncome,
			adjustments: agiRes.adjustments,
			agi: agiRes.agi,
			electedDeduction: dedRes.electedDeduction,
			standardDeduction: dedRes.standardBreakdown,
			itemizedDeductions: dedRes.itemizedBreakdown,
			allowableDeduction: dedRes.allowableDeduction,
			ordinaryTaxableIncome: dedRes.ordinaryTaxableIncome,
			preferentialTaxableIncome: dedRes.preferentialTaxableIncome,
			taxableIncome: dedRes.taxableIncome,
			ordinaryTax: usd(fromMinorUnits(ordRes.totalTax, "USD")),
			ordinarySlices: ordRes.slices,
			preferentialTax: prefRes.preferentialTax,
			preferentialSlices: prefRes.slices,
			regularIncomeTax: usd(fromMinorUnits(regularTaxCents, "USD")),
			niit: niitRes.breakdown,
			totalTax: usd(fromMinorUnits(totalTaxCents, "USD")),
			withholding: usd(fromMinorUnits(withhCents, "USD")),
			netTaxPayable,
		},
	}
}

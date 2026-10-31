import type { BracketSlice } from "../core/brackets"
import { fromMinorUnits, usd } from "../core/money"
import type { TaxResult } from "../core/system"
import type { UsAgiStageResult } from "./stages/agi"
import type { UsAmtResult } from "./stages/amt"
import type { UsCreditsResult } from "./stages/credits"
import type { UsDeductionsStageResult } from "./stages/deductions"
import type { UsFicaResult } from "./stages/fica"
import type { UsNiitStageResult } from "./stages/niit"
import type { UsPreferentialStageResult } from "./stages/preferential"
import type { UsScheduleSeResult } from "./stages/se"
import type { UsTaxBreakdown } from "./types"

export interface BuildTaxResultParams {
	readonly agiRes: UsAgiStageResult
	readonly dedRes: UsDeductionsStageResult
	readonly ordTaxCents: number
	readonly ordMarginalRate: number
	readonly ordSlices: readonly BracketSlice[]
	readonly prefRes: UsPreferentialStageResult
	readonly regularTaxCents: number
	readonly amtRes: UsAmtResult
	readonly niitRes: UsNiitStageResult
	readonly ficaRes: UsFicaResult
	readonly seRes: UsScheduleSeResult
	readonly creditsRes: UsCreditsResult
	readonly totalTaxCents: number
	readonly withhCents: number
	readonly netTaxCents: number
}

export function buildUsTaxResult(p: BuildTaxResultParams): TaxResult<"USD", UsTaxBreakdown> {
	const effRate =
		p.agiRes.grossIncomeCents > 0 ? Math.max(0, p.totalTaxCents) / p.agiRes.grossIncomeCents : 0
	const netPayable = usd(
		fromMinorUnits(p.netTaxCents, "USD", "netTaxPayable", { allowNegative: true }),
		"netTaxPayable",
		{ allowNegative: true },
	)
	return {
		jurisdiction: "US",
		taxYear: 2026,
		currency: "USD",
		grossIncome: p.agiRes.grossIncome,
		taxableIncome: p.dedRes.taxableIncome,
		totalTax: usd(fromMinorUnits(p.totalTaxCents, "USD")),
		effectiveRate: effRate,
		marginalRate: p.ordMarginalRate,
		netTaxPayable: netPayable,
		breakdown: {
			ordinaryGrossIncome: p.agiRes.ordinaryGrossIncome,
			preferentialGrossIncome: p.agiRes.preferentialGrossIncome,
			grossIncome: p.agiRes.grossIncome,
			adjustments: p.agiRes.adjustments,
			agi: p.agiRes.agi,
			electedDeduction: p.dedRes.electedDeduction,
			standardDeduction: p.dedRes.standardBreakdown,
			itemizedDeductions: p.dedRes.itemizedBreakdown,
			allowableDeduction: p.dedRes.allowableDeduction,
			ordinaryTaxableIncome: p.dedRes.ordinaryTaxableIncome,
			preferentialTaxableIncome: p.dedRes.preferentialTaxableIncome,
			taxableIncome: p.dedRes.taxableIncome,
			ordinaryTax: usd(fromMinorUnits(p.ordTaxCents, "USD")),
			ordinarySlices: p.ordSlices,
			preferentialTax: p.prefRes.preferentialTax,
			preferentialSlices: p.prefRes.slices,
			regularIncomeTax: usd(fromMinorUnits(p.regularTaxCents, "USD")),
			amt: p.amtRes.breakdown,
			niit: p.niitRes.breakdown,
			fica: p.ficaRes.breakdown,
			scheduleSe: p.seRes.breakdown,
			credits: p.creditsRes.breakdown,
			totalTax: usd(fromMinorUnits(p.totalTaxCents, "USD")),
			withholding: usd(fromMinorUnits(p.withhCents, "USD")),
			netTaxPayable: netPayable,
		},
	}
}

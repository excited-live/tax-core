import type { CurrencyCode } from "./money"

export type JurisdictionCode = "TH" | "US" | (string & {})

export interface TaxResult<C extends CurrencyCode = CurrencyCode, TBreakdown = unknown> {
	readonly jurisdiction: JurisdictionCode
	readonly taxYear: number
	readonly currency: C
	readonly grossIncome: number
	readonly totalDeductions: number
	readonly taxableIncome: number
	readonly totalTax: number
	readonly withholdingAndCredits: number
	readonly netTaxPayable: number // positive = tax owed, negative = refund
	readonly effectiveRate: number // totalTax / grossIncome (0 when grossIncome === 0)
	readonly marginalRate: number // statutory marginal bracket rate on next unit of ordinary income
	readonly breakdown: TBreakdown
}

export interface TaxSystem<
	TInput = unknown,
	C extends CurrencyCode = CurrencyCode,
	TBreakdown = unknown,
> {
	readonly jurisdiction: JurisdictionCode
	readonly currency: C
	readonly supportedYears: readonly number[]
	readonly calculate: (input: TInput) => TaxResult<C, TBreakdown>
}

export function calculateTax<TInput, C extends CurrencyCode, TBreakdown>(
	system: TaxSystem<TInput, C, TBreakdown>,
	input: TInput,
): TaxResult<C, TBreakdown> {
	return system.calculate(input)
}

import type { TaxResult } from "../core/system"
import { runThTaxPipeline } from "./stages/pipeline"
import type { ThBreakdown, ThTaxInput } from "./types"

/**
 * Calculates Thailand Personal Income Tax (ภ.ง.ด.90/91) under Revenue Code.
 *
 * Defaults to tax year 2026 and single filing status.
 *
 * @param input Taxpayer assessable income, allowances, filing status, and withholding.
 * @returns Fully typed, immutable TaxResult with statutory breakdown.
 *
 * @statute Thailand Revenue Code Sections 40, 42 bis, 47, 48(1)–(2).
 */
export function calculateThTax(input: ThTaxInput = {}): TaxResult<"THB", ThBreakdown> {
	return runThTaxPipeline(input)
}

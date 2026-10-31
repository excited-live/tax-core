import type { TaxResult, TaxSystem } from "../core/system"
import { calculateThTax } from "./calculate"
import type { ThBreakdown, ThTaxInput } from "./types"

/**
 * Thailand Tax System implementation for 2026.
 *
 * Implements TaxSystem contract for `@trajectonomics/tax/th`.
 */
export const th: TaxSystem<ThTaxInput, "THB", ThBreakdown> = {
	jurisdiction: "TH",
	taxYear: 2026,
	currency: "THB",
	calculate(input: ThTaxInput = {}): TaxResult<"THB", ThBreakdown> {
		return calculateThTax(input)
	},
}

import type { TaxResult, TaxSystem } from "../core/system"
import { executeUsTaxCalculation } from "./calculate"
import type { UsTaxBreakdown, UsTaxInput } from "./types"

/**
 * US Federal Individual Income Tax System implementation for 2026.
 *
 * @statute IRC § 1 et seq.
 */
export const us: TaxSystem<UsTaxInput, "USD", UsTaxBreakdown> = {
	jurisdiction: "US",
	taxYear: 2026,
	currency: "USD",
	calculate(input: UsTaxInput): TaxResult<"USD", UsTaxBreakdown> {
		return executeUsTaxCalculation(input)
	},
}

/**
 * Calculates 2026 US Federal Individual Income Tax for the specified input.
 *
 * @statute IRC § 1 et seq.
 */
export function calculateUsTax(input: UsTaxInput): TaxResult<"USD", UsTaxBreakdown> {
	return us.calculate(input)
}

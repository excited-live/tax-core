import type { CurrencyCode } from "../money"
import type { TaxResult, TaxSystem } from "./types"

/**
 * Standard runner that executes tax calculation on a given TaxSystem instance.
 *
 * @param system TaxSystem implementation.
 * @param input Statutory input parameters.
 * @returns Standardized TaxResult envelope.
 */
export function calculateTax<TInput, C extends CurrencyCode, TBreakdown>(
	system: TaxSystem<TInput, C, TBreakdown>,
	input: TInput,
): TaxResult<C, TBreakdown> {
	return system.calculate(input)
}

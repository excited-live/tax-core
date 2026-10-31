import type { TaxBracket } from "../core/brackets"
import { US_2026_ORDINARY_BRACKETS, US_2026_PREFERENTIAL_BRACKETS } from "./parameters/brackets"
import {
	US_2026_ABOVE_THE_LINE_CAPS,
	US_2026_ADDITIONAL_STANDARD_DEDUCTION,
	US_2026_ITEMIZED,
	US_2026_NIIT,
	US_2026_STANDARD_DEDUCTION,
	type UsAboveTheLineCaps,
	type UsAdditionalStandardDeduction,
	type UsItemizedParameters,
	type UsNiitParameters,
} from "./parameters/constants"
import type { UsFilingStatus } from "./types"

export interface UsTaxParameters {
	readonly taxYear: 2026
	readonly standardDeduction: Record<UsFilingStatus, number>
	readonly additionalStandardDeduction: UsAdditionalStandardDeduction
	readonly aboveTheLineCaps: UsAboveTheLineCaps
	readonly itemized: UsItemizedParameters
	readonly niit: UsNiitParameters
	readonly ordinaryBrackets: Record<UsFilingStatus, readonly TaxBracket[]>
	readonly preferentialBrackets: Record<UsFilingStatus, readonly TaxBracket[]>
}

/**
 * Consolidated statutory parameter table for US Federal Income Tax (Tax Year 2026).
 *
 * @statute IRC § 1 et seq.
 */
export const US_2026_PARAMETERS: UsTaxParameters = {
	taxYear: 2026,
	standardDeduction: US_2026_STANDARD_DEDUCTION,
	additionalStandardDeduction: US_2026_ADDITIONAL_STANDARD_DEDUCTION,
	aboveTheLineCaps: US_2026_ABOVE_THE_LINE_CAPS,
	itemized: US_2026_ITEMIZED,
	niit: US_2026_NIIT,
	ordinaryBrackets: US_2026_ORDINARY_BRACKETS,
	preferentialBrackets: US_2026_PREFERENTIAL_BRACKETS,
}

export {
	US_2026_ABOVE_THE_LINE_CAPS,
	US_2026_ADDITIONAL_STANDARD_DEDUCTION,
	US_2026_ITEMIZED,
	US_2026_NIIT,
	US_2026_ORDINARY_BRACKETS,
	US_2026_PREFERENTIAL_BRACKETS,
	US_2026_STANDARD_DEDUCTION,
}

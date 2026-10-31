import { validateMonetaryAmount } from "../../core/money"
import { ThAssessableField, type ThAssessableIncomeInput } from "../types"
import { fromSatang, toSatang } from "../units"

/** Special-regime amounts folded into the regular schedule. Units: THB major units. */
export interface ThSpecialIncome {
	/** Ineligible Section 48(5) lump sum added to Section 40(1). */
	readonly lumpSum: number
	/** Section 40(4) income elected `"include"` (final-withheld sources excluded). */
	readonly section40_4: number
	/** Section 47 bis dividend tax credit, added as gross-up to Section 40(4). */
	readonly dividendCredit: number
}

/**
 * Assembles the income that flows through the regular progressive schedule.
 *
 * Math: Section 40(1) = declared Section 40(1) + ineligible Section 48(5) lump sum;
 * Section 40(4) = included Section 40(4) income (final-withheld sources excluded)
 * + Section 47 bis gross-up. Other categories pass through untouched.
 * Units: THB major units; the Section 40(1) sum is performed in integer satang.
 * Throws: TaxValidationError if the declared Section 40(1) is negative or non-finite.
 *
 * @param income Declared Section 40 income.
 * @param special Lump sum, included Section 40(4) income, and dividend gross-up.
 * @statute Thailand Revenue Code Sections 40(1), 40(4), 47 bis, 48(5).
 */
export function buildRegularIncome(
	income: ThAssessableIncomeInput | undefined,
	special: ThSpecialIncome,
): ThAssessableIncomeInput {
	const declared = income?.section40_1 ?? 0
	validateMonetaryAmount(declared, ThAssessableField.Section40_1)
	const section40_1 =
		toSatang(declared, ThAssessableField.Section40_1) +
		toSatang(special.lumpSum, ThAssessableField.Section40_1)
	const section40_4 =
		toSatang(special.section40_4, ThAssessableField.Section40_4) +
		toSatang(special.dividendCredit, ThAssessableField.Section40_4)
	return {
		...income,
		section40_1: fromSatang(section40_1),
		section40_4: fromSatang(section40_4),
	}
}

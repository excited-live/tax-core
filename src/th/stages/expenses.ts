import type {
	ThAssessableIncomeBreakdown,
	ThAssessableIncomeInput,
	ThExpenseDeductionsBreakdown,
} from "../types"
import { calculateExpenses40_1_2 } from "./expenses-40-1-2"
import { calculateExpenses40_3 } from "./expenses-40-3"
import { calculateExpenses40_4 } from "./expenses-40-4"
import { calculateExpenses40_5 } from "./expenses-40-5"
import { calculateExpenses40_6 } from "./expenses-40-6"
import { calculateExpenses40_7 } from "./expenses-40-7"
import { calculateExpenses40_8 } from "./expenses-40-8"

/**
 * Aggregates all Section 40(1)–40(8) statutory expense deductions.
 *
 * @statute Thailand Revenue Code Sections 42 bis, 42 ter, 43–46; Royal Decree No. 11.
 */
export function calculateExpenseDeductions(
	income: ThAssessableIncomeInput = {},
	assessable: ThAssessableIncomeBreakdown,
): ThExpenseDeductionsBreakdown {
	const e1_2 = calculateExpenses40_1_2(assessable.section40_1, assessable.section40_2)
	const e3 = calculateExpenses40_3(income.section40_3, assessable.section40_3)
	const e4 = calculateExpenses40_4(assessable.section40_4)
	const e5 = calculateExpenses40_5(income.section40_5)
	const e6 = calculateExpenses40_6(income.section40_6)
	const e7 = calculateExpenses40_7(income.section40_7)
	const e8 = calculateExpenses40_8(income.section40_8)

	const total =
		e1_2.allowed + e3.allowed + e4.allowed + e5.allowed + e6.allowed + e7.allowed + e8.allowed

	return {
		section40_1_2: e1_2,
		section40_3: e3,
		section40_4: e4,
		section40_5: e5,
		section40_6: e6,
		section40_7: e7,
		section40_8: e8,
		total,
	}
}

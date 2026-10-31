import { validateMonetaryAmount } from "../../core/money"
import type {
	ThAssessableIncomeBreakdown,
	ThAssessableIncomeInput,
	ThExpenseElectableIncome,
	ThSection40_5Input,
	ThSection40_6Input,
	ThSection40_8Input,
} from "../types"

export function extractElectableAmount(
	val: number | ThExpenseElectableIncome | undefined,
	field: string,
): number {
	if (val === undefined) return 0
	const amount = typeof val === "number" ? val : val.amount
	validateMonetaryAmount(amount, field)
	if (typeof val === "object" && val.actualExpense !== undefined) {
		validateMonetaryAmount(val.actualExpense, `${field}.actualExpense`)
	}
	return amount
}

function sumSection40_5(input: ThSection40_5Input | undefined): number {
	if (!input) return 0
	return (
		extractElectableAmount(input.building, "income.section40_5.building") +
		extractElectableAmount(input.agriculturalLand, "income.section40_5.agriculturalLand") +
		extractElectableAmount(input.nonAgriculturalLand, "income.section40_5.nonAgriculturalLand") +
		extractElectableAmount(input.vehicles, "income.section40_5.vehicles") +
		extractElectableAmount(input.other, "income.section40_5.other")
	)
}

function sumSection40_6(input: ThSection40_6Input | undefined): number {
	if (!input) return 0
	return (
		extractElectableAmount(input.medical, "income.section40_6.medical") +
		extractElectableAmount(input.law, "income.section40_6.law") +
		extractElectableAmount(input.engineering, "income.section40_6.engineering") +
		extractElectableAmount(input.architecture, "income.section40_6.architecture") +
		extractElectableAmount(input.accounting, "income.section40_6.accounting") +
		extractElectableAmount(input.fineArts, "income.section40_6.fineArts") +
		extractElectableAmount(input.other, "income.section40_6.other")
	)
}

function sumSection40_8(
	input: number | ThExpenseElectableIncome | ThSection40_8Input | undefined,
): number {
	if (input === undefined) return 0
	if (typeof input === "number" || "amount" in input) {
		return extractElectableAmount(input as number | ThExpenseElectableIncome, "income.section40_8")
	}
	return (
		extractElectableAmount(input.general, "income.section40_8.general") +
		extractElectableAmount(input.entertainer, "income.section40_8.entertainer")
	)
}

/**
 * Normalizes and validates assessable income across Section 40(1)–40(8).
 *
 * @statute Thailand Revenue Code Section 40(1)–(8).
 */
export function calculateAssessableIncome(
	input: ThAssessableIncomeInput = {},
): ThAssessableIncomeBreakdown {
	const s1 = extractElectableAmount(input.section40_1, "income.section40_1")
	const s2 = extractElectableAmount(input.section40_2, "income.section40_2")
	const s3 = extractElectableAmount(input.section40_3, "income.section40_3")
	const s4 = extractElectableAmount(
		typeof input.section40_4 === "number" ? input.section40_4 : input.section40_4?.amount,
		"income.section40_4",
	)
	const s5 = sumSection40_5(input.section40_5)
	const s6 = sumSection40_6(input.section40_6)
	const s7 = extractElectableAmount(input.section40_7, "income.section40_7")
	const s8 = sumSection40_8(input.section40_8)

	const total = s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8
	const grossNonEmploymentIncome = s2 + s3 + s4 + s5 + s6 + s7 + s8

	return {
		section40_1: s1,
		section40_2: s2,
		section40_3: s3,
		section40_4: s4,
		section40_5: s5,
		section40_6: s6,
		section40_7: s7,
		section40_8: s8,
		total,
		grossNonEmploymentIncome,
	}
}

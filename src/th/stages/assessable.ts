import { validateMonetaryAmount } from "../../core/money"
import {
	ThAssessableField,
	type ThAssessableIncomeBreakdown,
	type ThAssessableIncomeInput,
	type ThExpenseElectableIncome,
	type ThSection40_5Input,
	type ThSection40_6Input,
	type ThSection40_8Input,
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
		extractElectableAmount(input.building, ThAssessableField.Section40_5_Building) +
		extractElectableAmount(input.agriculturalLand, ThAssessableField.Section40_5_AgriculturalLand) +
		extractElectableAmount(
			input.nonAgriculturalLand,
			ThAssessableField.Section40_5_NonAgriculturalLand,
		) +
		extractElectableAmount(input.vehicles, ThAssessableField.Section40_5_Vehicles) +
		extractElectableAmount(input.other, ThAssessableField.Section40_5_Other)
	)
}

function sumSection40_6(input: ThSection40_6Input | undefined): number {
	if (!input) return 0
	return (
		extractElectableAmount(input.medical, ThAssessableField.Section40_6_Medical) +
		extractElectableAmount(input.law, ThAssessableField.Section40_6_Law) +
		extractElectableAmount(input.engineering, ThAssessableField.Section40_6_Engineering) +
		extractElectableAmount(input.architecture, ThAssessableField.Section40_6_Architecture) +
		extractElectableAmount(input.accounting, ThAssessableField.Section40_6_Accounting) +
		extractElectableAmount(input.fineArts, ThAssessableField.Section40_6_FineArts) +
		extractElectableAmount(input.other, ThAssessableField.Section40_6_Other)
	)
}

function sumSection40_8(
	input: number | ThExpenseElectableIncome | ThSection40_8Input | undefined,
): number {
	if (input === undefined) return 0
	if (typeof input === "number" || "amount" in input) {
		return extractElectableAmount(
			input as number | ThExpenseElectableIncome,
			ThAssessableField.Section40_8,
		)
	}
	return (
		extractElectableAmount(input.general, ThAssessableField.Section40_8_General) +
		extractElectableAmount(input.entertainer, ThAssessableField.Section40_8_Entertainer)
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
	const s1 = extractElectableAmount(input.section40_1, ThAssessableField.Section40_1)
	const s2 = extractElectableAmount(input.section40_2, ThAssessableField.Section40_2)
	const s3 = extractElectableAmount(input.section40_3, ThAssessableField.Section40_3)
	const s4 = extractElectableAmount(
		typeof input.section40_4 === "number" ? input.section40_4 : input.section40_4?.amount,
		ThAssessableField.Section40_4,
	)
	const s5 = sumSection40_5(input.section40_5)
	const s6 = sumSection40_6(input.section40_6)
	const s7 = extractElectableAmount(input.section40_7, ThAssessableField.Section40_7)
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

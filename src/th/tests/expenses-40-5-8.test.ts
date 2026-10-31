import { describe, expect, it } from "bun:test"
import { calculateElectableItemExpense } from "../stages/electable-expense"
import { calculateExpenseDeductions } from "../stages/expenses"
import { calculateExpenses40_5 } from "../stages/expenses-40-5"
import { calculateExpenses40_6 } from "../stages/expenses-40-6"
import { calculateExpenses40_7 } from "../stages/expenses-40-7"
import { calculateExpenses40_8 } from "../stages/expenses-40-8"

describe("Section 40(5)–40(8) Expense Deductions", () => {
	it("handles electable expense edge cases", () => {
		expect(calculateElectableItemExpense(undefined, 0.3, "f").allowed).toBe(0)
		expect(calculateElectableItemExpense(0, 0.3, "f").allowed).toBe(0)
		expect(calculateElectableItemExpense(-10, 0.3, "f").allowed).toBe(0)
	})

	it("calculates Section 40(5) rental expenses standard and actual", () => {
		expect(calculateExpenses40_5(undefined).allowed).toBe(0)
		const standard = calculateExpenses40_5({
			building: 100_000, // 30% = 30k
			agriculturalLand: 100_000, // 20% = 20k
			nonAgriculturalLand: 100_000, // 15% = 15k
			vehicles: 100_000, // 30% = 30k
			other: 100_000, // 10% = 10k
		})
		expect(standard.allowed).toBe(105_000)
		expect(standard.wasClamped).toBe(false)

		const actualClamped = calculateExpenses40_5({
			building: { amount: 50_000, expenseElection: "actual", actualExpense: 70_000 },
		})
		expect(actualClamped.allowed).toBe(50_000)
		expect(actualClamped.wasClamped).toBe(true)
	})

	it("calculates Section 40(6) liberal professions deductions", () => {
		expect(calculateExpenses40_6(undefined).allowed).toBe(0)
		const res = calculateExpenses40_6({
			medical: 100_000, // 60% = 60k
			law: 50_000, // 30% = 15k
			engineering: 50_000, // 30% = 15k
			architecture: 50_000, // 30% = 15k
			accounting: 50_000, // 30% = 15k
			fineArts: 50_000, // 30% = 15k
			other: 50_000, // 30% = 15k
		})
		expect(res.allowed).toBe(150_000)
		expect(res.wasClamped).toBe(false)
	})

	it("calculates Section 40(7) contracting deductions", () => {
		expect(calculateExpenses40_7(undefined).allowed).toBe(0)
		const standard = calculateExpenses40_7(100_000)
		expect(standard.allowed).toBe(60_000)
		const actual = calculateExpenses40_7({
			amount: 100_000,
			expenseElection: "actual",
			actualExpense: 75_000,
		})
		expect(actual.allowed).toBe(75_000)
	})

	it("calculates Section 40(8) business and tiered entertainer deductions", () => {
		expect(calculateExpenses40_8(undefined).allowed).toBe(0)
		const num = calculateExpenses40_8(100_000)
		expect(num.allowed).toBe(60_000)

		const objAmount = calculateExpenses40_8({ amount: 200_000 })
		expect(objAmount.allowed).toBe(120_000)

		// Entertainer: 60% on first 300k, 40% on excess, max 600k
		// First tier only: 200k * 60% = 120k
		const entFirstTier = calculateExpenses40_8({ entertainer: 200_000 })
		expect(entFirstTier.allowed).toBe(120_000)

		// Both tiers: 300k * 60% (180k) + 700k * 40% (280k) = 460k
		const entBothTiers = calculateExpenses40_8({
			general: 100_000, // 60k
			entertainer: 1_000_000, // 460k
		})
		expect(entBothTiers.allowed).toBe(520_000)

		// Entertainer ceiling: 2M * 60%/40% = 180k + 1.7M * 40% (680k) = 860k -> clamped to 600k
		const entCeiling = calculateExpenses40_8({ entertainer: 2_000_000 })
		expect(entCeiling.allowed).toBe(600_000)
		expect(entCeiling.wasClamped).toBe(true)

		// Entertainer actual expense
		const entActual = calculateExpenses40_8({
			entertainer: { amount: 500_000, expenseElection: "actual", actualExpense: 200_000 },
		})
		expect(entActual.allowed).toBe(200_000)

		const entActualDefault = calculateExpenses40_8({
			entertainer: { amount: 100_000, expenseElection: "actual" },
		})
		expect(entActualDefault.allowed).toBe(0)

		// Entertainer 0 amount edge case
		expect(calculateExpenses40_8({ entertainer: 0 }).allowed).toBe(0)
		expect(calculateExpenses40_8({ entertainer: { amount: 0 } }).allowed).toBe(0)
	})

	it("aggregates all expense deductions in calculateExpenseDeductions", () => {
		const assessable = {
			section40_1: 100_000,
			section40_2: 0,
			section40_3: 0,
			section40_4: 0,
			section40_5: 0,
			section40_6: 0,
			section40_7: 0,
			section40_8: 0,
			total: 100_000,
			grossNonEmploymentIncome: 0,
		}
		const res = calculateExpenseDeductions({}, assessable)
		expect(res.section40_1_2.allowed).toBe(50_000)
		expect(res.total).toBe(50_000)
	})
})

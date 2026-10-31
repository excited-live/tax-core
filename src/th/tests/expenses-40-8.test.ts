import { describe, expect, it } from "bun:test"
import { calculateExpenses40_8 } from "../stages/expenses-40-8"

describe("Section 40(8) Business and Tiered Entertainer Expense Deductions", () => {
	it("returns zero deductions when input is undefined", () => {
		expect(calculateExpenses40_8(undefined).allowed).toBe(0)
	})

	it("calculates 60% for general commerce income", () => {
		const num = calculateExpenses40_8(100_000)
		expect(num.allowed).toBe(60_000)

		const objAmount = calculateExpenses40_8({ amount: 200_000 })
		expect(objAmount.allowed).toBe(120_000)
	})

	it("calculates tiered entertainer deduction: 60% on first 300k, 40% on excess", () => {
		// First tier only: 200k * 60% = 120k
		const entFirstTier = calculateExpenses40_8({ entertainer: 200_000 })
		expect(entFirstTier.allowed).toBe(120_000)

		// Both tiers: 300k * 60% (180k) + 700k * 40% (280k) = 460k + 60k general = 520k
		const entBothTiers = calculateExpenses40_8({
			general: 100_000,
			entertainer: 1_000_000,
		})
		expect(entBothTiers.allowed).toBe(520_000)
	})

	it("clamps entertainer expense to 600,000 THB statutory ceiling", () => {
		const entCeiling = calculateExpenses40_8({ entertainer: 2_000_000 })
		expect(entCeiling.allowed).toBe(600_000)
		expect(entCeiling.wasClamped).toBe(true)
	})

	it("supports actual expense election for entertainer", () => {
		const entActual = calculateExpenses40_8({
			entertainer: {
				amount: 500_000,
				expenseElection: "actual",
				actualExpense: 200_000,
			},
		})
		expect(entActual.allowed).toBe(200_000)

		const entActualDefault = calculateExpenses40_8({
			entertainer: { amount: 100_000, expenseElection: "actual" },
		})
		expect(entActualDefault.allowed).toBe(0)

		expect(calculateExpenses40_8({ entertainer: 0 }).allowed).toBe(0)
		expect(calculateExpenses40_8({ entertainer: { amount: 0 } }).allowed).toBe(0)
	})
})

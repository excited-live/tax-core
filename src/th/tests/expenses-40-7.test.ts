import { describe, expect, it } from "bun:test"
import { calculateExpenses40_7 } from "../stages/expenses-40-7"

describe("Section 40(7) Contracting Expense Deductions", () => {
	it("returns zero deductions when input is undefined", () => {
		const res = calculateExpenses40_7(undefined)
		expect(res.allowed).toBe(0)
		expect(res.wasClamped).toBe(false)
	})

	it("calculates standard 60% deduction for contracting", () => {
		const standard = calculateExpenses40_7(100_000)
		expect(standard.requested).toBe(60_000)
		expect(standard.allowed).toBe(60_000)
		expect(standard.wasClamped).toBe(false)
	})

	it("supports actual expense election for contracting", () => {
		const actual = calculateExpenses40_7({
			amount: 100_000,
			expenseElection: "actual",
			actualExpense: 75_000,
		})
		expect(actual.requested).toBe(75_000)
		expect(actual.allowed).toBe(75_000)
		expect(actual.wasClamped).toBe(false)
	})
})

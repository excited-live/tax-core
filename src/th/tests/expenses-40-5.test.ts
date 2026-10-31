import { describe, expect, it } from "bun:test"
import { calculateExpenses40_5 } from "../stages/expenses-40-5"

describe("Section 40(5) Rental Property Expense Deductions", () => {
	it("returns zero deductions when input is undefined", () => {
		const res = calculateExpenses40_5(undefined)
		expect(res.requested).toBe(0)
		expect(res.allowed).toBe(0)
		expect(res.cap).toBe(0)
		expect(res.wasClamped).toBe(false)
	})

	it("calculates standard statutory rates across property sub-categories", () => {
		const standard = calculateExpenses40_5({
			building: 100_000, // 30% = 30k
			agriculturalLand: 100_000, // 20% = 20k
			nonAgriculturalLand: 100_000, // 15% = 15k
			vehicles: 100_000, // 30% = 30k
			other: 100_000, // 10% = 10k
		})
		expect(standard.requested).toBe(105_000)
		expect(standard.allowed).toBe(105_000)
		expect(standard.wasClamped).toBe(false)
	})

	it("supports actual expense deduction capped at property income", () => {
		const actualClamped = calculateExpenses40_5({
			building: {
				amount: 50_000,
				expenseElection: "actual",
				actualExpense: 70_000,
			},
		})
		expect(actualClamped.requested).toBe(70_000)
		expect(actualClamped.allowed).toBe(50_000)
		expect(actualClamped.wasClamped).toBe(true)
	})
})

import { describe, expect, it } from "bun:test"
import { calculateExpenses40_1_2 } from "../stages/expenses-40-1-2"
import { calculateExpenses40_3 } from "../stages/expenses-40-3"
import { calculateExpenses40_4 } from "../stages/expenses-40-4"

describe("Section 40(1)–40(4) Expense Deductions", () => {
	describe("Section 40(1) & 40(2) combined 50% max 100k", () => {
		it("calculates 50% deduction when below 100,000 THB ceiling", () => {
			const res = calculateExpenses40_1_2(60_000, 40_000)
			expect(res.requested).toBe(50_000)
			expect(res.allowed).toBe(50_000)
			expect(res.cap).toBe(100_000)
			expect(res.wasClamped).toBe(false)
		})

		it("clamps to 100,000 THB when 50% exceeds ceiling", () => {
			const res = calculateExpenses40_1_2(300_000, 200_000)
			expect(res.requested).toBe(250_000)
			expect(res.allowed).toBe(100_000)
			expect(res.cap).toBe(100_000)
			expect(res.wasClamped).toBe(true)
		})
	})

	describe("Section 40(3) royalties & copyright standard vs actual", () => {
		it("returns 0 deduction for zero income", () => {
			const res = calculateExpenses40_3(undefined, 0)
			expect(res.allowed).toBe(0)
			expect(res.wasClamped).toBe(false)
		})

		it("applies 50% standard deduction up to 100,000 THB ceiling", () => {
			const below = calculateExpenses40_3(120_000, 120_000)
			expect(below.requested).toBe(60_000)
			expect(below.allowed).toBe(60_000)
			expect(below.wasClamped).toBe(false)

			const above = calculateExpenses40_3(400_000, 400_000)
			expect(above.requested).toBe(200_000)
			expect(above.allowed).toBe(100_000)
			expect(above.wasClamped).toBe(true)
		})

		it("supports actual expense deduction capped at income", () => {
			const actualUnder = calculateExpenses40_3(
				{ amount: 100_000, expenseElection: "actual", actualExpense: 40_000 },
				100_000,
			)
			expect(actualUnder.requested).toBe(40_000)
			expect(actualUnder.allowed).toBe(40_000)
			expect(actualUnder.wasClamped).toBe(false)

			const actualOver = calculateExpenses40_3(
				{ amount: 100_000, expenseElection: "actual", actualExpense: 150_000 },
				100_000,
			)
			expect(actualOver.requested).toBe(150_000)
			expect(actualOver.allowed).toBe(100_000)
			expect(actualOver.wasClamped).toBe(true)

			const actualDefault = calculateExpenses40_3(
				{ amount: 100_000, expenseElection: "actual" },
				100_000,
			)
			expect(actualDefault.allowed).toBe(0)
		})
	})

	describe("Section 40(4) 0% expense deduction", () => {
		it("always returns 0 expense deduction", () => {
			const res = calculateExpenses40_4(1_000_000)
			expect(res.requested).toBe(0)
			expect(res.allowed).toBe(0)
			expect(res.wasClamped).toBe(false)
		})
	})
})

import { describe, expect, it } from "bun:test"
import { calculateElectableItemExpense } from "../stages/electable-expense"

describe("Electable Item Expense calculation", () => {
	it("handles undefined, zero, and negative amounts", () => {
		expect(calculateElectableItemExpense(undefined, 0.3, "f").allowed).toBe(0)
		expect(calculateElectableItemExpense(0, 0.3, "f").allowed).toBe(0)
		expect(calculateElectableItemExpense(-10, 0.3, "f").allowed).toBe(0)
	})

	it("calculates standard deduction percentage without clamping", () => {
		const res = calculateElectableItemExpense(100_000, 0.3, "test.field")
		expect(res.requested).toBe(30_000)
		expect(res.allowed).toBe(30_000)
		expect(res.cap).toBe(100_000)
		expect(res.wasClamped).toBe(false)
	})

	it("supports actual expense election capped at income amount", () => {
		const actual = calculateElectableItemExpense(
			{ amount: 100_000, expenseElection: "actual", actualExpense: 45_000 },
			0.3,
			"test.field",
		)
		expect(actual.requested).toBe(45_000)
		expect(actual.allowed).toBe(45_000)
		expect(actual.wasClamped).toBe(false)
	})
})

import { describe, expect, it } from "bun:test"
import { calculateExpenses40_4 } from "../stages/expenses-40-4"

describe("Section 40(4) 0% Expense Deduction", () => {
	it("always returns 0 expense deduction for interest, dividends, and crypto", () => {
		const res = calculateExpenses40_4(1_000_000)
		expect(res.requested).toBe(0)
		expect(res.allowed).toBe(0)
		expect(res.cap).toBe(0)
		expect(res.wasClamped).toBe(false)
	})
})

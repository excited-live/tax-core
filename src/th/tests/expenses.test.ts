import { describe, expect, it } from "bun:test"
import { calculateExpenseDeductions } from "../stages/expenses"

describe("Aggregate Expense Deductions calculation", () => {
	it("aggregates all Section 40(1)–40(8) deductions into breakdown", () => {
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

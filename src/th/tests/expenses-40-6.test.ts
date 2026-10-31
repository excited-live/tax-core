import { describe, expect, it } from "bun:test"
import { calculateExpenses40_6 } from "../stages/expenses-40-6"

describe("Section 40(6) Liberal Professions Expense Deductions", () => {
	it("returns zero deductions when input is undefined", () => {
		const res = calculateExpenses40_6(undefined)
		expect(res.requested).toBe(0)
		expect(res.allowed).toBe(0)
		expect(res.cap).toBe(0)
		expect(res.wasClamped).toBe(false)
	})

	it("calculates 60% for medical and 30% for other professions", () => {
		const res = calculateExpenses40_6({
			medical: 100_000, // 60% = 60k
			law: 50_000, // 30% = 15k
			engineering: 50_000, // 30% = 15k
			architecture: 50_000, // 30% = 15k
			accounting: 50_000, // 30% = 15k
			fineArts: 50_000, // 30% = 15k
			other: 50_000, // 30% = 15k
		})
		expect(res.requested).toBe(150_000)
		expect(res.allowed).toBe(150_000)
		expect(res.wasClamped).toBe(false)
	})
})

import { describe, expect, it } from "bun:test"
import { money } from "../money"
import { calculateTax } from "./runner"
import type { TaxResult, TaxSystem } from "./types"

describe("TaxSystem and calculateTax runner", () => {
	interface MockInput {
		income: number
	}

	const mockSystem: TaxSystem<MockInput, "THB", { deduction: number }> = {
		jurisdiction: "TH",
		taxYear: 2026,
		currency: "THB",
		calculate(input: MockInput): TaxResult<"THB", { deduction: number }> {
			const gross = money(input.income, "THB")
			return {
				jurisdiction: "TH",
				taxYear: 2026,
				currency: "THB",
				grossIncome: gross,
				taxableIncome: gross,
				totalTax: money(0, "THB"),
				effectiveRate: 0,
				marginalRate: 0,
				netTaxPayable: money(0, "THB"),
				breakdown: { deduction: 0 },
			}
		},
	}

	it("executes system calculate and returns standard result envelope", () => {
		const result = calculateTax(mockSystem, { income: 50_000 })
		expect(result.jurisdiction).toBe("TH")
		expect(result.taxYear).toBe(2026)
		expect(result.currency).toBe("THB")
		expect(result.grossIncome).toBe(money(50_000, "THB"))
	})
})

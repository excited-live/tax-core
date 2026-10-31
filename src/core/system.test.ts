import { describe, expect, it } from "bun:test"
import { calculateTax, type TaxResult, type TaxSystem } from "./system"

describe("Standardized TaxSystem and TaxResult contract", () => {
	interface MockInput {
		readonly assessableIncome: number
		readonly taxYear?: number
	}

	interface MockBreakdown {
		readonly standardDeduction: number
	}

	const mockSystem: TaxSystem<MockInput, "THB", MockBreakdown> = {
		jurisdiction: "TH",
		currency: "THB",
		supportedYears: [2026],
		calculate: (input: MockInput): TaxResult<"THB", MockBreakdown> => {
			const grossIncome = input.assessableIncome
			const totalDeductions = 100_000
			const taxableIncome = Math.max(0, grossIncome - totalDeductions)
			const totalTax = taxableIncome * 0.1
			const withholdingAndCredits = 2000
			const netTaxPayable = totalTax - withholdingAndCredits
			const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0
			const marginalRate = 0.1

			return {
				jurisdiction: "TH",
				taxYear: input.taxYear ?? 2026,
				currency: "THB",
				grossIncome,
				totalDeductions,
				taxableIncome,
				totalTax,
				withholdingAndCredits,
				netTaxPayable,
				effectiveRate,
				marginalRate,
				breakdown: {
					standardDeduction: totalDeductions,
				},
			}
		},
	}

	it("runs calculation via calculateTax helper and returns standard envelope", () => {
		const result = calculateTax(mockSystem, { assessableIncome: 500_000 })

		expect(result.jurisdiction).toBe("TH")
		expect(result.taxYear).toBe(2026)
		expect(result.currency).toBe("THB")
		expect(result.grossIncome).toBe(500_000)
		expect(result.totalDeductions).toBe(100_000)
		expect(result.taxableIncome).toBe(400_000)
		expect(result.totalTax).toBe(40_000)
		expect(result.withholdingAndCredits).toBe(2000)
		expect(result.netTaxPayable).toBe(38_000)
		expect(result.effectiveRate).toBe(0.08)
		expect(result.marginalRate).toBe(0.1)
		expect(result.breakdown.standardDeduction).toBe(100_000)
	})
})

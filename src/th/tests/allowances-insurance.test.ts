import { describe, expect, it } from "bun:test"
import { calculateInsuranceAllowances } from "../stages/allowances-insurance"

describe("Thailand Insurance and Housing Allowances", () => {
	it("clamps Social Security Fund to 10,500 THB", () => {
		const under = calculateInsuranceAllowances({ socialSecurity: 9_000 })
		expect(under.socialSecurity.allowed).toBe(9_000)
		expect(under.socialSecurity.wasClamped).toBe(false)

		const over = calculateInsuranceAllowances({ socialSecurity: 15_000 })
		expect(over.socialSecurity.allowed).toBe(10_500)
		expect(over.socialSecurity.wasClamped).toBe(true)
	})

	it("enforces life and health insurance statutory limits", () => {
		// Health insurance capped at 25k
		const healthOver = calculateInsuranceAllowances({
			lifeInsurance: 50_000,
			healthInsurance: 30_000,
		})
		expect(healthOver.lifeInsurance.allowed).toBe(75_000) // 50k + 25k allowed

		// Life + Health combined capped at 100k
		const combinedOver = calculateInsuranceAllowances({
			lifeInsurance: 90_000,
			healthInsurance: 20_000,
		})
		expect(combinedOver.lifeInsurance.allowed).toBe(100_000)
		expect(combinedOver.lifeInsurance.wasClamped).toBe(true)
	})

	it("clamps parent health insurance to 15,000 THB", () => {
		const res = calculateInsuranceAllowances({ parentHealthInsurance: 20_000 })
		expect(res.parentHealthInsurance.allowed).toBe(15_000)
		expect(res.parentHealthInsurance.wasClamped).toBe(true)
	})

	it("evaluates spouse life insurance eligibility and cap (10,000 THB)", () => {
		const single = calculateInsuranceAllowances({ spouseLifeInsurance: 10_000 }, "single")
		expect(single.spouseLifeInsurance.allowed).toBe(0)
		expect(single.spouseLifeInsurance.wasClamped).toBe(true)

		const married = calculateInsuranceAllowances(
			{ spouseLifeInsurance: 15_000 },
			"married_no_income_spouse",
		)
		expect(married.spouseLifeInsurance.allowed).toBe(10_000)
		expect(married.spouseLifeInsurance.wasClamped).toBe(true)
	})

	it("clamps mortgage interest allowance to 100,000 THB", () => {
		const under = calculateInsuranceAllowances({ mortgageInterest: 80_000 })
		expect(under.mortgageInterest.allowed).toBe(80_000)

		const over = calculateInsuranceAllowances({ mortgageInterest: 120_000 })
		expect(over.mortgageInterest.allowed).toBe(100_000)
		expect(over.mortgageInterest.wasClamped).toBe(true)
	})
})

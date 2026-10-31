import { describe, expect, it } from "bun:test"
import { toMinorUnits, usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsAmt } from "./amt"

describe("Form 6251 Alternative Minimum Tax Stage", () => {
	it("returns zero AMT when tentative minimum tax is below regular tax", () => {
		// Single with $80,000 taxable income, 0 SALT addback, 0 preferences, regular tax = $12,000
		// AMTI = $80,000 <= $90,100 exemption -> AMT base = 0 -> TMT = 0.
		const res = calculateUsAmt(
			toMinorUnits(80_000, "USD"),
			0,
			undefined,
			toMinorUnits(12_000, "USD"),
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.amtTaxCents).toBe(0)
		expect(res.breakdown.amtTax).toBe(usd(0))
		expect(res.breakdown.allowedExemption).toBe(usd(90_100))
	})

	it("computes AMT when ISO exercise creates large AMTI preference", () => {
		// Single filer:
		// Taxable income: $150,000 (15,000,000 cents).
		// Regular tax: $26,000 (2,600,000 cents).
		// ISO bargain element preference: $200,000.
		// SALT addback: $10,000.
		// AMTI: 150,000 + 10,000 + 200,000 = $360,000.
		// Phaseout threshold: $643,250 -> AMTI below phaseout -> full exemption $90,100 allowed.
		// AMT taxable base: 360,000 - 90,100 = $269,900.
		// 26% threshold: $239,100.
		// TMT: 239,100 * 0.26 + (269,900 - 239,100) * 0.28
		// = 62,166 + 30,800 * 0.28 = 62,166 + 8,624 = 70,790.
		// AMT: 70,790 - 26,000 = 44,790.
		const res = calculateUsAmt(
			toMinorUnits(150_000, "USD"),
			toMinorUnits(10_000, "USD"),
			200_000,
			toMinorUnits(26_000, "USD"),
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.amti).toBe(usd(360_000))
		expect(res.breakdown.allowedExemption).toBe(usd(90_100))
		expect(res.breakdown.amtTaxableBase).toBe(usd(269_900))
		expect(res.breakdown.tentativeMinimumTax).toBe(usd(70_790))
		expect(res.breakdown.amtTax).toBe(usd(44_790))
	})

	it("phases out exemption at 25% for high AMTI above threshold", () => {
		// MFJ with $1,400,000 AMTI.
		// MFJ base exemption: $140,200.
		// MFJ phaseout threshold: $1,286,500.
		// Excess: 1,400,000 - 1,286,500 = $113,500.
		// Reduction: 113,500 * 0.25 = $28,375.
		// Allowed exemption: 140,200 - 28,375 = $111,825.
		const res = calculateUsAmt(
			toMinorUnits(1_400_000, "USD"),
			0,
			0,
			toMinorUnits(400_000, "USD"),
			"married_filing_jointly",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.exemptionReduction).toBe(usd(28_375))
		expect(res.breakdown.allowedExemption).toBe(usd(111_825))
	})
})

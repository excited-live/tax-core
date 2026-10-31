import { describe, expect, it } from "bun:test"
import { usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsFica } from "./fica"

describe("W-2 FICA Payroll Tax Stage", () => {
	it("returns zero taxes when includeFica is false", () => {
		const res = calculateUsFica({ w2Wages: 100_000 }, "single", false, US_2026_PARAMETERS)
		expect(res.totalFicaCents).toBe(0)
		expect(res.breakdown.enabled).toBe(false)
		expect(res.breakdown.totalFicaTax).toBe(usd(0))
	})

	it("computes standard 6.2% SS and 1.45% Medicare on moderate wage", () => {
		// $80,000 W-2 wages.
		// SS (6.2%): 80,000 * 0.062 = 4,960.
		// Medicare (1.45%): 80,000 * 0.0145 = 1,160.
		// Total: 6,120.
		const res = calculateUsFica({ w2Wages: 80_000 }, "single", true, US_2026_PARAMETERS)
		expect(res.breakdown.enabled).toBe(true)
		expect(res.breakdown.socialSecurityTax).toBe(usd(4_960))
		expect(res.breakdown.medicareTax).toBe(usd(1_160))
		expect(res.breakdown.additionalMedicareTax).toBe(usd(0))
		expect(res.breakdown.totalFicaTax).toBe(usd(6_120))
	})

	it("caps Social Security at wage base of $181,800", () => {
		// $300,000 W-2 wages.
		// SS: 181,800 * 0.062 = 11,271.60.
		// Medicare: 300,000 * 0.0145 = 4,350.
		// Additional Medicare: (300,000 - 200,000) * 0.009 = 900.
		// Total: 11,271.60 + 4,350 + 900 = 16,521.60.
		const res = calculateUsFica({ w2Wages: 300_000 }, "single", true, US_2026_PARAMETERS)
		expect(res.breakdown.socialSecurityWages).toBe(usd(181_800))
		expect(res.breakdown.socialSecurityTax).toBe(usd(11_271.6))
		expect(res.breakdown.medicareTax).toBe(usd(4_350))
		expect(res.breakdown.additionalMedicareSubject).toBe(usd(100_000))
		expect(res.breakdown.additionalMedicareTax).toBe(usd(900))
		expect(res.breakdown.totalFicaTax).toBe(usd(16_521.6))
	})

	it("computes Additional Medicare on combined W-2 and SE earnings for MFJ", () => {
		// MFJ threshold: $250,000.
		// W-2: $200,000.
		// SE net: $100,000 * 0.9235 = $92,350.
		// Combined: 292,350.
		// Excess: 42,350.
		// Additional Medicare: 42,350 * 0.009 = 381.15.
		const res = calculateUsFica(
			{
				w2Wages: 200_000,
				selfEmploymentNetEarnings: 100_000,
			},
			"married_filing_jointly",
			true,
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.additionalMedicareSubject).toBe(usd(42_350))
		expect(res.breakdown.additionalMedicareTax).toBe(usd(381.15))
	})

	it("applies $125,000 Additional Medicare threshold for MFS", () => {
		const res = calculateUsFica(
			{ w2Wages: 150_000 },
			"married_filing_separately",
			true,
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.additionalMedicareSubject).toBe(usd(25_000))
		expect(res.breakdown.additionalMedicareTax).toBe(usd(225))
	})
})

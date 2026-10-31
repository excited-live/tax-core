import { describe, expect, it } from "bun:test"
import { toMinorUnits, usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsNiit } from "./niit"

describe("Net Investment Income Tax (NIIT) Stage", () => {
	it("returns zero tax when MAGI is below statutory threshold", () => {
		const agiCents = toMinorUnits(180_000, "USD")
		const res = calculateUsNiit(
			{
				filingStatus: "single",
				income: {
					w2Wages: 150_000,
					ordinaryInterest: 10_000,
					qualifiedDividends: 20_000,
				},
			},
			agiCents,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.tax).toBe(usd(0))
		expect(res.breakdown.excessMagi).toBe(usd(0))
		expect(res.breakdown.subjectAmount).toBe(usd(0))
	})

	it("computes 3.8% tax when NII is lesser than excess MAGI", () => {
		// Single threshold = 200,000. MAGI = 300,000 -> excess = 100,000.
		// NII = 40,000. Subject = 40,000. Tax = 40,000 * 0.038 = 1,520.
		const agiCents = toMinorUnits(300_000, "USD")
		const res = calculateUsNiit(
			{
				filingStatus: "single",
				income: {
					w2Wages: 260_000,
					ordinaryDividends: 10_000,
					longTermCapitalGains: 30_000,
				},
			},
			agiCents,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.netInvestmentIncome).toBe(usd(40_000))
		expect(res.breakdown.excessMagi).toBe(usd(100_000))
		expect(res.breakdown.subjectAmount).toBe(usd(40_000))
		expect(res.tax).toBe(usd(1_520))
	})

	it("computes 3.8% tax when excess MAGI is lesser than NII", () => {
		// Single threshold = 200,000. MAGI = 210,000 -> excess = 10,000.
		// NII = 50,000. Subject = 10,000. Tax = 10,000 * 0.038 = 380.
		const agiCents = toMinorUnits(210_000, "USD")
		const res = calculateUsNiit(
			{
				filingStatus: "single",
				income: {
					shortTermCapitalGains: 50_000,
				},
			},
			agiCents,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.netInvestmentIncome).toBe(usd(50_000))
		expect(res.breakdown.excessMagi).toBe(usd(10_000))
		expect(res.breakdown.subjectAmount).toBe(usd(10_000))
		expect(res.tax).toBe(usd(380))
	})

	it("respects NII and MAGI overrides", () => {
		const agiCents = toMinorUnits(100_000, "USD")
		const res = calculateUsNiit(
			{
				filingStatus: "married_filing_jointly",
				income: {},
				magi: 300_000, // MFJ threshold 250,000 -> excess 50,000
				netInvestmentIncome: 20_000,
			},
			agiCents,
			"married_filing_jointly",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.threshold).toBe(usd(250_000))
		expect(res.breakdown.excessMagi).toBe(usd(50_000))
		expect(res.breakdown.subjectAmount).toBe(usd(20_000))
		expect(res.tax).toBe(usd(760)) // 20,000 * 0.038 = 760
	})

	it("applies statutory thresholds for MFS ($125,000) and HoH ($200,000)", () => {
		const mfs = calculateUsNiit(
			{
				filingStatus: "married_filing_separately",
				income: {},
				magi: 130_000,
				netInvestmentIncome: 10_000,
			},
			0,
			"married_filing_separately",
			US_2026_PARAMETERS,
		)
		expect(mfs.breakdown.threshold).toBe(usd(125_000))
		expect(mfs.breakdown.excessMagi).toBe(usd(5_000))

		const hoh = calculateUsNiit(
			{ filingStatus: "head_of_household", income: {}, magi: 220_000, netInvestmentIncome: 10_000 },
			0,
			"head_of_household",
			US_2026_PARAMETERS,
		)
		expect(hoh.breakdown.threshold).toBe(usd(200_000))
		expect(hoh.breakdown.excessMagi).toBe(usd(20_000))
	})
})

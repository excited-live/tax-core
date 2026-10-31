import { describe, expect, it } from "bun:test"
import { toMinorUnits, usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsDeductions } from "./deductions"
import { calculateUsItemizedDeductions } from "./itemized-deduction"
import { calculateUsStandardDeduction } from "./standard-deduction"

describe("Standard vs Itemized Deductions Stage", () => {
	it("computes base standard deduction for all 4 filing statuses", () => {
		const single = calculateUsStandardDeduction(
			{ filingStatus: "single", income: {} },
			"single",
			US_2026_PARAMETERS,
		)
		const mfj = calculateUsStandardDeduction(
			{ filingStatus: "married_filing_jointly", income: {} },
			"married_filing_jointly",
			US_2026_PARAMETERS,
		)
		const mfs = calculateUsStandardDeduction(
			{ filingStatus: "married_filing_separately", income: {} },
			"married_filing_separately",
			US_2026_PARAMETERS,
		)
		const hoh = calculateUsStandardDeduction(
			{ filingStatus: "head_of_household", income: {} },
			"head_of_household",
			US_2026_PARAMETERS,
		)

		expect(single.breakdown.total).toBe(usd(16_100))
		expect(mfj.breakdown.total).toBe(usd(32_200))
		expect(mfs.breakdown.total).toBe(usd(16_100))
		expect(hoh.breakdown.total).toBe(usd(24_150))
	})

	it("computes additional standard deductions for age and blindness", () => {
		const singleSeniorBlind = calculateUsStandardDeduction(
			{ filingStatus: "single", income: {}, taxpayerAge65OrOlder: true, taxpayerBlind: true },
			"single",
			US_2026_PARAMETERS,
		)
		expect(singleSeniorBlind.breakdown.additionalConditionsCount).toBe(2)
		expect(singleSeniorBlind.breakdown.additionalTotal).toBe(usd(4_100))
		expect(singleSeniorBlind.breakdown.total).toBe(usd(20_200))

		const mfjBothSeniorOneBlind = calculateUsStandardDeduction(
			{
				filingStatus: "married_filing_jointly",
				income: {},
				taxpayerAge65OrOlder: true,
				spouseAge65OrOlder: true,
				spouseBlind: true,
			},
			"married_filing_jointly",
			US_2026_PARAMETERS,
		)
		expect(mfjBothSeniorOneBlind.breakdown.additionalConditionsCount).toBe(3)
		expect(mfjBothSeniorOneBlind.breakdown.additionalTotal).toBe(usd(4_950))
		expect(mfjBothSeniorOneBlind.breakdown.total).toBe(usd(37_150))
	})

	it("computes Schedule A itemized deductions with medical floor, SALT cap, and charity ceiling", () => {
		const agiCents = toMinorUnits(100_000, "USD")
		const itm = calculateUsItemizedDeductions(
			{
				medicalExpenses: 12_500, // floor 7.5% of 100k = 7,500 -> allowed 5,000
				stateAndLocalTaxes: 14_000, // cap 10,000 -> allowed 10,000
				mortgageInterest: 8_000,
				charitableContributions: 70_000, // ceil 60% of 100k = 60,000 -> allowed 60,000
			},
			agiCents,
			"single",
			US_2026_PARAMETERS,
		)

		expect(itm.breakdown.medical.allowed).toBe(5_000)
		expect(itm.breakdown.medical.cap).toBe(7_500)
		expect(itm.breakdown.salt.allowed).toBe(10_000)
		expect(itm.breakdown.mortgageInterest).toBe(usd(8_000))
		expect(itm.breakdown.charity.allowed).toBe(60_000)
		expect(itm.breakdown.total).toBe(usd(83_000))
	})

	it("clamps SALT to $5,000 for married filing separately", () => {
		const itm = calculateUsItemizedDeductions(
			{ stateAndLocalTaxes: 12_000 },
			toMinorUnits(50_000, "USD"),
			"married_filing_separately",
			US_2026_PARAMETERS,
		)
		expect(itm.breakdown.salt.allowed).toBe(5_000)
	})

	it("automatically elects higher deduction in auto mode and honors manual override", () => {
		const agiCents = toMinorUnits(100_000, "USD")
		const autoResult = calculateUsDeductions(
			{
				filingStatus: "single",
				income: {},
				itemizedDeductions: {
					stateAndLocalTaxes: 10_000,
					mortgageInterest: 10_000, // total itemized = 20,000 > standard 16,100
				},
			},
			agiCents,
			0,
			"single",
			US_2026_PARAMETERS,
		)
		expect(autoResult.electedDeduction).toBe("itemized")
		expect(autoResult.allowableDeduction).toBe(usd(20_000))

		const forcedStdResult = calculateUsDeductions(
			{
				filingStatus: "single",
				income: {},
				deductionElection: "standard",
				itemizedDeductions: {
					stateAndLocalTaxes: 10_000,
					mortgageInterest: 10_000,
				},
			},
			agiCents,
			0,
			"single",
			US_2026_PARAMETERS,
		)
		expect(forcedStdResult.electedDeduction).toBe("standard")
		expect(forcedStdResult.allowableDeduction).toBe(usd(16_100))
	})

	it("slices ordinary and preferential taxable income correctly", () => {
		const agiCents = toMinorUnits(100_000, "USD")
		const prefCents = toMinorUnits(30_000, "USD")
		// standard deduction = 16,100
		// taxable income = 100,000 - 16,100 = 83,900
		// ordinary taxable = 83,900 - 30,000 = 53,900
		// pref taxable = 30,000
		const res = calculateUsDeductions(
			{ filingStatus: "single", income: {} },
			agiCents,
			prefCents,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.taxableIncome).toBe(usd(83_900))
		expect(res.ordinaryTaxableIncome).toBe(usd(53_900))
		expect(res.preferentialTaxableIncome).toBe(usd(30_000))
	})
})

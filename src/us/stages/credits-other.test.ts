import { describe, expect, it } from "bun:test"
import { usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsOtherCredits } from "./credits-other"

describe("Child Care, Education, FTC, and Custom Credits Stage", () => {
	it("returns all zeroes when no other credits are provided", () => {
		const res = calculateUsOtherCredits(
			undefined,
			50_000,
			50_000,
			50_000,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.careNonRefundableCents).toBe(0)
		expect(res.aotcNonRefundableCents).toBe(0)
		expect(res.aotcRefundableCents).toBe(0)
		expect(res.foreignTaxCreditCents).toBe(0)
	})

	it("computes Child and Dependent Care credit with sliding AGI rate", () => {
		// 1 individual -> max $3,000 expenses. Expenses $4,000.
		// AGI = $25,000 -> excess over 15,000 = $10,000 -> 5 steps of 1% = 5% reduction.
		// Rate = 35% - 5% = 30%.
		// Credit: $3,000 * 30% = $900.
		const res = calculateUsOtherCredits(
			{
				qualifyingIndividualsForCare: 1,
				childAndDependentCareExpenses: 4_000,
			},
			50_000,
			25_000,
			25_000,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.careNonRefundableCents).toBe(90_000)
	})

	it("computes AOTC with 40% refundable and 60% non-refundable split", () => {
		// Student with $4,000 expenses.
		// 100% of first $2,000 + 25% of next $2,000 = $2,000 + $500 = $2,500.
		// Refundable 40%: $1,000. Non-refundable 60%: $1,500.
		const res = calculateUsOtherCredits(
			{
				educationStudents: [{ type: "aotc", qualifiedExpenses: 4_000 }],
			},
			60_000,
			60_000,
			60_000,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.educationBreakdown.aotcRefundable).toBe(usd(1_000))
		expect(res.educationBreakdown.aotcNonRefundable).toBe(usd(1_500))
	})

	it("computes LLC and phases out education credits for MAGI between thresholds", () => {
		// Single filer LLC with $10,000 expenses: 20% = $2,000.
		// MAGI = $85,000 (halfway in $80k-$90k phaseout window) -> 50% factor.
		// LLC allowed = $2,000 * 0.5 = $1,000.
		const res = calculateUsOtherCredits(
			{
				educationStudents: [{ type: "llc", qualifiedExpenses: 10_000 }],
			},
			85_000,
			85_000,
			85_000,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.educationBreakdown.llcNonRefundable).toBe(usd(1_000))
	})

	it("ineligibility for education credits when MFS", () => {
		const res = calculateUsOtherCredits(
			{
				educationStudents: [{ type: "aotc", qualifiedExpenses: 4_000 }],
			},
			50_000,
			50_000,
			50_000,
			"married_filing_separately",
			US_2026_PARAMETERS,
		)
		expect(res.educationBreakdown.aotcRefundable).toBe(usd(0))
		expect(res.educationBreakdown.aotcNonRefundable).toBe(usd(0))
	})

	it("passes through foreign tax credit and custom credits", () => {
		const res = calculateUsOtherCredits(
			{
				foreignTaxCredit: 300,
				customNonRefundableCredits: 150,
				customRefundableCredits: 200,
			},
			50_000,
			50_000,
			50_000,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.foreignTaxCreditCents).toBe(30_000)
		expect(res.customNonRefundableCents).toBe(15_000)
		expect(res.customRefundableCents).toBe(20_000)
	})
})

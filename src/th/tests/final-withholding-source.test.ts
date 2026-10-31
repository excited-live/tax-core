import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { resolveSource } from "../stages/final-withholding-source"
import { ThFinalWithholdingElection, ThSpecialRegimeField } from "../types"

const resolve = (input: Parameters<typeof resolveSource>[0]) =>
	resolveSource(input, ThSpecialRegimeField.Interest, ThSpecialRegimeField.InterestElection, 0.15)

describe("Section 40(4) single-source resolution", () => {
	it("defaults an omitted source or election to include with no withholding", () => {
		const none = resolve(undefined)
		expect(none.breakdown.election).toBe(ThFinalWithholdingElection.Include)
		expect(none.satang).toBe(0)
		const bare = resolve(1_000)
		expect(bare.breakdown.election).toBe(ThFinalWithholdingElection.Include)
		expect(bare.taxSatang).toBe(0)
	})

	it("withholds the rate in satang when the election is final", () => {
		const res = resolve({ amount: 1_000, election: ThFinalWithholdingElection.Final })
		expect(res.satang).toBe(100_000)
		expect(res.taxSatang).toBe(15_000)
		expect(res.breakdown.tax).toBe(150)
	})

	it("throws against the election field for an unknown election", () => {
		const bad = { amount: 1, election: "FINAL" } as unknown as Parameters<typeof resolve>[0]
		expect(() => resolve(bad)).toThrow(TaxValidationError)
	})
})

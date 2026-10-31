import { describe, expect, it } from "bun:test"
import { toMinorUnits } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsCareCredit } from "./credits-care"

describe("Child and Dependent Care Credit Stage", () => {
	it("returns 0 when no qualifying individuals or expenses are provided", () => {
		expect(calculateUsCareCredit(undefined, 50_000, 50_000, US_2026_PARAMETERS)).toBe(0)
		expect(
			calculateUsCareCredit(
				{ qualifyingIndividualsForCare: 0, childAndDependentCareExpenses: 3_000 },
				50_000,
				50_000,
				US_2026_PARAMETERS,
			),
		).toBe(0)
	})

	it("computes care credit with sliding scale rate for low AGI", () => {
		const res = calculateUsCareCredit(
			{ qualifyingIndividualsForCare: 1, childAndDependentCareExpenses: 4_000 },
			50_000,
			14_000,
			US_2026_PARAMETERS,
		)
		// Max expense $3,000 * 35% base rate = $1,050
		expect(res).toBe(toMinorUnits(1_050, US_2026_PARAMETERS.currency))
	})

	it("computes care credit with floor 20% rate for high AGI and 2+ individuals", () => {
		const res = calculateUsCareCredit(
			{ qualifyingIndividualsForCare: 2, childAndDependentCareExpenses: 10_000 },
			60_000,
			60_000,
			US_2026_PARAMETERS,
		)
		// Max expense $6,000 * 20% floor rate = $1,200
		expect(res).toBe(toMinorUnits(1_200, US_2026_PARAMETERS.currency))
	})
})

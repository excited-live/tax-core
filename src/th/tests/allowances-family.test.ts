import { describe, expect, it } from "bun:test"
import { calculateFamilyAllowances } from "../stages/allowances-family"

describe("Thailand Family Allowances", () => {
	it("grants personal allowance of 60,000 THB", () => {
		const res = calculateFamilyAllowances({}, "single")
		expect(res.personal.allowed).toBe(60_000)
		expect(res.personal.cap).toBe(60_000)
	})

	it("evaluates spouse allowance according to filing status and cap", () => {
		const single = calculateFamilyAllowances({ spouse: 60_000 }, "single")
		expect(single.spouse.allowed).toBe(0)
		expect(single.spouse.wasClamped).toBe(true)

		const marriedNoIncome = calculateFamilyAllowances({}, "married_no_income_spouse")
		expect(marriedNoIncome.spouse.allowed).toBe(60_000)

		const marriedJoint = calculateFamilyAllowances({}, "married_joint")
		expect(marriedJoint.spouse.allowed).toBe(60_000)

		const marriedSeparate = calculateFamilyAllowances({ spouse: 60_000 }, "married_separate")
		expect(marriedSeparate.spouse.allowed).toBe(0)

		const clampedSpouse = calculateFamilyAllowances({ spouse: 80_000 }, "married_no_income_spouse")
		expect(clampedSpouse.spouse.allowed).toBe(60_000)
		expect(clampedSpouse.spouse.wasClamped).toBe(true)
	})

	it("calculates child allowance from array and count input with 2018+ bonus", () => {
		expect(calculateFamilyAllowances({ children: undefined }).children.allowed).toBe(0)

		// 1 child born 2020 -> 1st child gets 30,000 (no 2nd+ bonus)
		const oneChild = calculateFamilyAllowances({
			children: [{ birthYear: 2020 }],
		})
		expect(oneChild.children.allowed).toBe(30_000)

		// 3 children: 1st (2015), 2nd (2019, gets bonus), 3rd (2021, gets bonus)
		// Base: 3 * 30k = 90k, Bonus: 2 * 30k = 60k -> Total 150k
		const threeChildren = calculateFamilyAllowances({
			children: [{ birthYear: 2015 }, { birthYear: 2019 }, { birthYear: 2021 }],
		})
		expect(threeChildren.children.allowed).toBe(150_000)

		// Children array order independence (chronological birth order)
		const orderA = calculateFamilyAllowances({
			children: [{ birthYear: 2019 }, { birthYear: 2010 }],
		})
		const orderB = calculateFamilyAllowances({
			children: [{ birthYear: 2010 }, { birthYear: 2019 }],
		})
		expect(orderA.children.allowed).toBe(90_000)
		expect(orderB.children.allowed).toBe(90_000)

		// Direct count input
		const countInput = calculateFamilyAllowances({
			children: { totalCount: 2, secondPlusBorn2018OrLaterCount: 1 },
		})
		expect(countInput.children.allowed).toBe(90_000)
	})

	it("calculates parental care allowance up to 4 parents (120,000 THB)", () => {
		expect(calculateFamilyAllowances({ parents: undefined }).parents.allowed).toBe(0)
		const twoParents = calculateFamilyAllowances({ parents: 2 })
		expect(twoParents.parents.allowed).toBe(60_000)

		const fiveParents = calculateFamilyAllowances({ parents: 5 })
		expect(fiveParents.parents.allowed).toBe(120_000)
		expect(fiveParents.parents.wasClamped).toBe(true)

		// Detailed parent flags
		const taxpayerParents = calculateFamilyAllowances(
			{
				parents: { taxpayerFather: true, taxpayerMother: true, spouseFather: true },
			},
			"single",
		)
		// In single status, spouseFather is ignored
		expect(taxpayerParents.parents.allowed).toBe(60_000)

		const allFourParents = calculateFamilyAllowances(
			{
				parents: {
					taxpayerFather: true,
					taxpayerMother: true,
					spouseFather: true,
					spouseMother: true,
				},
			},
			"married_no_income_spouse",
		)
		expect(allFourParents.parents.allowed).toBe(120_000)
	})

	it("calculates disabled care allowance (60,000 THB each)", () => {
		const res = calculateFamilyAllowances({ disabledCareCount: 2 })
		expect(res.disabled.allowed).toBe(120_000)
	})
})

import { describe, expect, it } from "bun:test"
import { calculateRetirementAllowances } from "../stages/allowances-retirement"

describe("Thailand Retirement Cluster and ThaiESG Allowances", () => {
	const income = 1_000_000
	const wage = 1_000_000

	it("enforces individual percentage and statutory ceilings", () => {
		const res = calculateRetirementAllowances(
			{
				rmf: 350_000, // 30% of 1M is 300k, capped at 500k -> allowed 300k
				ssf: 250_000, // 30% of 1M is 300k, capped at 200k -> allowed 200k
				pvd: 200_000, // 15% of 1M is 150k, capped at 500k -> allowed 150k
				gpf: 350_000, // 30% of 1M is 300k, capped at 500k -> allowed 300k
				nsf: 40_000, // capped at 30k -> allowed 30k
				pensionLifeInsurance: 200_000, // 15% of 1M is 150k, capped at 200k -> allowed 150k
			},
			income,
			wage,
		)

		expect(res.retirementCluster.rmf.allowed).toBe(300_000)
		expect(res.retirementCluster.rmf.wasClamped).toBe(true)

		expect(res.retirementCluster.ssf.allowed).toBe(200_000)
		expect(res.retirementCluster.ssf.wasClamped).toBe(true)

		expect(res.retirementCluster.pvd.allowed).toBe(150_000)
		expect(res.retirementCluster.pvd.wasClamped).toBe(true)

		expect(res.retirementCluster.gpf.allowed).toBe(300_000)
		expect(res.retirementCluster.gpf.wasClamped).toBe(true)

		expect(res.retirementCluster.nsf.allowed).toBe(30_000)
		expect(res.retirementCluster.nsf.wasClamped).toBe(true)

		expect(res.retirementCluster.pensionLifeInsurance.allowed).toBe(150_000)
		expect(res.retirementCluster.pensionLifeInsurance.wasClamped).toBe(true)
	})

	it("clamps combined Retirement Cluster to 500,000 THB ceiling", () => {
		const res = calculateRetirementAllowances(
			{
				rmf: 300_000,
				ssf: 200_000,
				pvd: 100_000,
			},
			2_000_000,
			2_000_000,
		)
		// Sum is 600,000 -> clamped to 500,000
		expect(res.retirementCluster.combined.requested).toBe(600_000)
		expect(res.retirementCluster.combined.allowed).toBe(500_000)
		expect(res.retirementCluster.combined.wasClamped).toBe(true)
		expect(res.allowedClusterTotal).toBe(500_000)
	})

	it("evaluates ThaiESG as separate statutory allowance (30% up to 300,000 THB)", () => {
		const under = calculateRetirementAllowances({ thaiEsg: 200_000 }, 1_000_000, 1_000_000)
		expect(under.thaiEsg.allowed).toBe(200_000)
		expect(under.thaiEsg.wasClamped).toBe(false)

		const over = calculateRetirementAllowances({ thaiEsg: 400_000 }, 2_000_000, 2_000_000)
		expect(over.thaiEsg.allowed).toBe(300_000)
		expect(over.thaiEsg.wasClamped).toBe(true)
	})

	it("uses assessableIncome when wageBase is zero", () => {
		const res = calculateRetirementAllowances({ pvd: 50_000 }, 1_000_000, 0)
		expect(res.retirementCluster.pvd.allowed).toBe(50_000)
	})
})

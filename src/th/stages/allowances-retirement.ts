import { type ClampedAmount, clampCap } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	ThAllowanceField,
	type ThAllowancesInput,
	type ThRetirementClusterBreakdown,
} from "../types"

export interface ThRetirementAllowancesResult {
	readonly retirementCluster: ThRetirementClusterBreakdown
	readonly thaiEsg: ClampedAmount
	readonly allowedClusterTotal: number
	readonly allowedThaiEsgTotal: number
}

/**
 * Calculates Retirement Cluster and ThaiESG allowances.
 *
 * @statute Thailand Revenue Code Section 47; Ministerial Regulations No. 126, 390.
 */
export function calculateRetirementAllowances(
	input: ThAllowancesInput = {},
	assessableIncome: number,
	wageBase: number,
): ThRetirementAllowancesResult {
	const p = TH_2026_PARAMETERS.allowances.retirementCluster
	const wage = wageBase > 0 ? wageBase : assessableIncome

	const rmf = clampCap(
		input.rmf ?? 0,
		{ base: assessableIncome, rate: p.rmf.maxRate, ceiling: p.rmf.ceiling },
		ThAllowanceField.Rmf,
	)
	const ssf = clampCap(
		input.ssf ?? 0,
		{ base: assessableIncome, rate: p.ssf.maxRate, ceiling: p.ssf.ceiling },
		ThAllowanceField.Ssf,
	)
	const pvd = clampCap(
		input.pvd ?? 0,
		{ base: wage, rate: p.pvd.maxRate, ceiling: p.pvd.ceiling },
		ThAllowanceField.Pvd,
	)
	const gpf = clampCap(
		input.gpf ?? 0,
		{ base: wage, rate: p.gpf.maxRate, ceiling: p.gpf.ceiling },
		ThAllowanceField.Gpf,
	)
	const nsf = clampCap(input.nsf ?? 0, p.nsf.ceiling, ThAllowanceField.Nsf)
	const pensionLifeInsurance = clampCap(
		input.pensionLifeInsurance ?? 0,
		{
			base: assessableIncome,
			rate: p.pensionLifeInsurance.maxRate,
			ceiling: p.pensionLifeInsurance.ceiling,
		},
		ThAllowanceField.PensionLife,
	)

	const individualSum =
		rmf.allowed +
		ssf.allowed +
		pvd.allowed +
		gpf.allowed +
		nsf.allowed +
		pensionLifeInsurance.allowed
	const combined = clampCap(individualSum, p.combinedCeiling, ThAllowanceField.RetirementCluster)

	const retirementCluster: ThRetirementClusterBreakdown = {
		rmf,
		ssf,
		pvd,
		gpf,
		nsf,
		pensionLifeInsurance,
		combined,
	}

	const thaiEsgParam = TH_2026_PARAMETERS.allowances.thaiEsg
	const thaiEsg = clampCap(
		input.thaiEsg ?? 0,
		{
			base: assessableIncome,
			rate: thaiEsgParam.maxRate,
			ceiling: thaiEsgParam.ceiling,
		},
		ThAllowanceField.ThaiEsg,
	)

	return {
		retirementCluster,
		thaiEsg,
		allowedClusterTotal: combined.allowed,
		allowedThaiEsgTotal: thaiEsg.allowed,
	}
}

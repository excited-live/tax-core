import type { ThAllowancesBreakdown, ThAllowancesInput, ThFilingStatus } from "../types"
import { calculateDonationAllowances } from "./allowances-donations"
import { calculateFamilyAllowances } from "./allowances-family"
import { calculateInsuranceAllowances } from "./allowances-insurance"
import { calculateRetirementAllowances } from "./allowances-retirement"

export interface ThAllowancesResult {
	readonly breakdown: ThAllowancesBreakdown
	readonly netTaxableIncome: number
}

/**
 * Aggregates all personal, family, insurance, retirement, and donation allowances.
 *
 * @statute Thailand Revenue Code Section 47.
 */
export function calculateAllowances(
	input: ThAllowancesInput = {},
	filingStatus: ThFilingStatus = "single",
	assessableTotal: number,
	expensesTotal: number,
	wageBase: number,
): ThAllowancesResult {
	const fam = calculateFamilyAllowances(input, filingStatus)
	const ins = calculateInsuranceAllowances(input, filingStatus)
	const ret = calculateRetirementAllowances(input, assessableTotal, wageBase)

	const nonDonationTotal =
		fam.personal.allowed +
		fam.spouse.allowed +
		fam.children.allowed +
		fam.parents.allowed +
		fam.disabled.allowed +
		ins.socialSecurity.allowed +
		ins.lifeInsurance.allowed +
		ins.parentHealthInsurance.allowed +
		ins.spouseLifeInsurance.allowed +
		ins.mortgageInterest.allowed +
		ret.allowedClusterTotal +
		ret.allowedThaiEsgTotal

	const netBeforeDonations = Math.max(0, assessableTotal - expensesTotal - nonDonationTotal)
	const don = calculateDonationAllowances(input.donation2x, input.donation1x, netBeforeDonations)

	const total = nonDonationTotal + don.allowedDonationsTotal

	const breakdown: ThAllowancesBreakdown = {
		personal: fam.personal,
		spouse: fam.spouse,
		children: fam.children,
		parents: fam.parents,
		disabled: fam.disabled,
		socialSecurity: ins.socialSecurity,
		lifeInsurance: ins.lifeInsurance,
		parentHealthInsurance: ins.parentHealthInsurance,
		spouseLifeInsurance: ins.spouseLifeInsurance,
		mortgageInterest: ins.mortgageInterest,
		retirementCluster: ret.retirementCluster,
		thaiEsg: ret.thaiEsg,
		donations: don.breakdown,
		total,
	}

	return {
		breakdown,
		netTaxableIncome: don.netTaxableIncome,
	}
}

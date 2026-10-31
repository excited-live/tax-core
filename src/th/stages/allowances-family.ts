import { type ClampedAmount, clampCap } from "../../core/caps"
import { validateMonetaryAmount } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	ThAllowanceField,
	type ThAllowancesInput,
	type ThChild,
	type ThChildrenInput,
	type ThFilingStatus,
	type ThParentsInput,
} from "../types"

export interface ThFamilyAllowancesResult {
	readonly personal: ClampedAmount
	readonly spouse: ClampedAmount
	readonly children: ClampedAmount
	readonly parents: ClampedAmount
	readonly disabled: ClampedAmount
}

const unclamped = (n: number): ClampedAmount => ({
	requested: n,
	allowed: n,
	cap: n,
	wasClamped: false,
})

function countBonusChildren(children: readonly ThChild[], cutoffYear: number): number {
	let bonus = 0
	for (let i = 1; i < children.length; i++) {
		if ((children[i]?.birthYear ?? 0) >= cutoffYear) bonus++
	}
	return bonus
}

function computeChildAllowance(children: ThAllowancesInput["children"]): ClampedAmount {
	if (!children) return unclamped(0)
	const p = TH_2026_PARAMETERS.allowances.child
	if (Array.isArray(children)) {
		const bonus = countBonusChildren(children, p.bonusCutoffYear)
		return unclamped(children.length * p.basePerChild + bonus * p.bonusSecondPlusBorn2018OrLater)
	}
	const counts = children as ThChildrenInput
	const count = counts.totalCount ?? 0
	const bonus = counts.secondPlusBorn2018OrLaterCount ?? 0
	return unclamped(count * p.basePerChild + bonus * p.bonusSecondPlusBorn2018OrLater)
}

function computeParentCount(
	parents: ThParentsInput | number | undefined,
	status: ThFilingStatus,
): number {
	if (parents === undefined) return 0
	if (typeof parents === "number") return parents
	let count = (parents.taxpayerFather ? 1 : 0) + (parents.taxpayerMother ? 1 : 0)
	if (status === "married_no_income_spouse") {
		count += (parents.spouseFather ? 1 : 0) + (parents.spouseMother ? 1 : 0)
	}
	return count
}

/**
 * Calculates family allowances (personal, spouse, children, parents, disabled).
 *
 * @statute Thailand Revenue Code Section 47(1)(a)–(f).
 */
export function calculateFamilyAllowances(
	input: ThAllowancesInput = {},
	filingStatus: ThFilingStatus = "single",
): ThFamilyAllowancesResult {
	const p = TH_2026_PARAMETERS.allowances
	const personal = unclamped(p.personal)

	const isSpouseEligible =
		filingStatus === "married_no_income_spouse" || filingStatus === "married_joint"
	const spouseRequested = input.spouse ?? (isSpouseEligible ? p.spouse : 0)
	const spouse = isSpouseEligible
		? clampCap(spouseRequested, p.spouse, ThAllowanceField.Spouse)
		: {
				requested: spouseRequested,
				allowed: 0,
				cap: 0,
				wasClamped: spouseRequested > 0,
			}

	const children = computeChildAllowance(input.children)
	const parentCount = computeParentCount(input.parents, filingStatus)
	const parentsRequested = parentCount * p.parent.perPerson
	const parents = clampCap(
		parentsRequested,
		p.parent.perPerson * p.parent.maxCount,
		ThAllowanceField.Parents,
	)

	const disabledRequested = (input.disabledCareCount ?? 0) * p.disabledPerPerson
	validateMonetaryAmount(disabledRequested, ThAllowanceField.Disabled)
	const disabled = unclamped(disabledRequested)

	return { personal, spouse, children, parents, disabled }
}

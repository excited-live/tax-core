import { type ClampedAmount, clampCap } from "../../core/caps"
import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsAdjustmentsBreakdown, UsAdjustmentsInput, UsFilingStatus } from "../types"

export interface UsAdjustmentsResult {
	readonly totalAdjCents: number
	readonly breakdown: UsAdjustmentsBreakdown
}

function resolveAdjustmentClamped(
	amount: number | undefined,
	capDollars: number,
	field: string,
): { cents: number; clamped: ClampedAmount } {
	const reqCents = toMinorUnits(amount ?? 0, "USD", field)
	const capCents = toMinorUnits(capDollars, "USD", `${field}Cap`)
	const clampedCents = clampCap(reqCents, capCents, field)
	return {
		cents: clampedCents.allowed,
		clamped: {
			requested: fromMinorUnits(clampedCents.requested, "USD"),
			allowed: fromMinorUnits(clampedCents.allowed, "USD"),
			cap: fromMinorUnits(clampedCents.cap, "USD"),
			wasClamped: clampedCents.wasClamped,
		},
	}
}

function resolveCaps(
	adj: UsAdjustmentsInput | undefined,
	status: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
) {
	const p = params.aboveTheLineCaps
	const educator =
		status === "married_filing_jointly" && adj?.bothSpousesEducators
			? p.educatorMfjBoth
			: p.educatorSingle
	const hsaBase = adj?.hsaCoverageType === "family" ? p.hsaFamilyBase : p.hsaSelfOnlyBase
	const hsa = hsaBase + (adj?.age55OrOlder ? p.hsaCatchUpAge55 : 0)
	const ira = p.traditionalIraBase + (adj?.age50OrOlder ? p.traditionalIraCatchUpAge50 : 0)
	const k401 = p.traditional401kBase + (adj?.age50OrOlder ? p.traditional401kCatchUpAge50 : 0)
	return { educator, hsa, ira, k401, student: p.studentLoanInterest }
}

/**
 * Evaluates Schedule 1 Above-the-Line Adjustments clamped to statutory caps.
 *
 * @statute IRC § 62, § 219, § 221, § 223, § 402(g)
 */
export function calculateUsAdjustments(
	adjustments: UsAdjustmentsInput | undefined,
	filingStatus: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsAdjustmentsResult {
	const caps = resolveCaps(adjustments, filingStatus, params)
	const edu = resolveAdjustmentClamped(
		adjustments?.educatorExpenses,
		caps.educator,
		"educatorExpenses",
	)
	const hsa = resolveAdjustmentClamped(adjustments?.hsaContributions, caps.hsa, "hsaContributions")
	const ira = resolveAdjustmentClamped(
		adjustments?.traditionalIraContributions,
		caps.ira,
		"traditionalIra",
	)
	const sl = resolveAdjustmentClamped(
		adjustments?.studentLoanInterest,
		caps.student,
		"studentLoanInterest",
	)
	const k401 = resolveAdjustmentClamped(
		adjustments?.preTaxDeferrals401k,
		caps.k401,
		"preTaxDeferrals401k",
	)
	const seCents = toMinorUnits(
		adjustments?.deductibleSelfEmploymentTax ?? 0,
		"USD",
		"deductibleSeTax",
	)

	const totalAdjCents = edu.cents + hsa.cents + ira.cents + sl.cents + k401.cents + seCents
	return {
		totalAdjCents,
		breakdown: {
			educatorExpenses: edu.clamped,
			hsa: hsa.clamped,
			traditionalIra: ira.clamped,
			studentLoanInterest: sl.clamped,
			preTaxDeferrals401k: k401.clamped,
			deductibleSelfEmploymentTax: usd(fromMinorUnits(seCents, "USD")),
			totalAdjustments: usd(fromMinorUnits(totalAdjCents, "USD")),
		},
	}
}

import type { UsFilingStatus } from "../types"

export interface UsAdditionalStandardDeduction {
	readonly unmarried: number
	readonly married: number
}

export interface UsAboveTheLineCaps {
	readonly educatorSingle: number
	readonly educatorMfjBoth: number
	readonly studentLoanInterest: number
	readonly traditional401kBase: number
	readonly traditional401kCatchUpAge50: number
	readonly traditionalIraBase: number
	readonly traditionalIraCatchUpAge50: number
	readonly hsaSelfOnlyBase: number
	readonly hsaFamilyBase: number
	readonly hsaCatchUpAge55: number
}

export interface UsItemizedParameters {
	readonly medicalFloorRate: number
	readonly saltCap: number
	readonly saltCapMfs: number
	readonly charityCeilingRate: number
}

export interface UsNiitParameters {
	readonly rate: number
	readonly thresholds: Record<UsFilingStatus, number>
}

/**
 * Statutory 2026 US Federal base standard deduction amounts in major dollars.
 *
 * @statute IRC § 63(c)(2), Rev. Proc. 2025-XX
 */
export const US_2026_STANDARD_DEDUCTION: Record<UsFilingStatus, number> = {
	single: 16_100,
	married_filing_jointly: 32_200,
	married_filing_separately: 16_100,
	head_of_household: 24_150,
}

/**
 * Statutory 2026 additional standard deduction for age 65+ and blindness per condition.
 *
 * @statute IRC § 63(f), Rev. Proc. 2025-XX
 */
export const US_2026_ADDITIONAL_STANDARD_DEDUCTION: UsAdditionalStandardDeduction = {
	unmarried: 2_050,
	married: 1_650,
}

/**
 * Statutory 2026 Schedule 1 Above-the-Line deduction limits in major dollars.
 *
 * @statute IRC § 62, § 219, § 221, § 223, § 402(g)
 */
export const US_2026_ABOVE_THE_LINE_CAPS: UsAboveTheLineCaps = {
	educatorSingle: 350,
	educatorMfjBoth: 700,
	studentLoanInterest: 2_500,
	traditional401kBase: 24_500,
	traditional401kCatchUpAge50: 8_000,
	traditionalIraBase: 7_500,
	traditionalIraCatchUpAge50: 1_100,
	hsaSelfOnlyBase: 4_400,
	hsaFamilyBase: 8_750,
	hsaCatchUpAge55: 1_000,
}

/**
 * Statutory 2026 Schedule A Itemized Deduction thresholds and caps.
 *
 * @statute IRC §§ 164, 170, 213
 */
export const US_2026_ITEMIZED: UsItemizedParameters = {
	medicalFloorRate: 0.075,
	saltCap: 10_000,
	saltCapMfs: 5_000,
	charityCeilingRate: 0.6,
}

/**
 * Statutory Net Investment Income Tax (NIIT) rates and MAGI thresholds.
 *
 * @statute IRC § 1411
 */
export const US_2026_NIIT: UsNiitParameters = {
	rate: 0.038,
	thresholds: {
		single: 200_000,
		head_of_household: 200_000,
		married_filing_jointly: 250_000,
		married_filing_separately: 125_000,
	},
}

import type { TaxBracket } from "../../core/brackets"
import type { UsFilingStatus } from "../types"

/**
 * Statutory 2026 US Federal ordinary income progressive brackets in minor units (cents).
 *
 * @statute IRC § 1(j), Rev. Proc. 2025-XX
 */
export const US_2026_ORDINARY_BRACKETS: Record<UsFilingStatus, readonly TaxBracket[]> = {
	single: [
		{ upTo: 1_240_000, rate: 0.1 },
		{ upTo: 5_040_000, rate: 0.12 },
		{ upTo: 10_570_000, rate: 0.22 },
		{ upTo: 20_177_500, rate: 0.24 },
		{ upTo: 25_622_500, rate: 0.32 },
		{ upTo: 64_060_000, rate: 0.35 },
		{ upTo: null, rate: 0.37 },
	],
	married_filing_jointly: [
		{ upTo: 2_480_000, rate: 0.1 },
		{ upTo: 10_080_000, rate: 0.12 },
		{ upTo: 21_140_000, rate: 0.22 },
		{ upTo: 40_355_000, rate: 0.24 },
		{ upTo: 51_245_000, rate: 0.32 },
		{ upTo: 76_870_000, rate: 0.35 },
		{ upTo: null, rate: 0.37 },
	],
	married_filing_separately: [
		{ upTo: 1_240_000, rate: 0.1 },
		{ upTo: 5_040_000, rate: 0.12 },
		{ upTo: 10_570_000, rate: 0.22 },
		{ upTo: 20_177_500, rate: 0.24 },
		{ upTo: 25_622_500, rate: 0.32 },
		{ upTo: 38_435_000, rate: 0.35 },
		{ upTo: null, rate: 0.37 },
	],
	head_of_household: [
		{ upTo: 1_770_000, rate: 0.1 },
		{ upTo: 6_745_000, rate: 0.12 },
		{ upTo: 10_570_000, rate: 0.22 },
		{ upTo: 20_175_000, rate: 0.24 },
		{ upTo: 25_620_000, rate: 0.32 },
		{ upTo: 64_060_000, rate: 0.35 },
		{ upTo: null, rate: 0.37 },
	],
}

/**
 * Statutory 2026 US Federal preferential capital gains brackets in minor units (cents).
 *
 * @statute IRC § 1(h), Rev. Proc. 2025-XX
 */
export const US_2026_PREFERENTIAL_BRACKETS: Record<UsFilingStatus, readonly TaxBracket[]> = {
	single: [
		{ upTo: 4_945_000, rate: 0.0 },
		{ upTo: 54_550_000, rate: 0.15 },
		{ upTo: null, rate: 0.2 },
	],
	married_filing_jointly: [
		{ upTo: 9_890_000, rate: 0.0 },
		{ upTo: 61_370_000, rate: 0.15 },
		{ upTo: null, rate: 0.2 },
	],
	married_filing_separately: [
		{ upTo: 4_945_000, rate: 0.0 },
		{ upTo: 30_685_000, rate: 0.15 },
		{ upTo: null, rate: 0.2 },
	],
	head_of_household: [
		{ upTo: 6_620_000, rate: 0.0 },
		{ upTo: 57_960_000, rate: 0.15 },
		{ upTo: null, rate: 0.2 },
	],
}

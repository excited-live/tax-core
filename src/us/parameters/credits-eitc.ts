export interface UsEitcTier {
	readonly creditRate: number
	readonly maxEarnedIncome: number
	readonly maxCredit: number
	readonly phaseoutThresholdSingle: number
	readonly phaseoutThresholdMfj: number
	readonly phaseoutRate: number
}

export const US_2026_EITC_TIERS: Record<0 | 1 | 2 | 3, UsEitcTier> = {
	0: {
		creditRate: 0.0765,
		maxEarnedIncome: 8_490,
		maxCredit: 649,
		phaseoutThresholdSingle: 10_620,
		phaseoutThresholdMfj: 17_990,
		phaseoutRate: 0.0765,
	},
	1: {
		creditRate: 0.34,
		maxEarnedIncome: 12_730,
		maxCredit: 4_328,
		phaseoutThresholdSingle: 23_340,
		phaseoutThresholdMfj: 30_710,
		phaseoutRate: 0.1598,
	},
	2: {
		creditRate: 0.4,
		maxEarnedIncome: 17_880,
		maxCredit: 7_152,
		phaseoutThresholdSingle: 23_340,
		phaseoutThresholdMfj: 30_710,
		phaseoutRate: 0.2106,
	},
	3: {
		creditRate: 0.45,
		maxEarnedIncome: 17_880,
		maxCredit: 8_046,
		phaseoutThresholdSingle: 23_340,
		phaseoutThresholdMfj: 30_710,
		phaseoutRate: 0.2106,
	},
}

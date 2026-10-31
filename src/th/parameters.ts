import type { ThParameters } from "./parameters-types"

/**
 * Thailand Statutory Tax Parameters for Tax Year 2026 (Revenue Code ภ.ง.ด.90/91).
 *
 * @statute Thailand Revenue Code Sections 40, 42 bis, 47, 48(1)–(2); Royal Decrees No. 11, 650.
 */
export const TH_2026_PARAMETERS: ThParameters = {
	taxYear: 2026,
	currency: "THB",
	expenses: {
		section40_1_2: { rate: 0.5, ceiling: 100_000 },
		section40_3: { rate: 0.5, ceiling: 100_000 },
		section40_4: { rate: 0.0 },
		section40_5: {
			building: 0.3,
			agriculturalLand: 0.2,
			nonAgriculturalLand: 0.15,
			vehicles: 0.3,
			other: 0.1,
		},
		section40_6: {
			medical: 0.6,
			other: 0.3,
		},
		section40_7: { rate: 0.6 },
		section40_8: {
			generalRate: 0.6,
			entertainerFirstTierRate: 0.6,
			entertainerFirstTierThreshold: 300_000,
			entertainerSecondTierRate: 0.4,
			entertainerCeiling: 600_000,
		},
	},
	allowances: {
		personal: 60_000,
		spouse: 60_000,
		child: {
			basePerChild: 30_000,
			bonusSecondPlusBorn2018OrLater: 30_000,
			bonusCutoffYear: 2018,
		},
		parent: {
			perPerson: 30_000,
			maxCount: 4,
		},
		disabledPerPerson: 60_000,
		socialSecurityFundCeiling: 10_500,
		lifeInsurance: {
			combinedCeiling: 100_000,
			healthCeiling: 25_000,
		},
		parentHealthInsuranceCeiling: 15_000,
		spouseLifeInsuranceCeiling: 10_000,
		mortgageInterestCeiling: 100_000,
		retirementCluster: {
			combinedCeiling: 500_000,
			rmf: { maxRate: 0.3, ceiling: 500_000 },
			ssf: { maxRate: 0.3, ceiling: 200_000 },
			pvd: { maxRate: 0.15, ceiling: 500_000 },
			gpf: { maxRate: 0.3, ceiling: 500_000 },
			nsf: { ceiling: 30_000 },
			pensionLifeInsurance: { maxRate: 0.15, ceiling: 200_000 },
		},
		thaiEsg: { maxRate: 0.3, ceiling: 300_000 },
		donations: {
			donation2xMultiplier: 2,
			donation2xMaxRate: 0.1,
			donation1xMaxRate: 0.1,
		},
	},
	brackets: [
		{ upTo: 150_000, rate: 0.0 },
		{ upTo: 300_000, rate: 0.05 },
		{ upTo: 500_000, rate: 0.1 },
		{ upTo: 750_000, rate: 0.15 },
		{ upTo: 1_000_000, rate: 0.2 },
		{ upTo: 2_000_000, rate: 0.25 },
		{ upTo: 5_000_000, rate: 0.3 },
		{ upTo: null, rate: 0.35 },
	],
	minimumGrossTax: {
		rate: 0.005,
		incomeThreshold: 60_000,
		taxThreshold: 5_000,
	},
}

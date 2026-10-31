import type { TaxBracket } from "../core/brackets"

export interface ThParameters {
	readonly taxYear: 2026
	readonly currency: "THB"
	readonly expenses: {
		readonly section40_1_2: { readonly rate: number; readonly ceiling: number }
		readonly section40_3: { readonly rate: number; readonly ceiling: number }
		readonly section40_4: { readonly rate: number }
		readonly section40_5: {
			readonly building: number
			readonly agriculturalLand: number
			readonly nonAgriculturalLand: number
			readonly vehicles: number
			readonly other: number
		}
		readonly section40_6: {
			readonly medical: number
			readonly other: number
		}
		readonly section40_7: { readonly rate: number }
		readonly section40_8: {
			readonly generalRate: number
			readonly entertainerFirstTierRate: number
			readonly entertainerFirstTierThreshold: number
			readonly entertainerSecondTierRate: number
			readonly entertainerCeiling: number
		}
	}
	readonly allowances: {
		readonly personal: number
		readonly spouse: number
		readonly child: {
			readonly basePerChild: number
			readonly bonusSecondPlusBorn2018OrLater: number
			readonly bonusCutoffYear: number
		}
		readonly parent: {
			readonly perPerson: number
			readonly maxCount: number
		}
		readonly disabledPerPerson: number
		readonly socialSecurityFundCeiling: number
		readonly lifeInsurance: {
			readonly combinedCeiling: number
			readonly healthCeiling: number
		}
		readonly parentHealthInsuranceCeiling: number
		readonly spouseLifeInsuranceCeiling: number
		readonly mortgageInterestCeiling: number
		readonly retirementCluster: {
			readonly combinedCeiling: number
			readonly rmf: { readonly maxRate: number; readonly ceiling: number }
			readonly ssf: { readonly maxRate: number; readonly ceiling: number }
			readonly pvd: { readonly maxRate: number; readonly ceiling: number }
			readonly gpf: { readonly maxRate: number; readonly ceiling: number }
			readonly nsf: { readonly ceiling: number }
			readonly pensionLifeInsurance: {
				readonly maxRate: number
				readonly ceiling: number
			}
		}
		readonly thaiEsg: { readonly maxRate: number; readonly ceiling: number }
		readonly donations: {
			readonly donation2xMultiplier: number
			readonly donation2xMaxRate: number
			readonly donation1xMaxRate: number
		}
	}
	readonly brackets: readonly TaxBracket[]
	readonly minimumGrossTax: {
		readonly rate: number
		readonly incomeThreshold: number
		readonly taxThreshold: number
	}
	readonly finalWithholding: {
		readonly interestRate: number
		readonly dividendRate: number
		readonly digitalAssetRate: number
	}
	readonly separateSheet: {
		readonly minYearsOfService: number
		readonly exemptionWageDays: number
		readonly exemptionCeiling: number
		readonly expensePerYearOfService: number
		readonly remainderExpenseRate: number
		readonly brackets: readonly TaxBracket[]
	}
	readonly realEstate: {
		/** Expense rate by holding years; the last row with `minYears <= holdingYears` applies. */
		readonly expenseTable: readonly { readonly minYears: number; readonly rate: number }[]
		readonly taxCapRate: number
	}
}

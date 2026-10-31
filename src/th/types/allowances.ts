/**
 * Child dependent representation for Thailand PIT.
 */
export interface ThChild {
	readonly birthYear?: number | undefined
}

/**
 * Direct counts for children allowances.
 */
export interface ThChildrenInput {
	readonly totalCount?: number | undefined
	readonly secondPlusBorn2018OrLaterCount?: number | undefined
}

/**
 * Detailed parental care flags (age 60+, income <= 30k THB).
 */
export interface ThParentsInput {
	readonly taxpayerFather?: boolean | undefined
	readonly taxpayerMother?: boolean | undefined
	readonly spouseFather?: boolean | undefined
	readonly spouseMother?: boolean | undefined
}

/**
 * Thailand personal, family, insurance, retirement, and donation allowances input.
 */
export interface ThAllowancesInput {
	readonly personal?: number | undefined
	readonly spouse?: number | undefined
	readonly children?: readonly ThChild[] | ThChildrenInput | undefined
	readonly parents?: ThParentsInput | number | undefined
	readonly disabledCareCount?: number | undefined
	readonly socialSecurity?: number | undefined
	readonly lifeInsurance?: number | undefined
	readonly healthInsurance?: number | undefined
	readonly parentHealthInsurance?: number | undefined
	readonly spouseLifeInsurance?: number | undefined
	readonly mortgageInterest?: number | undefined
	readonly rmf?: number | undefined
	readonly ssf?: number | undefined
	readonly pvd?: number | undefined
	readonly gpf?: number | undefined
	readonly nsf?: number | undefined
	readonly pensionLifeInsurance?: number | undefined
	readonly thaiEsg?: number | undefined
	readonly donation2x?: number | undefined
	readonly donation1x?: number | undefined
}

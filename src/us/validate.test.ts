import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../core/money"
import type { UsEducationCreditStudent, UsFilingStatus } from "./types"
import { validateUsInput } from "./validate"

describe("US Input Validation", () => {
	it("accepts valid inputs with supported tax years and filing statuses", () => {
		expect(() =>
			validateUsInput({
				taxYear: 2026,
				filingStatus: "single",
				income: { w2Wages: 50_000, selfEmploymentNetEarnings: 10_000 },
				withholding: 5_000,
				amtPreferences: 1_000,
				credits: {
					qualifyingChildrenForChildTaxCredit: 2,
					otherDependents: 1,
					eitcQualifyingChildren: 2,
					eitcInvestmentIncome: 1_000,
					qualifyingIndividualsForCare: 1,
					childAndDependentCareExpenses: 2_000,
					foreignTaxCredit: 500,
					customNonRefundableCredits: 200,
					customRefundableCredits: 100,
					educationStudents: [{ type: "aotc", qualifiedExpenses: 3_000 }],
				},
			}),
		).not.toThrow()
	})

	it("accepts legitimate Schedule C self-employment net business loss", () => {
		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: { selfEmploymentNetEarnings: -15_000 },
			}),
		).not.toThrow()
	})

	it("rejects unsupported tax years and invalid filing statuses", () => {
		expect(() =>
			validateUsInput({
				taxYear: 2025,
				filingStatus: "single",
				income: {},
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "invalid_status" as unknown as UsFilingStatus,
				income: {},
			}),
		).toThrow(TaxValidationError)
	})

	it("rejects negative amounts or NaN/Infinity for income and withholding", () => {
		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: { w2Wages: -100 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: { selfEmploymentNetEarnings: Number.NaN },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				withholding: -50,
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				amtPreferences: -10,
			}),
		).toThrow(TaxValidationError)
	})

	it("rejects invalid credit inputs, non-integer counts, and negative expenses", () => {
		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { qualifyingChildrenForChildTaxCredit: 1.5 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { otherDependents: -1 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { eitcQualifyingChildren: -1 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { eitcInvestmentIncome: -500 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { qualifyingIndividualsForCare: 2.2 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { childAndDependentCareExpenses: -1_000 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { foreignTaxCredit: -200 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { customNonRefundableCredits: -50 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { customRefundableCredits: -50 },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { educationStudents: [{ type: "aotc", qualifiedExpenses: -100 }] },
			}),
		).toThrow(TaxValidationError)

		expect(() =>
			validateUsInput({
				filingStatus: "single",
				income: {},
				credits: { educationStudents: [null as unknown as UsEducationCreditStudent] },
			}),
		).toThrow(TaxValidationError)
	})
})

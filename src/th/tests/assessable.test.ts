import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { calculateAssessableIncome, extractElectableAmount } from "../stages/assessable"

describe("Section 40 Assessable Income calculation", () => {
	it("returns all zeroes for empty income input", () => {
		const res = calculateAssessableIncome({})
		expect(res.section40_1).toBe(0)
		expect(res.section40_2).toBe(0)
		expect(res.section40_3).toBe(0)
		expect(res.section40_4).toBe(0)
		expect(res.section40_5).toBe(0)
		expect(res.section40_6).toBe(0)
		expect(res.section40_7).toBe(0)
		expect(res.section40_8).toBe(0)
		expect(res.total).toBe(0)
		expect(res.grossNonEmploymentIncome).toBe(0)
	})

	it("sums and validates Section 40(1) through Section 40(4)", () => {
		const res = calculateAssessableIncome({
			section40_1: 100_000,
			section40_2: 50_000,
			section40_3: { amount: 30_000, actualExpense: 5_000 },
			section40_4: { amount: 20_000 },
		})
		expect(res.section40_1).toBe(100_000)
		expect(res.section40_2).toBe(50_000)
		expect(res.section40_3).toBe(30_000)
		expect(res.section40_4).toBe(20_000)
		expect(res.total).toBe(200_000)
		expect(res.grossNonEmploymentIncome).toBe(100_000)
	})

	it("supports direct number for section40_4", () => {
		const res = calculateAssessableIncome({
			section40_4: 15_000,
		})
		expect(res.section40_4).toBe(15_000)
	})

	it("sums Section 40(5) rental categories", () => {
		const res = calculateAssessableIncome({
			section40_5: {
				building: 10_000,
				agriculturalLand: 20_000,
				nonAgriculturalLand: 30_000,
				vehicles: 40_000,
				other: 50_000,
			},
		})
		expect(res.section40_5).toBe(150_000)
		expect(res.grossNonEmploymentIncome).toBe(150_000)
	})

	it("sums Section 40(6) liberal professions categories", () => {
		const res = calculateAssessableIncome({
			section40_6: {
				medical: 100_000,
				law: 10_000,
				engineering: 20_000,
				architecture: 30_000,
				accounting: 40_000,
				fineArts: 50_000,
				other: 60_000,
			},
		})
		expect(res.section40_6).toBe(310_000)
	})

	it("sums Section 40(7) and Section 40(8)", () => {
		const resNumber8 = calculateAssessableIncome({
			section40_7: 200_000,
			section40_8: 300_000,
		})
		expect(resNumber8.section40_7).toBe(200_000)
		expect(resNumber8.section40_8).toBe(300_000)

		const resObject8 = calculateAssessableIncome({
			section40_8: {
				general: 120_000,
				entertainer: 80_000,
			},
		})
		expect(resObject8.section40_8).toBe(200_000)

		const resElectable8 = calculateAssessableIncome({
			section40_8: { amount: 50_000 },
		})
		expect(resElectable8.section40_8).toBe(50_000)
	})

	it("validates negative and non-numeric inputs strictly", () => {
		expect(() => calculateAssessableIncome({ section40_1: -500 })).toThrow(TaxValidationError)
		expect(() =>
			calculateAssessableIncome({
				section40_3: { amount: 100, actualExpense: -10 },
			}),
		).toThrow(TaxValidationError)
		expect(() => extractElectableAmount(Number.NaN, "test")).toThrow(TaxValidationError)
		expect(extractElectableAmount(undefined, "test")).toBe(0)
	})
})

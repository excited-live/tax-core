import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../core/money"
import type { UsFilingStatus } from "./types"
import { validateUsInput } from "./validate"

describe("US Input Validation", () => {
	it("accepts valid inputs with supported tax years and filing statuses", () => {
		expect(() =>
			validateUsInput({
				taxYear: 2026,
				filingStatus: "single",
				income: {},
			}),
		).not.toThrow()
	})

	it("rejects unsupported tax years", () => {
		expect(() =>
			validateUsInput({
				taxYear: 2025,
				filingStatus: "single",
				income: {},
			}),
		).toThrow(TaxValidationError)
	})

	it("rejects invalid filing statuses", () => {
		expect(() =>
			validateUsInput({
				filingStatus: "invalid_status" as unknown as UsFilingStatus,
				income: {},
			}),
		).toThrow(TaxValidationError)
	})
})

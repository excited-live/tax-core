import { TaxValidationError, thb, validateMonetaryAmount } from "../../core/money"
import type { TaxResult } from "../../core/system"
import type { ThBreakdown, ThTaxInput } from "../types"
import { calculateAllowances } from "./allowances"
import { calculateAssessableIncome } from "./assessable"
import { evaluateThBrackets } from "./bracket-eval"
import { calculateExpenseDeductions } from "./expenses"
import { calculateMinimumGrossTax } from "./minimum-tax"

function validateYear(year?: number): void {
	if (year !== undefined && year !== 2026) {
		throw new TaxValidationError(
			"taxYear",
			year,
			"Unsupported tax year; only 2026 is currently supported",
		)
	}
}

/**
 * Executes full Thailand PIT calculation pipeline for ภ.ง.ด.90/91.
 *
 * @statute Thailand Revenue Code Sections 40, 42 bis, 47, 48(1)–(2).
 */
export function runThTaxPipeline(input: ThTaxInput = {}): TaxResult<"THB", ThBreakdown> {
	validateYear(input.taxYear)
	const filingStatus = input.filingStatus ?? "single"
	const withholding = input.withholdingTax ?? 0
	validateMonetaryAmount(withholding, "withholdingTax")

	const assessable = calculateAssessableIncome(input.income)
	const expenses = calculateExpenseDeductions(input.income, assessable)
	const netIncomeAfterExpenses = Math.max(0, assessable.total - expenses.total)

	const allowancesRes = calculateAllowances(
		input.allowances,
		filingStatus,
		assessable.total,
		expenses.total,
		assessable.section40_1,
	)

	const evalBrackets = evaluateThBrackets(allowancesRes.netTaxableIncome, assessable.total)
	const progressiveTax = evalBrackets.totalTax

	const minimumGrossTax = calculateMinimumGrossTax(
		assessable.grossNonEmploymentIncome,
		progressiveTax,
	)

	const totalTax = minimumGrossTax.wasApplied ? minimumGrossTax.calculatedTax : progressiveTax
	const netTaxPayable = totalTax - withholding
	const effectiveRate = assessable.total > 0 ? totalTax / assessable.total : 0

	const breakdown: ThBreakdown = {
		assessableIncome: assessable,
		expenseDeductions: expenses,
		netIncomeAfterExpenses,
		allowances: allowancesRes.breakdown,
		netTaxableIncome: allowancesRes.netTaxableIncome,
		progressiveTax,
		progressiveBrackets: evalBrackets.brackets,
		minimumGrossTax,
		withholdingTax: withholding,
		netTaxPayable,
	}

	return {
		jurisdiction: "TH",
		taxYear: 2026,
		currency: "THB",
		grossIncome: thb(assessable.total, "grossIncome"),
		taxableIncome: thb(allowancesRes.netTaxableIncome, "taxableIncome"),
		totalTax: thb(totalTax, "totalTax"),
		effectiveRate,
		marginalRate: evalBrackets.brackets.marginalRate,
		netTaxPayable: thb(netTaxPayable, "netTaxPayable", { allowNegative: true }),
		breakdown,
	}
}

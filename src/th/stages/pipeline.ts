import { TaxValidationError, thb, validateMonetaryAmount } from "../../core/money"
import type { TaxResult } from "../../core/system"
import { TH_2026_PARAMETERS } from "../parameters"
import { ThBracketField, type ThBreakdown, ThTaxField, type ThTaxInput } from "../types"
import { sumThAmounts } from "../units"
import { calculateAllowances } from "./allowances"
import { calculateAssessableIncome } from "./assessable"
import { evaluateThBrackets } from "./bracket-eval"
import { combineThLiability } from "./combine"
import { calculateExpenseDeductions } from "./expenses"
import { calculateMinimumGrossTax } from "./minimum-tax"
import { resolveSpecialRegimes } from "./special-regimes"

function validateYear(year?: number): void {
	if (year !== undefined && year !== TH_2026_PARAMETERS.taxYear) {
		throw new TaxValidationError(
			ThTaxField.TaxYear,
			year,
			"Unsupported tax year; only 2026 is currently supported",
		)
	}
}

/**
 * Executes full Thailand PIT calculation pipeline for ภ.ง.ด.90/91.
 *
 * @statute Thailand Revenue Code Sections 40, 42 bis, 47, 47 bis, 48(1)–(5).
 */
export function runThTaxPipeline(input: ThTaxInput = {}): TaxResult<"THB", ThBreakdown> {
	validateYear(input.taxYear)
	const filingStatus = input.filingStatus ?? "single"
	const withholding = input.withholdingTax ?? 0
	validateMonetaryAmount(withholding, ThTaxField.WithholdingTax)

	const special = resolveSpecialRegimes(input)
	const income = special.regularIncome

	const assessable = calculateAssessableIncome(income)
	const expenses = calculateExpenseDeductions(income, assessable)
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

	const regularTax = minimumGrossTax.wasApplied ? minimumGrossTax.calculatedTax : progressiveTax
	const combined = combineThLiability({
		regularTax,
		separateSheetTax: special.separateSheet.tax,
		realEstateTax: special.realEstate.tax,
		finalWithholdingTax: special.finalWithholding.totalTax,
		dividendTaxCredit: special.dividendTaxCredit.credit,
		withholdingTax: withholding,
	})
	const grossIncome = sumThAmounts(
		[assessable.total, special.grossOutsideRegular],
		ThBracketField.GrossIncome,
	)
	const effectiveRate = grossIncome > 0 ? combined.totalCombinedTax / grossIncome : 0

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
		netTaxPayable: combined.netTaxPayable,
		regularTax,
		separateSheet: special.separateSheet,
		realEstate: special.realEstate,
		finalWithholding: special.finalWithholding,
		dividendTaxCredit: special.dividendTaxCredit,
		totalCombinedTax: combined.totalCombinedTax,
	}

	return {
		jurisdiction: "TH",
		taxYear: TH_2026_PARAMETERS.taxYear,
		currency: TH_2026_PARAMETERS.currency,
		grossIncome: thb(grossIncome, ThBracketField.GrossIncome),
		taxableIncome: thb(allowancesRes.netTaxableIncome, ThBracketField.TaxableIncome),
		totalTax: thb(combined.totalCombinedTax, ThTaxField.TotalTax),
		effectiveRate,
		marginalRate: evalBrackets.brackets.marginalRate,
		netTaxPayable: thb(combined.netTaxPayable, ThTaxField.NetTaxPayable, {
			allowNegative: true,
		}),
		breakdown,
	}
}

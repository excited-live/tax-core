import { evaluateBrackets } from "./evaluate"
import { marginalRateAt } from "./marginal"
import { computeBracketSlice } from "./slice"
import type { BracketEvaluationResult, BracketSlice, TaxBracket } from "./types"

export {
	type BracketEvaluationResult,
	type BracketSlice,
	computeBracketSlice,
	evaluateBrackets,
	marginalRateAt,
	type TaxBracket,
}

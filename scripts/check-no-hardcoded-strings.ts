import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const STAGES_DIR = join(import.meta.dir, "../src/th/stages")

const FORBIDDEN_PATTERNS: Array<{ regex: RegExp; description: string }> = [
	{
		regex: /"(?:expense|income|allowances?)\.[a-zA-Z0-9_.]+"/,
		description: "Hardcoded diagnostic string (use Th*Field enum instead)",
	},
	{
		regex: /(?:toMinorUnits|fromMinorUnits)\([^,\n]+,\s*"THB"/,
		description: "Hardcoded 'THB' in minor units call (use TH_2026_PARAMETERS.currency)",
	},
	{
		regex: /"(?:final|include)"/,
		description: "Hardcoded election literal (use ThFinalWithholdingElection instead)",
	},
	{
		regex: /toMinorUnits\([^,\n]+,\s*[^,\n]+,\s*"(?:taxableIncome|grossIncome)"\)/,
		description: "Hardcoded bracket field string (use ThBracketField enum)",
	},
]

const COMMENT_LINE = /^\s*(?:\/\/|\/?\*)/

let hasErrors = false

for (const file of readdirSync(STAGES_DIR)) {
	if (!file.endsWith(".ts")) continue
	const filePath = join(STAGES_DIR, file)
	const content = readFileSync(filePath, "utf-8")
	const lines = content.split("\n")

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex] ?? ""
		if (COMMENT_LINE.test(line)) continue
		for (const pattern of FORBIDDEN_PATTERNS) {
			if (pattern.regex.test(line)) {
				console.error(
					`ERROR: ${file}:${lineIndex + 1} - ${pattern.description}\n  > ${line.trim()}`,
				)
				hasErrors = true
			}
		}
	}
}

if (hasErrors) {
	console.error("\nFAILURE: Hardcoded strings detected in stage implementations.")
	process.exit(1)
} else {
	console.log("PASS: No hardcoded text or currency strings detected in stages.\n")
}

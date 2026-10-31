import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const STAGES_DIRS = [
	join(import.meta.dir, "../src/th/stages"),
	join(import.meta.dir, "../src/us/stages"),
]

const FORBIDDEN_PATTERNS: Array<{ regex: RegExp; description: string }> = [
	{
		regex: /"(?:expense|income|allowances?)\.[a-zA-Z0-9_.]+"/,
		description: "Hardcoded diagnostic string (use Th*Field enum instead)",
	},
	{
		regex:
			/"(?:payroll|fica|amt|credits?|deductions?|adjustments?|itemized|income)\.[a-zA-Z0-9_.]+"/,
		description: "Hardcoded US diagnostic string (use Us*Field enum instead)",
	},
	{
		regex: /(?:toMinorUnits|fromMinorUnits)\([^,\n]+,\s*"THB"/,
		description: "Hardcoded 'THB' in minor units call (use TH_2026_PARAMETERS.currency)",
	},
	{
		regex: /toMinorUnits\([^,\n]+,\s*[^,\n]+,\s*"(?:taxableIncome|grossIncome)"\)/,
		description: "Hardcoded bracket field string (use ThBracketField enum)",
	},
]

let hasErrors = false

for (const dir of STAGES_DIRS) {
	for (const file of readdirSync(dir)) {
		if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue
		const filePath = join(dir, file)
		const content = readFileSync(filePath, "utf-8")
		const lines = content.split("\n")

		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex] ?? ""
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
}

if (hasErrors) {
	console.error("\nFAILURE: Hardcoded strings detected in stage implementations.")
	process.exit(1)
} else {
	console.log("PASS: No hardcoded text or currency strings detected in stages.\n")
}

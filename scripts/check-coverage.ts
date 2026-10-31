import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const MIN_COVERAGE_PERCENT = 100
const lcovPath = resolve(process.cwd(), "coverage/lcov.info")

try {
	const content = readFileSync(lcovPath, "utf-8")
	let linesFound = 0
	let linesHit = 0

	for (const line of content.split("\n")) {
		if (line.startsWith("LF:")) {
			linesFound += Number.parseInt(line.slice(3), 10) || 0
		} else if (line.startsWith("LH:")) {
			linesHit += Number.parseInt(line.slice(3), 10) || 0
		}
	}

	if (linesFound === 0) {
		console.error("No coverage records found in coverage/lcov.info")
		process.exit(1)
	}

	const percentage = (linesHit / linesFound) * 100
	console.log(`\nLine coverage: ${percentage.toFixed(2)}% (${linesHit}/${linesFound} lines)`)

	if (percentage < MIN_COVERAGE_PERCENT) {
		console.error(
			`FAIL: Code coverage ${percentage.toFixed(2)}% is below threshold of ${MIN_COVERAGE_PERCENT}%\n`,
		)
		process.exit(1)
	}

	console.log(`PASS: Code coverage meets required ${MIN_COVERAGE_PERCENT}% threshold\n`)
} catch (error) {
	console.error("Failed to read or parse coverage/lcov.info:", error)
	process.exit(1)
}

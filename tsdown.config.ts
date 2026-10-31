import { defineConfig } from "tsdown"

export default defineConfig({
	entry: ["src/index.ts", "src/th/index.ts", "src/us/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: true,
})

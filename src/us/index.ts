/**
 * @trajectonomics/tax/us — United States Federal Individual Income Tax System
 *
 * Implements 2026 statutory federal tax calculation including AGI computation,
 * Above-the-Line Schedule 1 Adjustments, Standard vs Itemized Schedule A Election,
 * 7 statutory ordinary progressive brackets, preferential stacking for LTCG and qualified
 * dividends, and Net Investment Income Tax (NIIT).
 *
 * @statute IRC § 1 et seq.
 */

export * from "./parameters"
export { calculateUsTax, us } from "./system"
export * from "./types"

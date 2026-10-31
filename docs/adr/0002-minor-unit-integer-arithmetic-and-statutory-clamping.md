# ISO 4217 Minor-Unit Integer Arithmetic with Ergonomic Numeric Boundaries

IEEE 754 floating-point math causes rounding drift in multi-step percentage slices and tax brackets, while different currencies have different minor-unit scales (`THB` and `USD` have 2 decimals, `JPY` has 0, `KWD` has 3). However, forcing external callers to construct `bigint` values or string decimals for every input field degrades ergonomics.

We accept standard JavaScript `number` (as well as optional branded `Money<C>` types) in major currency units at the public boundary, validate immediately (`TaxValidationError` on `NaN`, `Infinity`, or negative amounts), and convert all values at entry into exact integer Minor Units scaled according to an ISO 4217 currency registry for all internal bracket, cap, and percentage arithmetic. Furthermore, inputs that exceed a Statutory Cap are clamped to the cap (recording both `requested` and `allowed` in the Breakdown) rather than rejected with a validation error.

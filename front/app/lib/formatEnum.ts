/**
 * Converts an UPPER_SNAKE_CASE enum value into a human-readable label.
 * e.g. "FULL_SIZE" → "Full Size", "SINGLE_MOTOR" → "Single Motor"
 */
export const formatEnum = (value: string): string =>
	value
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");

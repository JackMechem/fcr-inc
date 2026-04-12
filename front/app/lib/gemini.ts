/**
 * Sends a prompt to the Gemini API and returns the response text.
 * Retries up to `retries` times on rate-limit (429) responses.
 */
export const callGemini = async (prompt: string, retries = 3): Promise<string> => {
	const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
	if (!key || key === "your_api_key_here")
		throw new Error("Gemini API key not set.");

	for (let attempt = 0; attempt < retries; attempt++) {
		const res = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${key}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
			},
		);
		if (res.ok) {
			const data = await res.json();
			return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
		}
		if (res.status === 429) {
			if (attempt < retries - 1) {
				await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
				continue;
			}
			throw new Error("Rate limit reached — wait a moment and try again.");
		}
		throw new Error(`Gemini error: ${res.status}`);
	}
	throw new Error("Request failed after retries.");
};

//
// Internal Fritter Utilities
//

/** Encodes a string for use in HTML. */
export function encodeHtml(rawString : string) : string
{
	return rawString.replace(/[<>&"']/g, (char) =>
	{
		switch (char)
		{
			case "<":
				return "&lt;";

			case ">":
				return "&gt;";

			case "&":
				return "&amp;";

			case "\"":
				return "&quot;";

			case "'":
				return "&apos;";

			default:
				return char;
		}
	});
}
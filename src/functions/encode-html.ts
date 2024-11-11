//
// Function
//

export function encodeHtml(rawString: string)
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
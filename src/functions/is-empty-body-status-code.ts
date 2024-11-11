//
// Function
//

export function isEmptyBodyStatusCode(statusCode: number)
{
	return [ 204, 205, 304 ].includes(statusCode);
}
//
// Function
//

export function isEmptyBodyStatusCode(statusCode : number) : boolean
{
	return [ 204, 205, 304 ].includes(statusCode);
}
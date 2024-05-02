//
// Function
//

export function isRedirectStatusCode(statusCode : number) : boolean
{
	return [ 300, 301, 302, 303, 305, 307, 308 ].includes(statusCode);
}
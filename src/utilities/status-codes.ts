//
// Status Code Utilities
//

export const emptyBodyStatusCodes = [ 204, 205, 304 ];

export function isEmptyBodyStatusCode(statusCode : number) : boolean
{
	return emptyBodyStatusCodes.includes(statusCode);
}

export type RedirectStatusCode = 300 | 301 | 302 | 303 | 305 | 307 | 308;

export const redirectStatusCodes = [ 300, 301, 302, 303, 305, 307, 308 ];

export function isRedirectStatusCode(statusCode : number) : boolean
{
	return redirectStatusCodes.includes(statusCode);
}
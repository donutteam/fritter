//
// Imports
//

import http from "node:http";

//
// Class
//

/**
 * A Fritter response.
 */
export class FritterResponse
{
	/**
	 * The raw Node.js HTTP response.
	 */
	private nodeResponse : http.ServerResponse;

	/**
	 * Constructs a new Fritter response using the given Node.js HTTP response.
	 *
	 * @param response A Node.js HTTP response.
	 */
	constructor(response : http.ServerResponse)
	{
		this.nodeResponse = response;
	}
}
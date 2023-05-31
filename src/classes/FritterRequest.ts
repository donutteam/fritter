//
// Imports
//

import http from "node:http";

//
// Class
//

/**
 * A Fritter request.
 */
export class FritterRequest
{
	/**
	 * The raw Node.js HTTP request.
	 */
	private nodeRequest : http.IncomingMessage;

	/**
	 * Constructs a new Fritter request using the given Node.js HTTP request.
	 *
	 * @param request A Node.js HTTP request.
	 */
	constructor(request : http.IncomingMessage)
	{
		this.nodeRequest = request;
	}
}
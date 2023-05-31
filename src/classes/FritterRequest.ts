//
// Imports
//

import http from "node:http";

import type { Fritter } from "./Fritter.js";

//
// Class
//

/**
 * A Fritter request.
 */
export class FritterRequest
{
	/**
	 * The Fritter instance that created this request.
	 */
	private fritter : Fritter;

	/**
	 * The raw Node.js HTTP request.
	 */
	private nodeRequest : http.IncomingMessage;

	/**
	 * Constructs a new Fritter request using the given Node.js HTTP request.
	 *
	 * @param fritter The Fritter instance that created this request.
	 * @param request A Node.js HTTP request.
	 */
	constructor(fritter : Fritter, request : http.IncomingMessage)
	{
		//
		// Store Arguments
		//

		this.fritter = fritter;

		this.nodeRequest = request;
	}
}
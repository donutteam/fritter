//
// Imports
//

import http from "node:http";

import type { Fritter } from "./Fritter.js";

//
// Class
//

/**
 * A Fritter response.
 */
export class FritterResponse
{
	/**
	 * The Fritter instance that created this request.
	 */
	private fritter : Fritter;

	/**
	 * The raw Node.js HTTP response.
	 */
	private nodeResponse : http.ServerResponse;

	/**
	 * Constructs a new Fritter response using the given Node.js HTTP response.
	 *
	 * @param fritter The Fritter instance that created this request.
	 * @param response A Node.js HTTP response.
	 */
	constructor(fritter : Fritter, response : http.ServerResponse)
	{
		//
		// Store Arguments
		//

		this.fritter = fritter;

		this.nodeResponse = response;
	}
}
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
	/** The Fritter instance that created this request. */
	public fritter : Fritter;

	/** The raw Node.js HTTP request. */
	public nodeRequest : http.IncomingMessage;

	/** The raw Node.js HTTP response. */
	public nodeResponse : http.ServerResponse;

	/**
	 * Constructs a new Fritter response using the given Node.js HTTP response.
	 *
	 * @param fritter The Fritter instance that created this request.
	 * @param request A Node.js HTTP request.
	 * @param response A Node.js HTTP response.
	 */
	constructor(fritter : Fritter, request : http.IncomingMessage, response : http.ServerResponse)
	{
		//
		// Store Arguments
		//

		this.fritter = fritter;

		this.nodeRequest = request;

		this.nodeResponse = response;
	}
}
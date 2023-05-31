//
// Imports
//

import http from "node:http";

import type { Fritter } from "./Fritter.js";
import { FritterRequest } from "./FritterRequest.js";
import { FritterResponse } from "./FritterResponse.js";

//
// Class
//

/**
 * A Fritter context.
 */
export class FritterContext
{
	/**
	 * The Fritter instance that created this context.
	 */
	public fritter : Fritter;

	/**
	 * The Fritter request.
	 */
	public fritterRequest : FritterRequest;

	/**
	 * The Fritter response.
	 */
	public fritterResponse : FritterResponse;

	/**
	 * The raw Node.js HTTP request.
	 */
	public nodeRequest : http.IncomingMessage;

	/**
	 * The raw Node.js HTTP response.
	 */
	public nodeResponse : http.ServerResponse;

	/**
	 * The state of the request.
	 *
	 * This is a place to store custom data that is specific to this request.
	 */
	public state : { [key : string] : any } = {};

	/**
	 * Constructs a new Fritter context.
	 *
	 * @param fritter An instance of Fritter.
	 * @param request A Node.js HTTP request.
	 * @param response A Node.js HTTP response.
	 */
	constructor(fritter : Fritter, request : http.IncomingMessage, response : http.ServerResponse)
	{
		this.fritter = fritter;

		this.fritterRequest = new FritterRequest(this.fritter, request);

		this.fritterResponse = new FritterResponse(this.fritter, response);

		this.nodeRequest = request;

		this.nodeResponse = response;
	}
}
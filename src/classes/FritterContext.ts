//
// Imports
//

import http from "node:http";

import Cookies from "cookies";

import type { Fritter } from "./Fritter.js";
import { FritterRequest } from "./FritterRequest.js";
import { FritterResponse } from "./FritterResponse.js";

//
// Class
//

/**
 * A Fritter context.
 */
export class FritterContext<State = { [key : string] : unknown }>
{
	/**
	 * The Fritter instance that created this context.
	 */
	public fritter : Fritter;

	/** The Fritter request. */
	public fritterRequest : FritterRequest;

	/** The Fritter response. */
	public fritterResponse : FritterResponse;

	/** The raw Node.js HTTP request. */
	public nodeRequest : http.IncomingMessage;

	/** The raw Node.js HTTP response. */
	public nodeResponse : http.ServerResponse;

	/** The cookies for this request. */
	public cookies : Cookies;

	/**
	 * The state of the request.
	 *
	 * This is a place to store custom data that is specific to this request.
	 */
	public state : State = {} as State;

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

		this.fritterRequest = new FritterRequest(fritter, this, request, response);

		this.fritterResponse = new FritterResponse(fritter, this, request, response);

		this.nodeRequest = request;

		this.nodeResponse = response;

		this.cookies = new Cookies(request, response,
			{
				secure: this.fritterRequest.isSecure(),
			});
	}
}
//
// Imports
//

import http from "node:http";
import net from "node:net";
import stream from "node:stream";

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

	/** The response body. */
	#body : string | Buffer | object | stream.Stream | null = null;

	/** Whether the status code has been explicitly set. */
	#hasExplicitlySetStatusCode = false;

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

	/** Gets the response body. */
	public getBody() : string | Buffer | object | stream.Stream | null
	{
		return this.#body;
	}

	/** Gets the socket of the response. */
	public getSocket() : net.Socket | null
	{
		return this.nodeResponse.socket;
	}

	public getStatusCode() : number
	{
		return this.nodeResponse.statusCode;
	}

	/** Gets whether the response body has been explicitly set. */
	public hasExplicitlySetStatusCode() : boolean
	{
		return this.#hasExplicitlySetStatusCode;
	}

	/** Sets the response body. */
	public setBody(body : string | Buffer | object | stream.Stream | null) : void
	{
		this.#body = body;
	}

	/** Sets the response status code. */
	public setStatusCode(statusCode : number) : void
	{
		if (this.nodeResponse.headersSent)
		{
			throw new Error("Cannot set status code after headers have been sent.");
		}

		if (statusCode < 100 || statusCode > 999)
		{
			throw new Error("Invalid status code: " + statusCode);
		}

		this.#hasExplicitlySetStatusCode = true;

		this.nodeResponse.statusCode = statusCode;

		switch (statusCode)
		{
			case 204:
			case 205:
			case 304:
				// TODO: Clear response body

				break;
		}
	}
}
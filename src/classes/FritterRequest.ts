//
// Imports
//

import http from "node:http";

import type { Fritter } from "./Fritter.js";

import type { HTTPMethod } from "../types/HTTPMethod.js";

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

	//
	// Getters
	//

	/**
	 * The length of the request body.
	 */
	public get contentLength() : number
	{
		if (this.#contentLength === undefined)
		{
			this.#contentLength = this.#initialiseContentLength();
		}

		return this.#contentLength;
	}

	#contentLength : number;

	#initialiseContentLength() : number
	{
		const contentLengthHeader = this.getHeaderValue("Content-Length");

		if (contentLengthHeader != null)
		{
			const contentLength = parseInt(contentLengthHeader);

			return isNaN(contentLength) ? 0 : contentLength;
		}

		return 0;
	}

	/**
	 * The HTTP method of the request.
	 */
	public get httpMethod() : HTTPMethod
	{
		if (this.#httpMethod === undefined)
		{
			this.#httpMethod = this.#initialiseHttpMethod();
		}

		return this.#httpMethod;
	}

	#httpMethod : HTTPMethod;

	#initialiseHttpMethod() : HTTPMethod
	{
		return this.nodeRequest.method.toUpperCase() as HTTPMethod;
	}

	/**
	 * The host of the request.
	 */
	public get host() : string
	{
		if (this.#host === undefined)
		{
			this.#host = this.#initialiseHost();
		}

		return this.#host;
	}

	#host : string;

	#initialiseHost() : string
	{
		return this.fritter.options.isProxied
			? (this.getHeaderValue("X-Forwarded-Host") ?? this.getHeaderValue("Host"))
			: this.getHeaderValue("Host");
	}

	/**
	 * The protocol of the request.
	 */
	public get protocol() : string
	{
		if (this.#protocol === undefined)
		{
			this.#protocol = this.#initialiseProtocol();
		}

		return this.#protocol;
	}

	#protocol : string;

	#initialiseProtocol() : "http" | "https"
	{
		const isEncryptedSocket = this.nodeRequest.socket.hasOwnProperty("encrypted") && (this.nodeRequest.socket as any).encrypted;

		let protocol : "http" | "https";

		if (isEncryptedSocket)
		{
			return "https";
		}
		else if (!this.fritter.options.isProxied)
		{
			return "http";
		}
		else
		{
			const forwardedProtocolHeader = this.getHeaderValue("X-Forwarded-Proto");

			if (forwardedProtocolHeader != null)
			{
				return forwardedProtocolHeader.split(/\s*,\s*/, 1)[0].toLowerCase() as "http" | "https";
			}
		}

		return "http";
	}

	/**
	 * A URL object representing the URL of the request.
	 */
	public get url() : URL
	{
		if (this.#url === undefined)
		{
			this.#url = this.#initialiseUrl();
		}

		return this.#url;
	}

	#url : URL;

	#initialiseUrl() : URL
	{
		return new URL(this.nodeRequest.url, this.protocol + "://" + this.getHeaderValue("Host"));
	}

	//
	// Methods
	//

	/**
	 * Gets the first value of the given header.
	 *
	 * @param headerName The name of the header to get the value of. This is case-insensitive.
	 * @returns The first value of the given header, or null if the header does not exist.
	 */
	public getHeaderValue(headerName : string) : string
	{
		const headerValue = this.nodeRequest.headers[headerName.toLowerCase()];

		if (Array.isArray(headerValue))
		{
			if (headerValue.length === 0)
			{
				return null;
			}

			return headerValue[0];
		}

		return headerValue ?? null;
	}

	/**
	 * Gets all values of the given header.
	 *
	 * @param headerName The name of the header to get the values of. This is case-insensitive.
	 * @returns An array of all values of the given header, or an empty array if the header does not exist.
	 */
	public getHeaderValues(headerName : string) : string[]
	{
		const headerValue = this.nodeRequest.headers[headerName.toLowerCase()];

		if (Array.isArray(headerValue))
		{
			return headerValue;
		}

		if (headerValue != null)
		{
			return [ headerValue ];
		}

		return [];
	}
}
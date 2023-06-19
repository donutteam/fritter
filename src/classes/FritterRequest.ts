//
// Imports
//

import type http from "node:http";
import { type Socket } from "node:net";
import { type TLSSocket } from "node:tls";

import contentType from "content-type";
import fresh from "fresh";

import type { Fritter } from "./Fritter.js";

import type { HTTPMethod } from "../types/HTTPMethod.js";

//
// Class
//

export type FritterRequestProtocol = "http" | "https";

/** A Fritter request. */
export class FritterRequest
{
	/** The Fritter instance that created this request. */
	public fritter : Fritter;

	/** The raw Node.js HTTP request. */
	public nodeRequest : http.IncomingMessage;

	/** The raw Node.js HTTP response. */
	public nodeResponse : http.ServerResponse;

	/** Internal storage for the contentLength property. */
	#contentLength : number;

	/** Internal storage for the httpMethod property. */
	#httpMethod : HTTPMethod;

	/** Internal storage for the host property. */
	#host : string | null;

	/** Internal storage for the protocol property. */
	#protocol : FritterRequestProtocol;

	/** Internal storage for the url property. */
	#url : URL;

	/**
	 * Constructs a new Fritter request using the given Node.js HTTP request.
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

	/** Gets the charset of the request's content type. */
	public getCharset() : string | null
	{
		try
		{
			const parsedMediaType = contentType.parse(this.nodeRequest);

			return parsedMediaType.parameters["charset"] ?? null;
		}
		catch (error)
		{
			return null;
		}
	}

	/** Gets the content length of the request. */
	public getContentLength() : number
	{
		if (this.#contentLength === undefined)
		{
			const contentLengthHeader = this.getHeaderValue("Content-Length");

			if (contentLengthHeader != null)
			{
				const contentLength = parseInt(contentLengthHeader);

				this.#contentLength = isNaN(contentLength) ? 0 : contentLength;
			}
			else
			{
				this.#contentLength = 0;
			}
		}

		return this.#contentLength;
	}

	/**
	 * Gets the first value of the given header.
	 *
	 * @param headerName The name of the header to get the value of. This is case-insensitive.
	 * @returns The first value of the given header, or null if the header does not exist.
	 */
	public getHeaderValue(headerName : string) : string | null
	{
		//
		// Convert Header Name to Lowercase
		//

		headerName = headerName.toLowerCase();

		//
		// Special Case for Referrer
		//

		if (headerName === "referrer")
		{
			headerName = "referer";
		}

		//
		// Get Header Value
		//

		const headerValue = this.nodeRequest.headers[headerName];

		if (Array.isArray(headerValue))
		{
			if (headerValue[0] == null)
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
	public getHeaderValueArray(headerName : string) : string[]
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

	/** Gets the HTTP method of the request. */
	public getHttpMethod() : HTTPMethod
	{
		if (this.#httpMethod === undefined)
		{
			this.#httpMethod = (this.nodeRequest.method as string).toUpperCase() as HTTPMethod;
		}

		return this.#httpMethod;
	}

	/** Gets the host of the request. */
	public getHost() : string | null
	{
		if (this.#host === undefined)
		{
			if (this.fritter.options.trustProxyHeaders)
			{
				this.#host = this.getHeaderValue("X-Forwarded-Host");
			}

			if (this.#host == null && this.nodeRequest.httpVersionMajor >= 2)
			{
				this.#host = this.getHeaderValue(":authority");
			}

			if (this.#host == null)
			{
				this.#host = this.getHeaderValue("Host");
			}
		}

		return this.#host;
	}

	/** Gets the hostname (host without port) of the request. */
	public getHostName() : string | null
	{
		const host = this.getHost();

		if (host == null)
		{
			return null;
		}

		const colonIndex = host.indexOf(":");

		if (colonIndex === -1)
		{
			return host;
		}

		return host.substring(0, colonIndex);
	}

	/** Gets the full href of the request. */
	public getHref() : string
	{
		return this.getUrl().href;
	}

	// TODO: getIp

	// TODO: getIps

	/** Gets the origin of the request. */
	public getOrigin() : string | null
	{
		return this.getProtocol() + "://" + this.getHost();
	}

	/** Gets the path of the request, without the query string. */
	public getPath() : string
	{
		return this.getUrl().pathname;
	}

	/** The protocol of the request. */
	public getProtocol() : FritterRequestProtocol
	{
		if (this.#protocol === undefined)
		{
			const isEncryptedSocket = (this.nodeRequest.socket as TLSSocket).encrypted ?? false;

			if (isEncryptedSocket)
			{
				this.#protocol = "https";
			}
			else if (!this.fritter.options.trustProxyHeaders)
			{
				this.#protocol = "http";
			}
			else
			{
				const forwardedProtocolHeader = this.getHeaderValue("X-Forwarded-Proto");

				if (forwardedProtocolHeader != null)
				{
					const components = forwardedProtocolHeader.split(/\s*,\s*/);

					const protocol = components[0]?.toLowerCase() ?? "http";

					if (protocol == "http" || protocol == "https")
					{
						this.#protocol = protocol;
					}
					else
					{
						this.#protocol = "http";
					}
				}
				else
				{
					this.#protocol = "http";
				}
			}
		}

		return this.#protocol;
	}

	/** Gets the query parameters of the request. */
	public getSearchParams() : URLSearchParams
	{
		return this.getUrl().searchParams;
	}

	/** Gets the socket of the request. */
	public getSocket() : Socket
	{
		return this.nodeRequest.socket;
	}

	// TODO: getSubdomains (using this.fritter.options.subdomainOffset)

	/** A URL object representing the URL of the request. */
	public getUrl() : URL
	{
		if (this.#url === undefined)
		{
			this.#url = new URL(this.nodeRequest.url as string, this.getProtocol() + "://" + this.getHost());
		}

		return this.#url;
	}

	/** Returns true if the client has an up-to-date copy of the resource. */
	public isFresh() : boolean
	{
		const method = this.getHttpMethod();

		if (method != "GET" && method != "HEAD")
		{
			return false;
		}

		const statusCode = this.nodeResponse.statusCode;

		if (statusCode >= 200 && statusCode < 300 || statusCode == 304)
		{
			return fresh(this.nodeRequest.headers, this.nodeResponse.getHeaders());
		}

		return false;
	}

	/** Returns true if the request is idempotent. */
	public isIdempotent() : boolean
	{
		const method = this.getHttpMethod();

		return ["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE"].includes(method);
	}

	/** Returns true if the request is secure. */
	public isSecure() : boolean
	{
		return this.getProtocol() == "https";
	}

	/** Returns true if the client has an out-of-date copy of the resource. */
	public isStale() : boolean
	{
		return !this.isFresh();
	}

	/** Sets the content length of the request. */
	public setContentLength(value : number) : void
	{
		this.#contentLength = value;
	}

	/** Sets the HTTP method of the request. */
	public setHttpMethod(method : HTTPMethod) : void
	{
		this.#httpMethod = method;
	}

	/** Sets the host of the request. */
	public setHost(value : string | null) : void
	{
		this.#host = value;
	}

	// TODO: setIp

	/** Sets the protocol of the request. */
	public setProtocol(protocol : FritterRequestProtocol) : void
	{
		this.#protocol = protocol;
	}

	/** Sets the URL of the request. */
	public setUrl(url : URL) : void
	{
		this.#url = url;
	}
}
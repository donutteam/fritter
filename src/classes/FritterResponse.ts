//
// Imports
//

import http from "node:http";
import net from "node:net";
import path from "node:path";
import stream from "node:stream";

import contentDisposition from "content-disposition";
import contentType from "content-type";
import destroy from "destroy";
import mimeTypes from "mime-types";
import onFinished from "on-finished";
import typeIs from "type-is";
import vary from "vary";

import { Fritter } from "./Fritter.js";
import { FritterContext } from "./FritterContext.js";

import { encodeHtml } from "../functions/encode-html.js";
import { isEmptyBodyStatusCode } from "../functions/is-empty-body-status-code.js";

//
// Class
//

/** Options for a FritterResponse's redirect method. */
export interface FritterResponseRedirectOptions
{
	/** The status code to use for the redirect. */
	statusCode? : 300 | 301 | 302 | 303 | 305 | 307 | 308;

	/** The URL to redirect to if there was no referer. */
	fallbackRedirectUrl? : string;
}

/** A Fritter response. */
export class FritterResponse
{
	/** The Fritter instance that created this request. */
	public fritter : Fritter;

	/** The Fritter context. */
	public fritterContext : FritterContext;

	/** The raw Node.js HTTP request. */
	public nodeRequest : http.IncomingMessage;

	/** The raw Node.js HTTP response. */
	public nodeResponse : http.ServerResponse;

	/** The response body. */
	#body : string | Buffer | object | stream.Stream | null = null;

	/** Whether the response body has been explicitly set to null. */
	#hasExplicitlyNullBody = false;

	/** Whether the content type has been explicitly set. */
	#hasExplicitlySetContentType = false;

	/** Whether the status code has been explicitly set. */
	#hasExplicitlySetStatusCode = false;

	/**
	 * Constructs a new Fritter response using the given Node.js HTTP response.
	 *
	 * @param fritter The Fritter instance that created this request.
	 * @param fritterContext The Fritter context.
	 * @param nodeRequest A Node.js HTTP request.
	 * @param nodeResponse A Node.js HTTP response.
	 */
	constructor(fritter : Fritter, fritterContext : FritterContext, nodeRequest : http.IncomingMessage, nodeResponse : http.ServerResponse)
	{
		//
		// Store Arguments
		//

		this.fritter = fritter;

		this.fritterContext = fritterContext;

		this.nodeRequest = nodeRequest;

		this.nodeResponse = nodeResponse;
	}

	/** Appends a value to the given header. */
	public appendHeaderValue(headerName : string, value : string) : void
	{
		const currentValues = this.getHeaderValueArray(headerName);

		if (currentValues == null)
		{
			this.setHeaderValue(headerName, value);
		}
		else
		{
			this.setHeaderValue(headerName, currentValues.concat(value));
		}
	}

	/** Appends a header name to the Vary header. */
	public appendVaryHeaderName(headerName : string) : void
	{
		vary(this.nodeResponse, headerName);
	}

	/** Gets the response body. */
	public getBody() : string | Buffer | object | stream.Stream | null
	{
		return this.#body;
	}

	/** Gets the content length of the response body. */
	public getContentLength() : number | null
	{
		const contentLengthHeader = this.getHeaderValue("Content-Length");

		if (contentLengthHeader != null)
		{
			return parseInt(contentLengthHeader);
		}

		if (this.#body == null || this.#body instanceof stream.Stream)
		{
			return null;
		}
		else if (Buffer.isBuffer(this.#body))
		{
			return this.#body.length;
		}

		return Buffer.byteLength(JSON.stringify(this.#body));
	}

	/** Gets the content type of the request. */
	public getContentType() : string | null
	{
		const contentTypeHeader = this.getHeaderValue("Content-Type");

		if (contentTypeHeader == null)
		{
			return null;
		}

		try
		{
			const parsedMediaType = contentType.parse(this.nodeRequest);

			return parsedMediaType.type;
		}
		catch (error)
		{
			// Note: contentType.parse throws if there was no Content-Type header.
			return null;
		}
	}

	/** Gets the ETag header of the response. */
	public getEntityTag() : string | null
	{
		return this.getHeaderValue("ETag");
	}

	/**
	 * If the request has no body, returns null.
	 *
	 * If the request has a body but is none of the types specified, returns false.
	 *
	 * Otherwise, returns the type of the request body.
	 */
	public getFirstMatchingType(types : string[]) : string | false | null
	{
		return typeIs.is(this.getContentType() ?? "", ...types);
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

		const headerValue = this.nodeResponse.getHeaders()[headerName];

		if (Array.isArray(headerValue))
		{
			if (headerValue[0] == null)
			{
				return null;
			}

			return headerValue[0].toString();
		}

		return headerValue?.toString() ?? null;
	}

	/**
	 * Gets all values of the given header.
	 *
	 * @param headerName The name of the header to get the values of. This is case-insensitive.
	 * @returns An array of all values of the given header, or an empty array if the header does not exist.
	 */
	public getHeaderValueArray(headerName : string) : string[]
	{
		const headerValue = this.nodeResponse.getHeaders()[headerName.toLowerCase()];

		if (Array.isArray(headerValue))
		{
			return headerValue.map((value) => value.toString());
		}

		if (headerValue != null)
		{
			return [ headerValue.toString() ];
		}

		return [];
	}

	/** Gets the last modified date of the response. */
	public getLastModified() : Date | null
	{
		const lastModifiedHeader = this.getHeaderValue("Last-Modified");

		if (lastModifiedHeader == null)
		{
			return null;
		}

		return new Date(lastModifiedHeader);
	}

	/** Gets the socket of the response. */
	public getSocket() : net.Socket | null
	{
		return this.nodeResponse.socket;
	}

	/** Gets the response status code. */
	public getStatusCode() : number
	{
		return this.nodeResponse.statusCode;
	}

	/** Gets whether the response body has been explicitly set to null. */
	public hasExplicitlyNullBody() : boolean
	{
		return this.#hasExplicitlyNullBody;
	}

	/** Gets whether the content type has been explicitly set. */
	public hasExplicitlySetContentType() : boolean
	{
		return this.#hasExplicitlySetContentType;
	}

	/** Checks if the response is still writable. */
	public isWritable() : boolean
	{
		if (this.nodeResponse.writableEnded)
		{
			return false;
		}

		if (this.nodeResponse.socket == null)
		{
			return true;
		}

		return this.nodeResponse.socket.writable;
	}

	/** Gets whether the response body has been explicitly set. */
	public hasExplicitlySetStatusCode() : boolean
	{
		return this.#hasExplicitlySetStatusCode;
	}

	/** Gets whether the response currently contains the given header. */
	public hasHeaderValues(headerName : string) : boolean
	{
		return this.nodeResponse.hasHeader(headerName);
	}

	/** Gets whether the response headers have been sent. */
	public hasSentHeaders() : boolean
	{
		return this.nodeResponse.headersSent;
	}

	/** Removes the given response header, if it exists. */
	public removeHeaderValue(name : string) : void
	{
		if (this.hasSentHeaders())
		{
			throw new Error("Cannot remove header after headers have been sent.");
		}

		this.nodeResponse.removeHeader(name);
	}

	/** Sets the response body. */
	public setBody(body : string | Buffer | object | stream.Stream | null) : void
	{
		const original = this.#body;

		this.#body = body;

		if (body == null)
		{
			if (!isEmptyBodyStatusCode(this.getStatusCode()))
			{
				if (this.getContentType() == "application/json")
				{
					this.#body = "null";

					return;
				}

				this.setStatusCode(204);
			}

			this.#hasExplicitlyNullBody = true;

			this.removeHeaderValue("Content-Length");
			this.removeHeaderValue("Content-Type");
			this.removeHeaderValue("Transfer-Encoding");

			return;
		}

		if (!this.hasExplicitlySetStatusCode())
		{
			this.setStatusCode(200);
		}

		if (typeof (body) === "string")
		{
			if (!this.#hasExplicitlySetContentType)
			{
				const isProbablyHtml = body.includes("<");

				this.setContentType(isProbablyHtml ? "text/html" : "text/plain");
			}

			this.setContentLength(Buffer.byteLength(body));
		}
		else if (Buffer.isBuffer(body))
		{
			if (!this.#hasExplicitlySetContentType)
			{
				this.setContentType("application/octet-stream");
			}

			this.setContentLength(body.length);
		}
		else if (body instanceof stream.Stream)
		{
			if (!this.#hasExplicitlySetContentType)
			{
				this.setContentType("application/octet-stream");
			}

			onFinished(this.nodeResponse, () => destroy.bind(null, body));

			if (original !== this.#body)
			{
				body.once("error", (error) =>
				{
					throw error;
				});
			}

			this.removeHeaderValue("Content-Length");
		}
	}

	/** Sets the Content-Disposition header of the response. */
	public setContentDisposition(fileName : string | undefined, options : contentDisposition.Options | undefined) : void
	{
		if (fileName != undefined)
		{
			this.setContentType(path.extname(fileName));
		}

		this.setHeaderValue("Content-Disposition", contentDisposition(fileName, options));
	}

	/** Sets the Content-Length header of the response. */
	public setContentLength(length : number | null) : void
	{
		const transferEncodingHeaderValue = this.getHeaderValue("Transfer-Encoding");

		if (transferEncodingHeaderValue != null)
		{
			throw new Error("Cannot set Content-Length when Transfer-Encoding is set.");
		}

		if (length == null)
		{
			this.removeHeaderValue("Content-Length");

			return;
		}

		this.setHeaderValue("Content-Length", length.toString());
	}

	/** Sets the Content-Type header of the response. */
	public setContentType(type : string | null) : void
	{
		if (type == null)
		{
			this.removeHeaderValue("Content-Type");

			return;
		}

		const contentType = mimeTypes.contentType(type);

		if (!contentType)
		{
			throw new Error("Invalid content type: " + type);
		}

		this.#hasExplicitlySetContentType = true;

		this.setHeaderValue("Content-Type", contentType);
	}

	/** Sets the ETag header of the response. */
	public setEntityTag(entityTag : string) : void
	{
		if (!/^(W\/)?"/.test(entityTag))
		{
			entityTag = `"${ entityTag }"`;
		}

		this.setHeaderValue("ETag", entityTag);
	}

	/**
	 * Sets a response header.
	 *
	 * Supplying an array of values will set multiple headers with the same name.
	 */
	public setHeaderValue(name : string, value : string | string[]) : void
	{
		if (this.hasSentHeaders())
		{
			throw new Error("Cannot set header after headers have been sent.");
		}

		this.nodeResponse.setHeader(name, value);
	}

	/** Sets the Last-Modified header of the response. */
	public setLastModified(date : Date) : void
	{
		this.setHeaderValue("Last-Modified", date.toUTCString());
	}

	/**
	 * Sets the response to redirect to the given URL.
	 *
	 * You can also use the special URL "back" to redirect to the previous page, if the client sent a Referer header.
	 */
	public setRedirect(url : string, options : FritterResponseRedirectOptions = {}) : void
	{
		//
		// Default Options
		//

		options.statusCode ??= 302;

		options.fallbackRedirectUrl ??= "/";

		//
		// Special "back" URL
		//

		if (url == "back")
		{
			url = this.fritterContext.fritterRequest.getHeaderValue("Referer") ?? options.fallbackRedirectUrl;
		}

		//
		// Set Status Code
		//

		this.setStatusCode(options.statusCode);

		//
		// Set Location Header
		//

		this.setHeaderValue("Location", url);

		//
		// Set HTML Body (if client accepts HTML)
		//

		if (this.fritterContext.fritterRequest.getAccepts().types("text/html"))
		{
			const encodedUrl = encodeHtml(url);

			this.setContentType("text/html");

			this.setBody(`<p>Redirecting to <a href="${ encodedUrl }">${ encodedUrl }</a></p>`);
		}
		else
		{
			this.setContentType("text/plain");

			this.setBody("Redirecting to " + url);
		}
	}

	/** Sets the response status code. */
	public setStatusCode(statusCode : number) : void
	{
		if (this.hasSentHeaders())
		{
			throw new Error("Cannot set status code after headers have been sent.");
		}

		if (statusCode < 100 || statusCode > 999)
		{
			throw new Error("Invalid status code: " + statusCode);
		}

		this.#hasExplicitlySetStatusCode = true;

		this.nodeResponse.statusCode = statusCode;

		if (isEmptyBodyStatusCode(statusCode))
		{
			this.setBody(null);
		}
	}
}
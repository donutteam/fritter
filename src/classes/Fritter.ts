//
// Imports
//

import http from "node:http";
import https from "node:https";

import { FritterContext } from "./FritterContext.js";

import { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Class
//

/**
 * Options for a Fritter instance.
 */
export interface FritterOptions
{
	/**
	 * Whether this Fritter instance is proxied to.
	 */
	isProxied? : boolean;
}

/**
 * A web server.
 */
export class Fritter
{
	/**
	 * The options for this Fritter instance.
	 */
	public readonly options : FritterOptions;

	/**
	 * The middleware stack.
	 */
	private readonly middlewareStack : FritterMiddlewareFunction[];

	/**
	 * The underlying Node.js HTTP server.
	 */
	private httpServer : http.Server;

	/**
	 * An HTTPS server.
	 */
	private httpsServer : https.Server;

	/**
	 * Constructs a new Fritter instance.
	 */
	constructor(options : FritterOptions = {})
	{
		//
		// Default Options
		//

		options.isProxied ??= false;

		//
		// Initialise Class
		//

		this.options = options;

		this.middlewareStack = [];
	}

	/**
	 * Handles an incoming HTTP request.
	 *
	 * @param request A Node.js HTTP request.
	 * @param response A Node.js HTTP response.
	 */
	private async handleRequest(request : http.IncomingMessage, response : http.ServerResponse)
	{
		const fritterContext = new FritterContext(this, request, response);

		let currentIndex = -1;

		const executeMiddleware = async () =>
		{
			currentIndex += 1;

			const nextMiddleware = this.middlewareStack[currentIndex];

			if (nextMiddleware != null)
			{
				await nextMiddleware(fritterContext, executeMiddleware);
			}
			else
			{
				response.statusCode = 404;
				response.setHeader("Content-Type", "text/plain");
				response.end("Not found.");
			}
		};

		try
		{
			await executeMiddleware();
		}
		catch(error)
		{
			console.error("[Fritter] Error while executing middleware stack:", error);

			response.statusCode = 500;
			response.setHeader("Content-Type", "text/plain");
			response.end("Internal server error.");
		}
	}

	/**
	 * Starts an HTTP server on the specified port.
	 *
	 * @param port The port to listen on.
	 */
	public async startHttp(port : number) : Promise<void>
	{
		this.httpServer = http.createServer(this.handleRequest.bind(this));

		return new Promise((resolve, reject) =>
		{
			this.httpServer.listen(port, () => resolve());

			this.httpServer.on("error", (error) => reject(error));
		});
	}

	/**
	 * Starts an HTTPS server on the specified port.
	 *
	 * @param port
	 * @param options
	 */
	public async startHttps(port : number, options : https.ServerOptions) : Promise<void>
	{
		this.httpsServer = https.createServer(options, this.handleRequest.bind(this));

		return new Promise((resolve, reject) =>
		{
			this.httpsServer.listen(port, () => resolve());

			this.httpsServer.on("error", (error) => reject(error));
		});
	}

	/**
	 * Stops the HTTP server.
	 */
	public async stopHttp() : Promise<void>
	{
		return new Promise((resolve, reject) =>
		{
			if (this.httpServer == null)
			{
				resolve();

				return;
			}

			this.httpServer.close((error) =>
			{
				if (error)
				{
					reject(error);
				}
				else
				{
					resolve();
				}
			});
		});
	}

	/**
	 * Stops the HTTPS server.
	 */
	public async stopHttps() : Promise<void>
	{
		return new Promise((resolve, reject) =>
		{
			if (this.httpsServer == null)
			{
				resolve();

				return;
			}

			this.httpsServer.close((error) =>
			{
				if (error)
				{
					reject(error);
				}
				else
				{
					resolve();
				}
			});
		});
	}

	/**
	 * Adds a middleware function to the stack.
	 *
	 * @param fritterMiddlewareFunction A Fritter middleware function.
	 */
	public use(fritterMiddlewareFunction : FritterMiddlewareFunction) : void
	{
		this.middlewareStack.push(fritterMiddlewareFunction);
	}
}
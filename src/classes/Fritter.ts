//
// Imports
//

import http from "node:http";

import { FritterContext } from "./FritterContext.js";

import { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Class
//

/**
 * A web server.
 */
export class Fritter
{
	/**
	 * The underlying Node.js HTTP server.
	 */
	private httpServer : http.Server;

	/**
	 * The middleware stack.
	 */
	private middlewareStack : FritterMiddlewareFunction[];

	/**
	 * Constructs a new Fritter instance.
	 */
	constructor()
	{
		this.httpServer = http.createServer(this.handleRequest);
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

			if (currentIndex < this.middlewareStack.length)
			{
				const currentMiddleware = this.middlewareStack[currentIndex];

				await currentMiddleware(fritterContext, executeMiddleware);
			}
			else
			{
				response.statusCode = 404;
				response.setHeader("Content-Type", "text/plain");
				response.end("Not found.");
			}
		}

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
	 * Starts the server on the specified port.
	 *
	 * @param port The port to listen on.
	 */
	public async start(port : number) : Promise<void>
	{
		return new Promise((resolve, reject) =>
		{
			this.httpServer.listen(port, () => resolve());

			this.httpServer.on("error", (error) => reject(error));
		});
	}

	/**
	 * Stops the server.
	 */
	public async stop() : Promise<void>
	{
		return new Promise((resolve, reject) =>
		{
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
	 * Adds a middleware function to the stack.
	 *
	 * @param fritterMiddlewareFunction A Fritter middleware function.
	 */
	public use(fritterMiddlewareFunction : FritterMiddlewareFunction) : void
	{
		this.middlewareStack.push(fritterMiddlewareFunction);
	}
}
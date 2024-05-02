//
// Imports
//

import { pathToRegexp, type Key, type ParseOptions, type TokensToRegexpOptions } from "path-to-regexp";

import type { FritterContext } from "../classes/FritterContext.js";

import type { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";
import type { HTTPMethod } from "../types/HTTPMethod.js";

//
// Interfaces
//

export interface CreateOptions
{
	pathToRegexpOptions? : TokensToRegexpOptions & ParseOptions;

	routes : Route[];
}

export interface MiddlewareFritterContext extends FritterContext
{
	routeParameters : { [key : string] : string };
}

export interface Route
{
	method : HTTPMethod | "ALL";

	path : string;

	middlewares? : FritterMiddlewareFunction<any>[];

	handler : FritterMiddlewareFunction;
}

//
// Create Function
//

export function create(options : CreateOptions) : FritterMiddlewareFunction<MiddlewareFritterContext>
{
	const pathToRegexpOptions = options.pathToRegexpOptions ?? {};

	const routes = options.routes;

	return async (context, next) =>
	{
		//
		// Initialise Fritter Context
		//

		context.routeParameters = {};

		//
		// Attempt to Match Route
		//

		for (const route of routes)
		{
			//
			// Check Method
			//

			if (route.method != "ALL" && route.method != context.fritterRequest.getHttpMethod())
			{
				continue;
			}

			//
			// Convert Path to RegExp
			//

			const rawRouteParameters : Key[] = [];

			const regExp = pathToRegexp(route.path, rawRouteParameters, pathToRegexpOptions);

			//
			// Try to Match Path
			//

			const matches = regExp.exec(context.fritterRequest.getPath());

			if (matches == null)
			{
				continue;
			}

			//
			// Add Route Parameters to Fritter Context
			//

			for (const [ matchIndex, match ] of matches.slice(1).entries())
			{
				const rawRouteParameter = rawRouteParameters[matchIndex];

				if (rawRouteParameter != null && match != undefined)
				{
					context.routeParameters[rawRouteParameter.name] = decodeURIComponent(match);
				}
			}

			//
			// Execute Route
			//

			let currentIndex = -1;

			const middlewares =
				[
					...route.middlewares ?? [],
					route.handler,
				];

			const executeMiddleware = async () =>
			{
				currentIndex += 1;

				const nextMiddleware = middlewares[currentIndex];

				if (nextMiddleware != null)
				{
					await nextMiddleware(context, executeMiddleware);
				}
				else
				{
					await next();
				}
			};

			await executeMiddleware();

			return;
		}

		//
		// Execute Next Middleware
		//

		await next();
	};
}
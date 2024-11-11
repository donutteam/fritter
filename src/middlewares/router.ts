//
// Imports
//

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { Key, pathToRegexp, ParseOptions, TokensToRegexpOptions } from "path-to-regexp";

import { FritterContext } from "../classes/FritterContext.js";

import { HTTPMethod } from "../types/HTTPMethod.js";
import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Types
//

export type Route<RouteFritterContext extends MiddlewareFritterContext = MiddlewareFritterContext> =
{
	method: HTTPMethod | "ALL";
	path: string;
	middlewares?: MiddlewareFunction<RouteFritterContext>[];
	handler: MiddlewareFunction<RouteFritterContext>;
};

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext &
{
	routeParameters: Record<string, string>;
};

export type CreateOptions =
{
	pathToRegexpOptions?: TokensToRegexpOptions & ParseOptions;
	routes?: Route[];
};

export type CreateResult =
{
	execute: MiddlewareFunction<MiddlewareFritterContext>;
	getRoutes: () => Route[];
	addRoute: (route : Route) => void;
	loadRoutesDirectory: (directoryPath: string) => Promise<Route[]>;
	loadRoutesFile: (filePath: string) => Promise<Route[]>;
	removeRoute: (route: Route) => void;
};

export function create(options: CreateOptions = {}): CreateResult
{
	const pathToRegexpOptions = options.pathToRegexpOptions ?? {};

	const routes: Route[] = options.routes ?? [];

	const execute: CreateResult["execute"] = async (context, next) =>
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

	const getRoutes: CreateResult["getRoutes"] = () =>
	{
		return [ ...routes ];
	};

	const addRoute: CreateResult["addRoute"] = (route) =>
	{
		routes.push(route);
	}

	const loadRoutesFile: CreateResult["loadRoutesFile"] = async (filePath) =>
	{
		const routeContainer = await import(url.pathToFileURL(filePath).toString()) as
		{
			route?: Route | Route[],
			routes?: Route | Route[],
		};

		const routeOrRoutes = routeContainer.route ?? routeContainer.routes;

		if (routeOrRoutes == null)
		{
			return [];
		}

		if (Array.isArray(routeOrRoutes))
		{
			for (const route of routeOrRoutes)
			{
				routes.push(route);
			}

			return routeOrRoutes;
		}
		else
		{
			routes.push(routeOrRoutes);

			return [ routeOrRoutes ];
		}
	};

	const loadRoutesDirectory: CreateResult["loadRoutesDirectory"] = async (directoryPath) =>
	{
		const directoryRoutes: Route[] = [];

		const directoryEntries = await fs.promises.readdir(directoryPath,
			{
				withFileTypes: true,
			});

		for (const directoryEntry of directoryEntries)
		{
			const directoryEntryPath = path.join(directoryPath, directoryEntry.name);

			if (directoryEntry.isDirectory())
			{
				const subdirectoryRoutes = await loadRoutesDirectory(directoryEntryPath);

				directoryRoutes.push(...subdirectoryRoutes);
			}
			else
			{
				const parsedPath = path.parse(directoryEntryPath);

				if (parsedPath.ext != ".js")
				{
					continue;
				}

				const fileRoutes = await loadRoutesFile(directoryEntryPath);

				directoryRoutes.push(...fileRoutes);
			}
		}

		return directoryRoutes;
	};

	const removeRoute: CreateResult["removeRoute"] = (route) =>
	{
		const index = routes.indexOf(route);

		if (index != -1)
		{
			routes.splice(index, 1);
		}
	};

	return {
		execute,
		getRoutes,
		addRoute,
		loadRoutesDirectory,
		loadRoutesFile,
		removeRoute,
	};
}
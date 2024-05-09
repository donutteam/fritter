//
// Imports
//

import type { FritterContext } from "../classes/FritterContext.js";

import type { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Interfaces
//

export interface MiddlewareFritterContext extends FritterContext
{
	currentPage : number;
}

//
// Create Function
//

export interface CreateOptions
{
	getPageNumber? : (context : MiddlewareFritterContext) => number;
}

export interface CreateResult
{
	execute : FritterMiddlewareFunction<MiddlewareFritterContext>;
}

export function create(options : CreateOptions = {}) : CreateResult
{
	const getPageNumber = options.getPageNumber ??
		((context) =>
		{
			let currentPage = parseInt(context.fritterRequest.getSearchParams().get("page") ?? "1");

			if (isNaN(currentPage))
			{
				currentPage = 1;
			}

			return currentPage;
		});

	return {
		execute: async (context, next) =>
		{
			context.currentPage = getPageNumber(context);

			await next();
		},
	};
}
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
	getPageNumber : (context : MiddlewareFritterContext) => number;
}

export interface CreateResult
{
	execute : FritterMiddlewareFunction<MiddlewareFritterContext>;
}

export function create(options : CreateOptions) : CreateResult
{
	const getPageNumber = options.getPageNumber ??
		((context) =>
		{
			return context.fritterRequest.getSearchParams().get("page");
		});

	return {
		execute: async (context, next) =>
		{
			let currentPage = getPageNumber(context);

			if (isNaN(currentPage))
			{
				currentPage = 1;
			}

			context.currentPage = currentPage;

			await next();
		},
	};
}
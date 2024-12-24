//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext &
{
	currentPageNumber: number;
};

export type CreateOptions =
{
	getPageNumber?: (context: MiddlewareFritterContext) => number;
};

export type CreateResult =
{
	getPageNumber: (context: MiddlewareFritterContext) => number;
	execute: MiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options: CreateOptions = {}): CreateResult
{
	const currentPageNumberMiddleware: CreateResult =
	{
		getPageNumber: options.getPageNumber ??
			((context) =>
			{
				let currentPage = parseInt(context.fritterRequest.getSearchParams().get("page") ?? "1");

				if (isNaN(currentPage))
				{
					currentPage = 1;
				}

				return currentPage;
			}),

		execute: async (context, next) =>
		{
			const currentPageNumber = currentPageNumberMiddleware.getPageNumber(context);

			context.currentPageNumber = currentPageNumber;

			await next();
		},
	};

	return currentPageNumberMiddleware;
}
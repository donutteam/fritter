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
	/** @deprecated */
	currentPage: number;

	currentPageNumber: number;
};

export type CreateOptions =
{
	getPageNumber?: (context: MiddlewareFritterContext) => number;
};

export type CreateResult =
{
	execute: MiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options: CreateOptions = {}): CreateResult
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
			const currentPageNumber = getPageNumber(context);

			context.currentPage = currentPageNumber;

			context.currentPageNumber = currentPageNumber;

			await next();
		},
	};
}
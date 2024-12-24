//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext<T> = FritterContext &
{
	currentPageNumber: number;
	getPagination: () => T;
};

export type CreateOptions<T = null> =
{
	getPageNumber?: (context: MiddlewareFritterContext<T>) => number;
	getPagination?: (context: MiddlewareFritterContext<T>) => T;
};

export type CreateResult<T> =
{
	getPageNumber: (context: MiddlewareFritterContext<T>) => number;
	getPagination: (context: MiddlewareFritterContext<T>) => T;
	execute: MiddlewareFunction<MiddlewareFritterContext<T>>;
};

export function create<T = null>(options: CreateOptions<T> = {}): CreateResult<T>
{
	const currentPageNumberMiddleware: CreateResult<T> =
	{
		getPageNumber: options.getPageNumber ??
			((context) =>
			{
				let currentPage = parseInt(context.fritterRequest.getSearchParams().get("page") ?? "1");

				return isNaN(currentPage) ? 1 : currentPage;
			}),

		getPagination: options.getPagination ?? (() => null as T),

		execute: async (context, next) =>
		{
			const currentPageNumber = currentPageNumberMiddleware.getPageNumber(context);

			context.currentPageNumber = currentPageNumber;

			context.getPagination = () => currentPageNumberMiddleware.getPagination(context);

			await next();
		},
	};

	return currentPageNumberMiddleware;
}
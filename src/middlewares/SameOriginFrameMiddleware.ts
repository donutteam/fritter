//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext;

export type CreateResult =
{
	execute: MiddlewareFunction<MiddlewareFritterContext>;
};

export function create(): CreateResult
{
	return {
		execute: async (context, next) =>
		{
			context.fritterResponse.setHeaderValue("X-Frame-Options", "SAMEORIGIN");

			await next();
		},
	};
}
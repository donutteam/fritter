//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext;

export type CreateOptions =
{
	allowCredentialsOrigins?: string[];
};

export type CreateResult =
{
	execute: MiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options?: CreateOptions): CreateResult
{
	const allowCredentialsOrigins = options?.allowCredentialsOrigins ?? [];

	return {
		execute: async (context, next) =>
		{
			const origin = context.fritterRequest.getHeaderValue("Origin");

			context.fritterResponse.appendVaryHeaderName("Origin");

			if (origin != null && allowCredentialsOrigins.includes(origin))
			{
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Credentials", "true");
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Origin", origin);
			}
			else
			{
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Credentials", "false");
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Origin", "*");
			}

			if (context.fritterRequest.getHttpMethod() == "OPTIONS")
			{
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Headers", context.fritterRequest.getHeaderValue("Access-Control-Request-Headers") ?? "");
				context.fritterResponse.setStatusCode(204);

				return;
			}

			await next();
		},
	};
}
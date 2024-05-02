//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import type { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Interfaces
//

export interface CreateOptions
{
	allowCredentialsOrigins? : string[];
}

export interface MiddlewareFritterContext extends FritterContext
{
	// No additional properties
}

//
// Create Function
//

export function create(options : CreateOptions) : FritterMiddlewareFunction<MiddlewareFritterContext>
{
	const allowCredentialsOrigins = options.allowCredentialsOrigins ?? [];

	return async (context, next) =>
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
	};
}
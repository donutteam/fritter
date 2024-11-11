//
// Imports
//

import * as Utilities from "@donutteam/utilities";

import { FritterContext } from "../classes/FritterContext.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext;

export type CreateOptions =
{
	allowInsecureLocalIpAddresses?: boolean;
};

export type CreateResult =
{
	allowInsecureLocalIpAddresses: boolean;
	execute: MiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options?: CreateOptions): CreateResult
{
	const forceSslMiddleware: CreateResult =
	{
		allowInsecureLocalIpAddresses: options?.allowInsecureLocalIpAddresses ?? false,

		execute: async (context, next) =>
		{
			if (context.fritterRequest.isSecure())
			{
				return await next();
			}

			if (forceSslMiddleware.allowInsecureLocalIpAddresses && Utilities.NetworkLib.isLocalIp(context.fritterRequest.getIp()))
			{
				return await next();
			}

			const url = new URL(context.fritterRequest.getUrl());

			url.protocol = "https:";

			context.fritterResponse.setRedirect(url.toString());
		},
	};

	return forceSslMiddleware;
}
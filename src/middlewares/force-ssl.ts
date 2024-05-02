//
// Imports
//

import { isLocalIpAddress } from "@donutteam/utilities";

import { FritterContext } from "../classes/FritterContext.js";

import type { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Interfaces
//

export interface MiddlewareFritterContext extends FritterContext
{
	// No additional properties
}

//
// Create Function
//

export interface CreateOptions
{
	allowInsecureLocalIpAddresses? : boolean;
}

export interface CreateResult
{
	execute : FritterMiddlewareFunction<MiddlewareFritterContext>;
}

export function create(options : CreateOptions) : CreateResult
{
	const allowLocalIpAddresses = options.allowInsecureLocalIpAddresses ?? false;

	return {
		execute: async (context, next) =>
		{
			if (context.fritterRequest.isSecure())
			{
				return await next();
			}

			if (allowLocalIpAddresses && isLocalIpAddress(context.fritterRequest.getIp()))
			{
				return await next();
			}

			const url = new URL(context.fritterRequest.getUrl());

			url.protocol = "https:";

			context.fritterResponse.setRedirect(url.toString());
		},
	};
}
//
// Imports
//

import type { FritterContext } from "../classes/FritterContext.js";

import type { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Interfaces
//

export interface CreateOptions
{
	startMessage? : string;

	endMessage? : string;
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
	let startMessageTemplate = options.startMessage ?? "[LogRequestMiddleware] Request {{ REQUEST_NUMBER }} | {{ IP }} | {{ HTTP_METHOD }} | {{ PATH }} | Start";

	let endMessageTemplate = options.endMessage ?? "[LogRequestMiddleware] Request {{ REQUEST_NUMBER }} | {{ IP }} | {{ HTTP_METHOD }} | {{ PATH }} | End | Status Code: {{ STATUS_CODE }}";

	let requestNumber = 0;

	return async (context, next) =>
	{
		//
		// Increment Request Number
		//

		requestNumber += 1;

		//
		// Start Log
		//

		const startMessage = startMessageTemplate
			.replace("{{ REQUEST_NUMBER }}", requestNumber.toString())
			.replace("{{ IP }}", context.fritterRequest.getIp())
			.replace("{{ HTTP_METHOD }}", context.fritterRequest.getHttpMethod())
			.replace("{{ PATH }}", context.fritterRequest.getPath());

		console.log(startMessage);

		//
		// Execute Next Middleware
		//

		await next();

		//
		// End Log
		//

		const endMessage = endMessageTemplate
			.replace("{{ REQUEST_NUMBER }}", requestNumber.toString())
			.replace("{{ IP }}", context.fritterRequest.getIp())
			.replace("{{ HTTP_METHOD }}", context.fritterRequest.getHttpMethod())
			.replace("{{ PATH }}", context.fritterRequest.getPath())
			.replace("{{ STATUS_CODE }}", context.fritterResponse.getStatusCode().toString());

		console.log(endMessage);
	};
}
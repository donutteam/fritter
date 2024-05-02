//
// Imports
//

import { DE } from "@donutteam/document-builder";

import type { FritterContext } from "../classes/FritterContext.js";

import type { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Types
//

export type ComponentFunction<ComponentFunctionOptions> = (options : ComponentFunctionOptions) => DE;

export type GetOptionsFunction<ComponentFunctionOptions, BaseFritterContext extends FritterContext = FritterContext> =
	(
		context : MiddlewareFritterContext<ComponentFunctionOptions, BaseFritterContext>,
		options : Partial<ComponentFunctionOptions>,
	) => ComponentFunctionOptions;

export type RenderComponentFunction<ComponentFunctionOptions> = (options : Partial<ComponentFunctionOptions>) => void;

export type MiddlewareFritterContext<RenderComponentOptions, BaseFritterContext extends FritterContext = FritterContext> =
	BaseFritterContext &
	{
		renderComponent : RenderComponentFunction<RenderComponentOptions>
	};

//
// Create Function
//

export interface CreateOptions<ComponentFunctionOptions, BaseFritterContext extends FritterContext = FritterContext>
{
	componentFunction : ComponentFunction<ComponentFunctionOptions>;

	getOptionsFunction : GetOptionsFunction<ComponentFunctionOptions, BaseFritterContext>;
}

export interface CreateResult<ComponentFunctionOptions, BaseFritterContext extends FritterContext = FritterContext>
{
	execute : FritterMiddlewareFunction<MiddlewareFritterContext<ComponentFunctionOptions, BaseFritterContext>>;
}

export function create<ComponentFunctionOptions, BaseFritterContext extends FritterContext = FritterContext>(options : CreateOptions<ComponentFunctionOptions, BaseFritterContext>) : CreateResult<ComponentFunctionOptions, BaseFritterContext>
{
	const componentFunction = options.componentFunction;

	const getOptionsFunction = options.getOptionsFunction;

	return {
		execute: async (context, next) =>
		{
			//
			// Add Render Component Function
			//

			context.renderComponent = (options) =>
			{
				const fullOptions = getOptionsFunction(context, options);

				const component = componentFunction(fullOptions);

				context.fritterResponse.setContentType("text/html");
				context.fritterResponse.setBody(component.renderToString());
			};

			//
			// Execute Next Middleware
			//

			await next();
		},
	};
}
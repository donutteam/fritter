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
// Interfaces
//

export interface CreateOptions<ComponentFunctionOptions, BaseFritterContext extends FritterContext = FritterContext>
{
	componentFunction : ComponentFunction<ComponentFunctionOptions>;

	getOptionsFunction : GetOptionsFunction<ComponentFunctionOptions, BaseFritterContext>;
}

//
// Create Function
//

export function create<ComponentFunctionOptions, BaseFritterContext extends FritterContext = FritterContext>(options : CreateOptions<ComponentFunctionOptions, BaseFritterContext>) : FritterMiddlewareFunction<MiddlewareFritterContext<ComponentFunctionOptions, BaseFritterContext>>
{
	const componentFunction = options.componentFunction;

	const getOptionsFunction = options.getOptionsFunction;

	return async (context, next) =>
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
	};
}
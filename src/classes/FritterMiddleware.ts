//
// Imports
//

import { FritterContext } from "./FritterContext.js";

//
// Class
//

export type FritterMiddlewareFunction<Type extends FritterContext = FritterContext> = (context : Type, next : () => Promise<void>) => Promise<void>;

export abstract class FritterMiddleware
{
	public execute : FritterMiddlewareFunction;

	protected constructor()
	{
		this.execute = async () =>
		{
			throw new Error("FritterMiddleware.execute() not implemented.");
		};
	}
}
//
// Imports
//

import { FritterContext } from "./FritterContext.js";

//
// Class
//

export type FritterMiddlewareFunction = (context : FritterContext, next : () => Promise<void>) => Promise<void>;

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
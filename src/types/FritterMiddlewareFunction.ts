//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

//
// Types
//

export type MiddlewareFunction<Type extends FritterContext = FritterContext> = (context : Type, next : () => Promise<void>) => Promise<void>;

/** @deprecated */
export type FritterMiddlewareFunction<Type extends FritterContext = FritterContext> = MiddlewareFunction<Type>;
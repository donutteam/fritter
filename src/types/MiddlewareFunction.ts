//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

//
// Types
//

export type MiddlewareFunction<Type extends FritterContext = FritterContext> = (context : Type, next : () => Promise<void>) => Promise<void>;
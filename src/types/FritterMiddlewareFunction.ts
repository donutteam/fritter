//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

//
// Type
//

export type FritterMiddlewareFunction = (context : FritterContext, next : () => Promise<void>) => Promise<void>;
//
// Exports
//

export * from "./classes/Fritter.js";
export * from "./classes/FritterContext.js";
export * from "./classes/FritterRequest.js";
export * from "./classes/FritterResponse.js";

export * as BodyParserMiddleware from "./middlewares/body-parser.js";
export * as CorsMiddleware from "./middlewares/CorsMiddleware.js";
export * as CurrentPageMiddleware from "./middlewares/current-page-number.js"; // Deprecated, remove in v2.0.0, if that ever happens
export * as CurrentPageNumberMiddleware from "./middlewares/current-page-number.js";
export * as ForceSslMiddleware from "./middlewares/force-ssl.js";
export * as LogRequestMiddleware from "./middlewares/log-request.js";
export * as RouterMiddleware from "./middlewares/router.js";
export * as StaticMiddleware from "./middlewares/static.js";

export * from "./types/HTTPMethod.js";
export * from "./types/MiddlewareFunction.js";
export * from "./types/PossibleJsonData.js";
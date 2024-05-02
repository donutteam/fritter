## 1.0.0
Initial stable release.

This is a quite significant rewrite from the previous version. It also bundles common middlewares to simplify the usage of the library.

## 0.1.10

* Removed eslint packages and config.
* Updated all other packages.

## 0.1.9
Updated packages.

## 0.1.8
Updated @types/node package.

## 0.1.7
Updated packages.

## 0.1.6
Added a try around calls to `contentType.parse` as it throws if there is no Content-Type header in a request/response.

## 0.1.5
Added the `src` folder to the published package for better developer experience.

## 0.1.4
Changed `Fritter.use` to accept any type of `FritterMiddlewareFunction`.

## 0.1.3
Removed `FritterMiddleware` class as it just complicated things too much and was also too opinionated.

## 0.1.2
Made `FritterMiddlewareFunction` optionally generic.

## 0.1.1
Removed the generic `state` property from `FritterContext`.

## 0.1.0
Initial alpha release.
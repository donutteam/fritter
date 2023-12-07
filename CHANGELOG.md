## 0.1.10

* Removing eslint packages and config.
* Updating all other packages.

## 0.1.9
Updating packages.

## 0.1.8
Updating @types/node package.

## 0.1.7
Updating packages.

## 0.1.6
Adding a try around calls to `contentType.parse` as it throws if there is no Content-Type header in a request/response.

## 0.1.5
Experimental change where I include the `src` folder on publish for debugging.

## 0.1.4
Changed `Fritter.use` to accept any type of `FritterMiddlewareFunction`.

## 0.1.3
Removing `FritterMiddleware` class as it just complicated things too much and was also too opinionated.

## 0.1.2
Made FritterMiddlewareFunction optionally generic.

## 0.1.1
Removed the generic `state` property from `FritterContext`.

## 0.1.0
Initial alpha release.
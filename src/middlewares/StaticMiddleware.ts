//
// Imports
//

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import isCompressible from "compressible";
import mimeTypes from "mime-types";

import { FritterContext } from "../classes/FritterContext.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Types
//

export type Directory =
{
	mountPath?: string;
	path: string;
};

export type File =
{
	onDiskFilePath: string;
	modifiedDate: Date;
	size: number;
	rawStats: fs.Stats;
	type: string;
};

export type FileDataCache = Record<string, File>;

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext;

export type CreateOptions =
{
	cacheControlHeader?: string;
	directories: Directory[];
	enableGzip?: boolean;
};

export type CreateResult =
{
	cacheControlHeader: string;
	directories: Directory[];
	enableGzip: boolean;

	fileDataCache: FileDataCache;
	getCacheBustedPath: (filePath: string) => string;

	execute: MiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options: CreateOptions): CreateResult
{
	const staticMiddleware: CreateResult =
	{
		cacheControlHeader: options.cacheControlHeader ?? "public, max-age=0",
		directories: options.directories,
		enableGzip: options.enableGzip ?? true,

		fileDataCache: {},
		getCacheBustedPath: (filePath) =>
		{
			const file = staticMiddleware.fileDataCache[filePath];

			if (file != null)
			{
				return filePath + "?mtime=" + file.rawStats.mtimeMs;
			}

			for (const directory of staticMiddleware.directories)
			{
				if (directory.mountPath != null)
				{
					if (!filePath.startsWith(directory.mountPath))
					{
						continue;
					}

					filePath = filePath.slice(directory.mountPath.length);
				}

				const onDiskPath = path.join(directory.path, filePath);

				try
				{
					const stats = fs.statSync(onDiskPath);

					let modifiedTimestamp = stats.mtime.getTime();

					return filePath + "?mtime=" + modifiedTimestamp.toString();
				}
				catch (error)
				{
					// Note: Doesn't matter if this fails, that just means it doesn't exist.
				}
			}

			return filePath;
		},

		execute: async (context, next) =>
		{
			//
			// Check Method
			//

			if (context.fritterRequest.getHttpMethod() != "GET" && context.fritterRequest.getHttpMethod() != "HEAD")
			{
				return await next();
			}

			//
			// Get Path
			//

			// Note: Uses posix, even on Windows, so paths always use forward slashes.
			let requestedFilePath = path.posix.normalize(decodeURIComponent(context.fritterRequest.getPath() + "?" + context.fritterRequest.getSearchParams().toString()));

			if (path.basename(requestedFilePath) == ".")
			{
				return await next();
			}

			//
			// Get File Data from Cache
			//

			let file = staticMiddleware.fileDataCache[requestedFilePath];

			//
			// Load File Data (if not cached)
			//

			if (file == null)
			{
				//
				// Iterate Directories
				//

				for (const directory of staticMiddleware.directories)
				{
					//
					// Handle Mount Point
					//

					if (directory.mountPath != null)
					{
						if (!requestedFilePath.startsWith(directory.mountPath))
						{
							continue;
						}

						requestedFilePath = requestedFilePath.slice(directory.mountPath.length);
					}

					//
					// Build File Path
					//

					const onDiskFilePath = path.join(directory.path, requestedFilePath);

					//
					// Prevent Directory Traversal
					//

					if (!onDiskFilePath.startsWith(directory.path))
					{
						return await next();
					}

					//
					// Get File Stats
					//

					let stats: fs.Stats;

					try
					{
						stats = await fs.promises.stat(onDiskFilePath);
					}
					catch (error)
					{
						continue;
					}

					if (!stats.isFile())
					{
						continue;
					}

					//
					// Create File Data
					//

					file =
					{
						onDiskFilePath,
						modifiedDate: stats.mtime,
						size: stats.size,
						rawStats: stats,
						type: mimeTypes.lookup(onDiskFilePath) || "application/octet-stream",
					};

					staticMiddleware.fileDataCache[requestedFilePath] = file;

					break;
				}

				if (file == null)
				{
					return await next();
				}
			}

			//
			// Check On Disk File Modified Date
			//

			const stats = await fs.promises.stat(file.onDiskFilePath);

			if (stats.mtimeMs != file.rawStats.mtimeMs)
			{
				file.modifiedDate = stats.mtime;

				file.size = stats.size;

				file.rawStats = stats;

				file.type = mimeTypes.lookup(file.onDiskFilePath) || "application/octet-stream";
			}

			//
			// Response
			//

			context.fritterResponse.setStatusCode(200);

			context.fritterResponse.setLastModified(file.modifiedDate);

			if (staticMiddleware.enableGzip)
			{
				context.fritterResponse.appendVaryHeaderName("Accept-Encoding");
			}

			if (context.fritterRequest.isFresh())
			{
				context.fritterResponse.setStatusCode(304);

				return;
			}

			context.fritterResponse.setContentType(file.type);

			context.fritterResponse.setContentLength(file.size);

			context.fritterResponse.setHeaderValue("Cache-Control", staticMiddleware.cacheControlHeader);

			if (context.fritterRequest.getHttpMethod() == "HEAD")
			{
				return;
			}

			const readStream = fs.createReadStream(file.onDiskFilePath);

			context.fritterResponse.setBody(readStream);

			const acceptsGzip = context.fritterRequest.getAccepts().encoding("gzip") != null;

			const shouldGzip = staticMiddleware.enableGzip && file.size > 1024 && isCompressible(file.type);

			if (acceptsGzip && shouldGzip)
			{
				context.fritterResponse.removeHeaderValue("Content-Length");

				context.fritterResponse.setHeaderValue("Content-Encoding", "gzip");

				context.fritterResponse.setBody(readStream.pipe(zlib.createGzip()));
			}
			else
			{
				context.fritterResponse.setBody(readStream);
			}
		},
	};

	return staticMiddleware;
}
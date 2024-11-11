//
// Imports
//

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import isCompressible from "compressible";
import mimeTypes from "mime-types";

import type { FritterContext } from "../classes/FritterContext.js";

import type { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Types
//

export type FileDataCache = { [filePath : string] : File };

//
// Interfaces
//

export interface Directory
{
	mountPath? : string;

	path : string;
}

export interface File
{
	onDiskFilePath : string;

	modifiedDate : Date;

	size : number;

	stats : fs.Stats;

	type : string;
}

//
// Middleware
//

export interface MiddlewareFritterContext extends FritterContext
{

}

export interface CreateOptions
{
	cacheControlHeader? : string;

	dirs : Directory[];

	enableGzip? : boolean;

	maxAge? : number;
}

export interface CreateResult
{
	execute : MiddlewareFunction<MiddlewareFritterContext>;

	getCacheBustedPath : (filePath : string) => string;
}

export function create(options : CreateOptions) : CreateResult
{
	const cacheControlHeader = options.cacheControlHeader ?? "public, max-age=" + (options.maxAge ?? 0);

	const dirs = options.dirs;

	const enableGzip = options.enableGzip ?? true;

	const fileDataCache : FileDataCache = {};

	return {
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
			let requestedFilePath = path.posix.normalize(decodeURIComponent(context.fritterRequest.getPath()));

			if (path.basename(requestedFilePath) == ".")
			{
				return await next();
			}

			//
			// Get File Data from Cache
			//

			let file = fileDataCache[requestedFilePath];

			//
			// Load File Data (if not cached)
			//

			if (file == null)
			{
				//
				// Iterate Directories
				//

				for (const dir of dirs)
				{
					//
					// Handle Mount Point
					//

					if (dir.mountPath != null)
					{
						if (!requestedFilePath.startsWith(dir.mountPath))
						{
							continue;
						}

						requestedFilePath = requestedFilePath.slice(dir.mountPath.length);
					}

					//
					// Build File Path
					//

					const onDiskFilePath = path.join(dir.path, requestedFilePath);

					//
					// Prevent Directory Traversal
					//

					if (!onDiskFilePath.startsWith(dir.path))
					{
						return await next();
					}

					//
					// Get File Stats
					//

					let stats : fs.Stats;

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

							stats,

							type: mimeTypes.lookup(onDiskFilePath) || "application/octet-stream",
						};

					fileDataCache[requestedFilePath] = file;

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

			if (stats.mtimeMs != file.stats.mtimeMs)
			{
				file.modifiedDate = stats.mtime;

				file.size = stats.size;

				file.stats = stats;

				file.type = mimeTypes.lookup(file.onDiskFilePath) || "application/octet-stream";
			}

			//
			// Response
			//

			context.fritterResponse.setStatusCode(200);

			context.fritterResponse.setLastModified(file.modifiedDate);

			if (enableGzip)
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

			context.fritterResponse.setHeaderValue("Cache-Control", cacheControlHeader);

			if (context.fritterRequest.getHttpMethod() == "HEAD")
			{
				return;
			}

			const readStream = fs.createReadStream(file.onDiskFilePath);

			context.fritterResponse.setBody(readStream);

			const acceptsGzip = context.fritterRequest.getAccepts().encoding("gzip") != null;

			const shouldGzip = enableGzip && file.size > 1024 && isCompressible(file.type);

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
		getCacheBustedPath: (filePath) =>
		{
			const file = fileDataCache[filePath];

			if (file != null)
			{
				return filePath + "?mtime=" + file.stats.mtimeMs;
			}

			for (const dir of dirs)
			{
				if (dir.mountPath != null)
				{
					if (!filePath.startsWith(dir.mountPath))
					{
						continue;
					}

					filePath = filePath.slice(dir.mountPath.length);
				}

				const onDiskPath = path.join(dir.path, filePath);

				try
				{
					// HACK: Don't use statSync here
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
	};
}
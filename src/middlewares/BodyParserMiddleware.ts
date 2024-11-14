
//
// Imports
//

import fs from "node:fs";
import http from "node:http";

import Formidable from "formidable";
import mimeTypes from "mime-types";

import { FritterContext } from "../classes/FritterContext.js";
import { FritterFile } from "../classes/FritterFile.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Locals
//

async function getBody(incomingMessage: http.IncomingMessage)
{
	return new Promise<string>(
		(resolve, reject) =>
		{
			let body = "";

			incomingMessage.on("data", 
				(chunk) =>
				{
					body += chunk;
				});

			incomingMessage.on("error", () => reject(new Error("Failed to get IncomingMessage body.")));

			incomingMessage.on("end", () => resolve(body));
		});
}

async function formidableFileToFritterFile(formidableFile: Formidable.File): Promise<FritterFile>
{
	let mimeType = "application/octet-stream";

	if (formidableFile.originalFilename != null)
	{
		mimeType = mimeTypes.lookup(formidableFile.originalFilename) || "application/octet-stream";
	}

	const stats = await fs.promises.stat(formidableFile.filepath);

	return new FritterFile(
		{
			path: formidableFile.filepath,
			size: formidableFile.size,
			fileName: formidableFile.originalFilename ?? formidableFile.newFilename,
			mimeType,
			modifiedDate: stats.mtime,
		});
}

async function parseFormData(nodeRequest: http.IncomingMessage, formidableOptions: Formidable.Options): Promise<RequestBody>
{
	const formidable = Formidable(formidableOptions);

	const [ formidableFields, formidableFiles ] = await formidable.parse(nodeRequest);

	const fields: Record<string, string | string[]> = {};

	for (const [ key, value ] of Object.entries(formidableFields))
	{
		if (value == null || value.length == 0)
		{
			continue;
		}

		if (value.length == 1)
		{
			fields[key] = value[0]!;
		}
		else
		{
			fields[key] = value;
		}
	}

	const files: Record<string, FritterFile | FritterFile[]> = {};

	for (const [ key, value ] of Object.entries(formidableFiles))
	{
		if (value == null)
		{
			continue;
		}

		if (value.length == 1)
		{
			files[key] = await formidableFileToFritterFile(value[0]!);
		}
		else
		{
			const fritterFiles: FritterFile[] = [];

			for (const file of value)
			{
				const fritterFile = await formidableFileToFritterFile(file);

				fritterFiles.push(fritterFile);
			}

			files[key] = fritterFiles;
		}
	}
	
	return {
		...fields,
		...files,
	};
}

async function parseJson(nodeRequest: http.IncomingMessage): Promise<RequestBody>
{
	const bodyString = await getBody(nodeRequest);

	const bodyData = JSON.parse(bodyString);

	if (bodyData == null || typeof bodyData !== "object" || Array.isArray(bodyData))
	{
		throw new Error("Invalid JSON body.");
	}

	return bodyData;
}

//
// Types
//

export type RequestBody = Record<string, unknown>;

//
// Create Function
//

export type MiddlewareFritterContext = FritterContext &
{
	getRequestBody: () => Promise<RequestBody>;
};

export type CreateOptions =
{
	formidableOptions?: Formidable.Options;
};

export type CreateResult =
{
	formidableOptions: Formidable.Options;

	execute: MiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options: CreateOptions = {}): CreateResult
{
	const bodyParserMiddleware: CreateResult =
	{
		formidableOptions: options.formidableOptions ?? {},

		execute: async (context, next) =>
		{
			let requestBody: RequestBody | null = null;

			context.getRequestBody = async () =>
			{
				if (requestBody != null)
				{
					return requestBody;
				}

				const contentType = context.fritterRequest.getContentType();

				switch (contentType)
				{
					case "application/x-www-form-urlencoded":
					case "multipart/form-data":
					{
						requestBody = await parseFormData(context.fritterRequest.nodeRequest, bodyParserMiddleware.formidableOptions);

						break;
					}

					case "application/json":
					{
						requestBody = await parseJson(context.fritterRequest.nodeRequest);

						break;
					}

					default:
					{
						requestBody = {};

						break;
					}
				}

				return requestBody;
			};

			await next();
		},
	};

	return bodyParserMiddleware;
}

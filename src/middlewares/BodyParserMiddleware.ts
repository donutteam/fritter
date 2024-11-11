
//
// Imports
//

import { IncomingMessage } from "node:http";

import Formidable from "formidable";

import { FritterContext } from "../classes/FritterContext.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Locals
//

async function getBody(incomingMessage: IncomingMessage)
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

async function parseFormData(nodeRequest: IncomingMessage, formidableOptions: Formidable.Options): Promise<RequestBody>
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

	const files: Record<string, File | File[]> = {};

	for (const [ key, value ] of Object.entries(formidableFiles))
	{
		if (value == null)
		{
			continue;
		}

		if (value.length == 1)
		{
			files[key] = new File(value[0]!);
		}
		else
		{
			files[key] = value.map((file) => new File(file));
		}
	}
	
	return {
		...fields,
		...files,
	};
}

async function parseJson(nodeRequest: IncomingMessage): Promise<RequestBody>
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
// Classes
//

export class File
{
	path: string;
	
	size: number;

	originalFileName: string | null;

	newFileName: string;

	mimeType: string | null;

	modifiedDate: Date | null;

	constructor(formidableFile: Formidable.File)
	{
		this.path = formidableFile.filepath;

		this.size = formidableFile.size;

		this.originalFileName = formidableFile.originalFilename;

		this.newFileName = formidableFile.newFilename;

		this.mimeType = formidableFile.mimetype;

		this.modifiedDate = formidableFile.mtime ?? null;
	}
}

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
						return await parseFormData(context.fritterRequest.nodeRequest, bodyParserMiddleware.formidableOptions);
					}

					case "application/json":
					{
						return await parseJson(context.fritterRequest.nodeRequest);
					}

					default:
					{
						return {};
					}
				}
			};

			await next();
		},
	};

	return bodyParserMiddleware;
}

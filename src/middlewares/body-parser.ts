//
// Imports
//

import type { IncomingMessage } from "node:http";

import Formidable from "formidable";

import type { FritterContext } from "../classes/FritterContext.js";

import type { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";
import type { PossibleJsonData } from "../types/PossibleJsonData.js";

//
// Types
//

export type OnBodyParseErrorCallback = (context : FritterContext, error : unknown) => void;

//
// Interfaces
//

export interface CreateOptions
{
	formidableOptions? : Formidable.Options;

	onBodyParseError? : OnBodyParseErrorCallback;
}

export interface ParsedBody
{
	fields : { [key : string] : PossibleJsonData };

	fieldArrays : { [key : string] : PossibleJsonData[] };

	files : { [key : string] : Formidable.File };

	fileArrays : { [key : string] : Formidable.File[] };

	rawJson : string | null;
}

export interface MiddlewareFritterContext extends FritterContext
{
	parsedBody : ParsedBody;
}

//
// Create Function
//

export function create(options : CreateOptions) : FritterMiddlewareFunction<MiddlewareFritterContext>
{
	return async (context, next) =>
	{
		const formidableOptions = options.formidableOptions ?? {};

		const onBodyParseError = options.onBodyParseError ?? null;

		const contentType = context.fritterRequest.getContentType();

		switch (contentType)
		{
			case "application/x-www-form-urlencoded":
			case "multipart/form-data":
			{
				context.parsedBody = await parseFormData(
					{
						context,
						formidableOptions,
						onBodyParseError,
					});

				break;
			}

			case "application/json":
			{
				context.parsedBody = await parseJson(
					{
						context,
						formidableOptions,
						onBodyParseError,
					});

				break;
			}

			default:
			{
				context.parsedBody =
					{
						fields: {},
						fieldArrays: {},
						files: {},
						fileArrays: {},
						rawJson: null,
					};

				break;
			}
		}

		await next();
	};
}

//
// Internals
//

async function getBody(incomingMessage : IncomingMessage) : Promise<string>
{
	return new Promise((resolve, reject) =>
	{
		let body = "";

		incomingMessage.on("data", (chunk) =>
		{
			body += chunk;
		});

		incomingMessage.on("error", () =>
		{
			reject(new Error("Failed to get IncomingMessage body."));
		});

		incomingMessage.on("end", () =>
		{
			resolve(body);
		});
	});
}

interface ParseOptions
{
	context : FritterContext;

	formidableOptions : Formidable.Options;

	onBodyParseError : OnBodyParseErrorCallback | null;
}

async function parseFormData(options : ParseOptions) : Promise<ParsedBody>
{
	const body : ParsedBody =
		{
			fields: {},
			fieldArrays: {},
			files: {},
			fileArrays: {},
			rawJson: null,
		};

	let fields : Formidable.Fields = {};

	let files : Formidable.Files = {};

	try
	{
		const formidable = Formidable(options.formidableOptions);

		[ fields, files ] = await formidable.parse(options.context.nodeRequest);
	}
	catch (error)
	{
		if (options.onBodyParseError != null)
		{
			options.onBodyParseError(options.context, error);
		}

		return body;
	}

	for (const [ key, value ] of Object.entries(fields))
	{
		// Note: Upgrading from @types/formidable@3.4.0 to @types/formidable@3.4.4
		//	introduces a possible "undefined" here? I'm not sure why, but this
		//	check is needed now according to the type defs...
		if (value == undefined)
		{
			continue;
		}

		if (Array.isArray(value))
		{
			body.fields[key] = value[0] ?? null;
			body.fieldArrays[key] = value;
		}
		else
		{
			body.fields[key] = value;
			body.fieldArrays[key] = [ value ];
		}
	}

	for (const [ key, value ] of Object.entries(files))
	{
		// See above note when iterating fields
		if (value == undefined)
		{
			continue;
		}

		if (Array.isArray(value))
		{
			// Note: this used to be type cast value[0] as Formidable.File but this seems cleaner
			if (value[0] == undefined)
			{
				continue;
			}

			body.files[key] = value[0];
			body.fileArrays[key] = value;
		}
		else
		{
			body.files[key] = value;
			body.fileArrays[key] = [ value ];
		}
	}

	return body;
}

async function parseJson(options : ParseOptions) : Promise<ParsedBody>
{
	const body : ParsedBody =
		{
			fields: {},
			fieldArrays: {},
			files: {},
			fileArrays: {},
			rawJson: null,
		};

	try
	{
		const bodyString = await getBody(options.context.nodeRequest);

		body.rawJson = bodyString;

		const bodyData = JSON.parse(bodyString) as PossibleJsonData;

		if (bodyData == null || typeof bodyData !== "object" || Array.isArray(bodyData))
		{
			return body;
		}

		for (const [ key, value ] of Object.entries(bodyData))
		{
			body.fields[key] = value;
			body.fieldArrays[key] = [ value ];
		}
	}
	catch (error)
	{
		if (options.onBodyParseError != null)
		{
			options.onBodyParseError(options.context, error);
		}
	}

	return body;
}
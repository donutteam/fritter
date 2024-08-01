//
// Imports
//

import type { FritterContext } from "../classes/FritterContext.js";

import type { MiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

import { z } from "zod";

//
// Schemas
//

export const NoticeSchema = z.object(
	{
		type: z.enum([ "danger", "info", "success", "warning" ]),
		message: z.string(),
	});

//
// Types
//

export type Notice = z.infer<typeof NoticeSchema>;

//
// Interfaces
//

export interface MiddlewareFritterContext extends FritterContext
{
	noticeManager : NoticeManager;
}

//
// Classes
//

export interface NoticeManagerOptions
{
	context : MiddlewareFritterContext;

	cookieName : string;
}

export class NoticeManager
{
	public notices : Notice[] = [];

	public constructor(options : NoticeManagerOptions)
	{
		const rawNoticesCookie = options.context.cookies.get(options.cookieName);

		if (rawNoticesCookie != null)
		{
			const decodedNotices = decodeURIComponent(rawNoticesCookie);

			try
			{
				const parsedCookie = JSON.parse(decodedNotices);

				if (Array.isArray(parsedCookie))
				{
					for (const item of parsedCookie)
					{
						const noticeSchemaParseResult = NoticeSchema.safeParse(item);

						if (noticeSchemaParseResult.success)
						{
							const notice = noticeSchemaParseResult.data;

							this.notices.push(notice);
						}
					}
				}
				else
				{
					this.notices = [];
				}
			}
			catch (error)
			{
				this.notices = [];
			}
		}
	}

	public add(notice : Notice)
	{
		this.notices.push(notice);
	}

	public removeAll()
	{
		this.notices = [];
	}
}

//
// Create Function
//

export interface CreateOptions
{
	cookieDomain : string;

	cookieName : string;
}

export interface CreateResult
{
	execute : MiddlewareFunction<MiddlewareFritterContext>;
}

export function create(options : CreateOptions) : CreateResult
{
	const cookieDomain = options.cookieDomain;

	const cookieName = options.cookieName;

	return {
		execute: async (context, next) =>
		{
			context.noticeManager = new NoticeManager(
				{
					context,
					cookieName,
				});

			await next();

			const stringifiedNotices = JSON.stringify(context.noticeManager.notices);

			const encodedNotices = encodeURIComponent(stringifiedNotices);

			context.cookies.set(cookieName, encodedNotices,
				{
					domain: cookieDomain,
					httpOnly: true,
					secure: false,
				});
		},
	};
}
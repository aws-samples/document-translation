import TurndownService from "turndown";

export const handler = async (event: { html: string }): Promise<string> => {
	const turndownService = new TurndownService({
		headingStyle: "atx",
		codeBlockStyle: "fenced",
		bulletListMarker: "-",
	});
	const markdown = turndownService.turndown(event.html);
	return markdown;
};

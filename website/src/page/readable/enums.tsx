export const ItemValues: Record<string, string> = {
	TEXT: "text",
	IMAGE: "image",
	METADATA: "metadata",
};

export const ItemStatus: Record<string, string> = {
	PROCESSING: "processing",
	COMPLETED: "completed",
	UPDATED: "updated",
	GENERATE: "generate",
	FAILED_UNRECOGNISEDMODEL: "failed_unrecognisedModel",
};

export const ItemKeys: Record<string, string> = {
	CREATEDAT: "createdAt",
	ID: "id",
	IDENTITY: "identity",
	INPUT: "input",
	ITEMID: "itemId",
	MODELID: "modelId",
	NAME: "name",
	ORDER: "order",
	OUTPUT: "output",
	PARENT: "parent",
	STATUS: "status",
	TYPE: "type",
	UPDATEDAT: "updatedAt",
};

export const PrintStyles: Record<string, string> = {
	TABLEWITHIMAGELEFT: "tableWithImageLeft",
	TABLEWITHIMAGERIGHT: "tableWithImageRight",
	TABLEWITHIMAGEALTERNATINGSIDE: "tableWithImageAlternatingSide",
};

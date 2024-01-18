// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export enum Feature {
	PREFIX = "readable",
}

export enum JobTable {
	PK = "id",
	SK = "itemId",
	SK_METADATA = "metadata",
	STATUS_KEY = "status",
	GSI_OWNER = "byOwnerAndUpdatedAt",
	GSI_OWNER_PK = "owner",
	GSI_OWNER_SK = "updatedAt",
	GSI_OWNER_ATTR_NAME = "name",
	GSI_OWNER_ATTR_CREATEDAT = "createdAt",
}

export enum ItemStatus {
	PROCESSING = "processing",
	COMPLETED = "completed",
	UPDATED = "updated",
	GENERATE = "generate",
	FAILED_UNRECOGNISEDMODEL = "failed_unrecognisedModel",
}

export enum ItemType {
	TEXT = "text",
	IMAGE = "image",
}

export enum Bucket {
	PREFIX_PRIVATE = "private",
}

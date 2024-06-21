import { fetchAuthSession } from "@aws-amplify/auth";

import { S3KeyTypes } from "../enums";
import { prepareS3Key } from "./prepareS3Key";

jest.mock("@aws-amplify/auth", () => ({
	fetchAuthSession: jest.fn(),
}));

describe("prepareS3Key", () => {
	test("prepares S3 key correctly for different key types", async () => {
		(fetchAuthSession as jest.Mock).mockResolvedValueOnce({
			idToken: "token123",
		});

		const key1 = await prepareS3Key({
			key: "objectKey",
			keyType: S3KeyTypes.OBJECT,
		});
		expect(key1).toBe("private/undefined/objectKey");

		const key2 = await prepareS3Key({
			key: "user/objectKey",
			keyType: S3KeyTypes.USER_OBJECT,
		});
		expect(key2).toBe("private/user/objectKey");

		const key3 = await prepareS3Key({
			key: "scope/user/objectKey",
			keyType: S3KeyTypes.SCOPE_USER_OBJECT,
		});
		expect(key3).toBe("scope/user/objectKey");

		const key4 = await prepareS3Key({
			key: "scope/user/objectKey",
			keyType: "foobar",
		});
		expect(key4).toBeInstanceOf(Error);
	});
});

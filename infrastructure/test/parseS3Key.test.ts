// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const LambdaTester = require("lambda-tester");

const myHandler = require("../lambda/parseS3Key/index").handler;

describe("handler", function () {
	const newUploadOject = {
		eventVersion: "2.0",
		eventSource: "aws:s3",
		awsRegion: "us-east-1",
		eventTime: "1970-01-01T00:00:00.000Z",
		eventName: "ObjectCreated:Put",
		userIdentity: {
			principalId: "EXAMPLE",
		},
		requestParameters: {
			sourceIPAddress: "127.0.0.1",
		},
		responseElements: {
			"x-amz-request-id": "EXAMPLE123456789",
			"x-amz-id-2":
				"EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
		},
		s3: {
			s3SchemaVersion: "1.0",
			configurationId: "testConfigRule",
			bucket: {
				name: "example-bucket",
				ownerIdentity: {
					principalId: "EXAMPLE",
				},
				arn: "arn:aws:s3:::example-bucket",
			},
			object: {
				key: "private/cognitoId/jobId/upload/newUploadOject.ext",
				size: 1024,
				eTag: "0123456789abcdef0123456789abcdef",
				sequencer: "0A1B2C3D4E5F678901",
			},
		},
	};
	it("test success new upload object", async function () {
		await LambdaTester(myHandler)
			.event(newUploadOject)
			.expectResult((result) => {
				expect(result.permissionScope).toEqual("private");
				expect(result.cognitoId).toEqual("cognitoId");
				expect(result.jobId).toEqual("jobId");
				expect(result.stage).toEqual("upload");
				expect(result.type).toEqual("upload");
				expect(result.filenameFull).toEqual("newUploadOject.ext");
			});
	});

	const newTempOject = {
		eventVersion: "2.0",
		eventSource: "aws:s3",
		awsRegion: "us-east-1",
		eventTime: "1970-01-01T00:00:00.000Z",
		eventName: "ObjectCreated:Put",
		userIdentity: {
			principalId: "EXAMPLE",
		},
		requestParameters: {
			sourceIPAddress: "127.0.0.1",
		},
		responseElements: {
			"x-amz-request-id": "EXAMPLE123456789",
			"x-amz-id-2":
				"EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
		},
		s3: {
			s3SchemaVersion: "1.0",
			configurationId: "testConfigRule",
			bucket: {
				name: "example-bucket",
				ownerIdentity: {
					principalId: "EXAMPLE",
				},
				arn: "arn:aws:s3:::example-bucket",
			},
			object: {
				key: "private/cognitoId/jobId/output/.write_access_check_file.temp",
				size: 1024,
				eTag: "0123456789abcdef0123456789abcdef",
				sequencer: "0A1B2C3D4E5F678901",
			},
		},
	};
	it("test success new temp object", async function () {
		await LambdaTester(myHandler)
			.event(newTempOject)
			.expectResult((result) => {
				expect(result.permissionScope).toEqual("private");
				expect(result.cognitoId).toEqual("cognitoId");
				expect(result.jobId).toEqual("jobId");
				expect(result.stage).toEqual("output");
				expect(result.type).toEqual("temp");
				expect(result.filenameFull).toEqual(".write_access_check_file.temp");
			});
	});

	const newDetailsOject = {
		eventVersion: "2.0",
		eventSource: "aws:s3",
		awsRegion: "us-east-1",
		eventTime: "1970-01-01T00:00:00.000Z",
		eventName: "ObjectCreated:Put",
		userIdentity: {
			principalId: "EXAMPLE",
		},
		requestParameters: {
			sourceIPAddress: "127.0.0.1",
		},
		responseElements: {
			"x-amz-request-id": "EXAMPLE123456789",
			"x-amz-id-2":
				"EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
		},
		s3: {
			s3SchemaVersion: "1.0",
			configurationId: "testConfigRule",
			bucket: {
				name: "example-bucket",
				ownerIdentity: {
					principalId: "EXAMPLE",
				},
				arn: "arn:aws:s3:::example-bucket",
			},
			object: {
				key: "private/cognitoId/jobId/output/accountId-TranslateText-translateId/details/xx.auxiliary-translation-details.json",
				size: 1024,
				eTag: "0123456789abcdef0123456789abcdef",
				sequencer: "0A1B2C3D4E5F678901",
			},
		},
	};
	it("test success new details object", async function () {
		await LambdaTester(myHandler)
			.event(newDetailsOject)
			.expectResult((result) => {
				expect(result.permissionScope).toEqual("private");
				expect(result.cognitoId).toEqual("cognitoId");
				expect(result.jobId).toEqual("jobId");
				expect(result.stage).toEqual("output");
				expect(result.type).toEqual("details");
				expect(result.filenameFull).toEqual(
					"xx.auxiliary-translation-details.json",
				);
				expect(result.language).toEqual("xx");
			});
	});

	const newOutputOject = {
		eventVersion: "2.0",
		eventSource: "aws:s3",
		awsRegion: "us-east-1",
		eventTime: "1970-01-01T00:00:00.000Z",
		eventName: "ObjectCreated:Put",
		userIdentity: {
			principalId: "EXAMPLE",
		},
		requestParameters: {
			sourceIPAddress: "127.0.0.1",
		},
		responseElements: {
			"x-amz-request-id": "EXAMPLE123456789",
			"x-amz-id-2":
				"EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
		},
		s3: {
			s3SchemaVersion: "1.0",
			configurationId: "testConfigRule",
			bucket: {
				name: "example-bucket",
				ownerIdentity: {
					principalId: "EXAMPLE",
				},
				arn: "arn:aws:s3:::example-bucket",
			},
			object: {
				key: "private/cognitoId/jobId/output/accountId-TranslateText-translateId/yy.fileName.ext",
				size: 1024,
				eTag: "0123456789abcdef0123456789abcdef",
				sequencer: "0A1B2C3D4E5F678901",
			},
		},
	};
	it("test success new output object", async function () {
		await LambdaTester(myHandler)
			.event(newOutputOject)
			.expectResult((result) => {
				expect(result.permissionScope).toEqual("private");
				expect(result.cognitoId).toEqual("cognitoId");
				expect(result.jobId).toEqual("jobId");
				expect(result.stage).toEqual("output");
				expect(result.type).toEqual("output");
				expect(result.filenameFull).toEqual("yy.fileName.ext");
				expect(result.language).toEqual("yy");
			});
	});

	const newFailObject = {
		eventVersion: "2.0",
		eventSource: "aws:s3",
		awsRegion: "us-east-1",
		eventTime: "1970-01-01T00:00:00.000Z",
		eventName: "ObjectCreated:Put",
		userIdentity: {
			principalId: "EXAMPLE",
		},
		requestParameters: {
			sourceIPAddress: "127.0.0.1",
		},
		responseElements: {
			"x-amz-request-id": "EXAMPLE123456789",
			"x-amz-id-2":
				"EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
		},
		s3: {
			s3SchemaVersion: "1.0",
			configurationId: "testConfigRule",
			bucket: {
				name: "example-bucket",
				ownerIdentity: {
					principalId: "EXAMPLE",
				},
				arn: "arn:aws:s3:::example-bucket",
			},
			object: {
				key: "fail/file/key.foobar",
				size: 1024,
				eTag: "0123456789abcdef0123456789abcdef",
				sequencer: "0A1B2C3D4E5F678901",
			},
		},
	};
	it("test success new output object", async function () {
		await LambdaTester(myHandler).event(newFailObject).expectError();
	});
});

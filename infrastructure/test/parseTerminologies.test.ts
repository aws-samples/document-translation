// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import LambdaTester from "lambda-tester";
import { handler as myHandler } from "../lambda/parseTerminologies/index";

interface Terminology {
	Arn: string;
	CreatedAt: string;
	Directionality: string;
	Format: string;
	LastUpdatedAt: string;
	Name: string;
	SizeBytes: number;
	SourceLanguageCode: string;
	TargetLanguageCodes: string[];
	TermCount: number;
}

interface EventObject {
	terminologies: Terminology[];
}

describe("handler", function () {
	it("test success empty", async function () {
		await LambdaTester(myHandler)
			.event({ terminologies: [] } as EventObject)
			.expectResult((result) => {
				expect(result).toEqual(expect.arrayContaining([]));
			});
	});

	const singleTerminology: EventObject = {
		terminologies: [
			{
				Arn: "arn:aws:translate:eu-west-2:006919394233:terminology/es/LATEST",
				CreatedAt: "2022-11-29T16:35:43.069Z",
				Directionality: "UNI",
				Format: "CSV",
				LastUpdatedAt: "2022-11-29T16:35:43.191Z",
				Name: "es",
				SizeBytes: 55,
				SourceLanguageCode: "en",
				TargetLanguageCodes: ["es"],
				TermCount: 1,
			},
		],
	};
	it("test success single", async function () {
		await LambdaTester(myHandler)
			.event(singleTerminology)
			.expectResult((result) => {
				expect(result).toEqual(expect.arrayContaining(["es"]));
			});
	});

	const multiTerminology: EventObject = {
		terminologies: [
			{
				Arn: "arn:aws:translate:eu-west-2:123456789012:terminology/es/LATEST",
				CreatedAt: "2022-11-29T16:35:43.069Z",
				Directionality: "UNI",
				Format: "CSV",
				LastUpdatedAt: "2022-11-29T16:35:43.191Z",
				Name: "es",
				SizeBytes: 55,
				SourceLanguageCode: "en",
				TargetLanguageCodes: ["es"],
				TermCount: 1,
			},
			{
				Arn: "arn:aws:translate:eu-west-2:123456789012:terminology/fr/LATEST",
				CreatedAt: "2022-11-29T16:35:43.069Z",
				Directionality: "UNI",
				Format: "CSV",
				LastUpdatedAt: "2022-11-29T16:35:43.191Z",
				Name: "fr",
				SizeBytes: 55,
				SourceLanguageCode: "en",
				TargetLanguageCodes: ["fr"],
				TermCount: 1,
			},
		],
	};
	it("test success multi", async function () {
		await LambdaTester(myHandler)
			.event(multiTerminology)
			.expectResult((result) => {
				expect(result).toEqual(expect.arrayContaining(["fr", "es"]));
			});
	});
});

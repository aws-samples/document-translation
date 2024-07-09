// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

import { aws_stepfunctions as sfn } from "aws-cdk-lib";
import { dt_stepfunction } from "../../components/stepfunction";

export interface props {
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_parseS3Key extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// KEY SPLIT POSSIBLE STRUCTURES
		// private/<cognitoId>/<jobId>/upload/<fileName.ext>
		// private/<cognitoId>/<jobId>/output/.write_access_check_file.temp
		// private/<cognitoId>/<jobId>/output/<accountId>-TranslateText-<translateId>/details/<lang>.auxiliary-translation-details.json
		// private/<cognitoId>/<jobId>/output/<accountId>-TranslateText-<translateId>/<lang>.<fileName.ext>
		// 0      / 1         / 2     / 3    / 4                                     / 5     / 6
		//
		// Test Examples
		// "private/xxx_cognitoId_xxx/yyy_jobId_yyy/upload/Document+name.docx"
		// "private/xxx_cognitoId_xxx/yyy_jobId_yyy/output/.write_access_check_file.temp"
		// "private/xxx_cognitoId_xxx/yyy_jobId_yyy/output/12456789012-TranslateText-zzz_translateId_zzz/details/ar.auxiliary-translation-details.json"
		// "private/xxx_cognitoId_xxx/yyy_jobId_yyy/output/12456789012-TranslateText-zzz_translateId_zzz/ar.Document+name.docx"

		// GENERAL
		const general_segmentKey = new sfn.Pass(this, "general_segmentKey", {
			parameters: {
				segmentKey: sfn.JsonPath.stringSplit(
					sfn.JsonPath.stringAt("$.key"),
					"/",
				),
			},
		});

		const general_setScopeToStage = new sfn.Pass(
			this,
			"general_setScopeToStage",
			{
				parameters: {
					scope: { value: sfn.JsonPath.stringAt("$.segmentKey[0]") },
					cognitoId: { value: sfn.JsonPath.stringAt("$.segmentKey[1]") },
					jobId: { value: sfn.JsonPath.stringAt("$.segmentKey[2]") },
					stage: { value: sfn.JsonPath.stringAt("$.segmentKey[3]") },
				},
				resultPath: "$.result",
			},
		);

		// CHOICE | STAGE
		const general_choiceIsStageType = new sfn.Choice(
			this,
			"general_choiceIsStageType",
		);
		const stageIsUploadCondition = sfn.Condition.stringEquals(
			"$.result.stage.value",
			"upload",
		);
		const stageIsOutputCondition = sfn.Condition.stringEquals(
			"$.result.stage.value",
			"output",
		);
		const failUndeterminedStage = new sfn.Fail(this, "failUndeterminedStage", {
			error: "Undetermined stage in key",
			cause: 'Stage does not match "upload" or "output"',
		});

		// UPLOAD
		const upload_setFileName = new sfn.Pass(this, "upload_setFileName", {
			resultPath: "$.result.fileName",
			parameters: {
				value: sfn.JsonPath.stringAt("$.segmentKey[4]"),
			},
		});

		// OUTPUT
		// OUTPUT | CHOICE | ACCESS CHECK
		const output_choiceIsAccessCheck = new sfn.Choice(
			this,
			"output_choiceIsAccessCheck",
		);
		const output_fileIsAccessCheckCondition = sfn.Condition.stringEquals(
			"$.segmentKey[4]",
			".write_access_check_file.temp",
		);
		const output_fileIsAccessCheckEnd = new sfn.Succeed(
			this,
			"output_fileIsAccessCheckEnd",
			{
				comment: "File is service access check file. End.",
			},
		);

		// OUTPUT | JOB FOLDER
		const upload_setJobFolder = new sfn.Pass(this, "upload_setJobFolder", {
			resultPath: "$.result.jobFolder",
			parameters: {
				value: sfn.JsonPath.stringAt("$.segmentKey[4]"),
			},
		});

		// // OUTPUT | CHOICE | DETAILS
		const output_choiceIsDetails = new sfn.Choice(
			this,
			"output_choiceIsDetails",
		);
		const output_fileIsDetailsCondition = sfn.Condition.stringEquals(
			"$.segmentKey[5]",
			"details",
		);
		const output_details_setFileName = new sfn.Pass(
			this,
			"output_details_setFileName",
			{
				resultPath: "$.result.fileName",
				parameters: {
					value: sfn.JsonPath.stringAt("$.segmentKey[6]"),
				},
			},
		);

		// // OUTPUT | CHOICE | TRANSLATION
		const output_translation_setFileName = new sfn.Pass(
			this,
			"output_translation_setFileName",
			{
				resultPath: "$.result.fileName",
				parameters: {
					value: sfn.JsonPath.stringAt("$.segmentKey[5]"),
				},
			},
		);
		const output_translation_segmentFileName = new sfn.Pass(
			this,
			"output_translation_segmentFileName",
			{
				parameters: {
					value: sfn.JsonPath.stringSplit(
						sfn.JsonPath.stringAt("$.result.fileName.value"),
						".",
					),
				},
				resultPath: "$.segmentFileName",
			},
		);
		const output_translation_setLanguage = new sfn.Pass(
			this,
			"output_translation_setLanguage",
			{
				resultPath: "$.result.language",
				parameters: {
					value: sfn.JsonPath.stringAt("$.segmentFileName[0]"),
				},
			},
		);

		// RESULT
		const result = new sfn.Pass(this, "result", {
			parameters: {
				result: sfn.JsonPath.stringAt("$.result"),
			},
		});

		// EVENT HANDLER | STEP FUNCTION | STATE MACHINE
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationParseS3Key`,
			{
				nameSuffix: "TranslationParseS3Key",
				removalPolicy: props.removalPolicy,

				definition: general_segmentKey.next(general_setScopeToStage).next(
					general_choiceIsStageType
						.when(stageIsUploadCondition, upload_setFileName)
						.when(
							stageIsOutputCondition,
							output_choiceIsAccessCheck
								.when(
									output_fileIsAccessCheckCondition,
									output_fileIsAccessCheckEnd,
								)
								.otherwise(
									upload_setJobFolder.next(
										output_choiceIsDetails
											.when(
												output_fileIsDetailsCondition,
												output_details_setFileName,
											)
											.otherwise(
												output_translation_setFileName
													.next(output_translation_segmentFileName)
													.next(output_translation_setLanguage),
											),
									),
								),
						)
						.otherwise(failUndeterminedStage)
						.afterwards()
						.next(result),
				),
			},
		).StateMachine;

		// END
	}
}

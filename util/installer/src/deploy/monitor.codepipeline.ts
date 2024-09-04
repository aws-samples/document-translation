import {
	CloudFormationClient,
	DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

import {
	CodePipelineClient,
	GetPipelineStateCommand,
} from "@aws-sdk/client-codepipeline";

const getCodepipelineStatus = async (pipeline: string, region: string) => {
	const client = new CodePipelineClient();
	const command = new GetPipelineStateCommand({ name: pipeline });
	const response = await client.send(command);

	const checkForStatus = (status: string, payload: any) => {
		return payload.stageStates?.filter(
			(stage: any) => stage.latestExecution?.status === status
		);
	};

	const stagesInProgress = checkForStatus("InProgress", response);
	const stagesFailed = checkForStatus("Failed", response);

	if (stagesInProgress.length > 0) {
		if (stagesInProgress[0].stageName === "ManualApproval_PreSynth") {
			console.log(`
A manual approval is awaiting your approval to carry on with the installation pipeline.
https://${region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline}/view?region=${region}
			`);
			return {
				complete: false,
				message: `Pipeline is in progress: Stage '${stagesInProgress[0].stageName}' is '${stagesInProgress[0].latestExecution?.status}'`,
			};
		}

		return {
			complete: false,
			message: `Pipeline is in progress: Stage '${stagesInProgress[0].stageName}' is '${stagesInProgress[0].latestExecution?.status}'`,
		};
	}

	if (stagesInProgress.length === 0 && stagesFailed.length > 0) {
		throw new Error(
			`Pipeline may have failed: Stage '${stagesFailed[0].stageName}' is '${stagesFailed[0].latestExecution?.status}'`
		);
	}

	if (stagesInProgress.length === 0 && stagesFailed.length === 0) {
		return {
			complete: true,
			message: "Pipeline is complete",
		};
	}

	return {
		complete: false,
		message: "Unable to determine pipeline status",
	};
};

const getCfnOutput = async (stack: string) => {
	const client = new CloudFormationClient();
	const command = new DescribeStacksCommand({ StackName: stack });
	const response = await client.send(command);
	const outputs = response.Stacks?.[0].Outputs;
	console.log("CloudFormation outputs:");
	console.log(outputs);
};

export const monitorCodepipeline = async (
	instanceName: string,
	outputsPath: string,
	region: string
) => {
	// load json file
	const fs = require("fs");
	const outputs = JSON.parse(await fs.readFileSync(outputsPath, "utf8"));
	const pipeline = outputs[`DocTran-${instanceName}-pipeline`].PipelineName;

	if (!pipeline) throw new Error("PipelineName required");
	console.log("pipeline", pipeline);

	console.log(
		"\nThe pipeline is now deploying the app. This can take up to 30 minutes. The status will be checked every 1 minute.\n"
	);

	let statusCompleteCount = 0;
	while (statusCompleteCount < 2) {
		await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
		console.log(
			new Date(Date.now()).toLocaleString(),
			" - Checking pipeline status...",
			pipeline
		);
		const status = await getCodepipelineStatus(pipeline, region);
		if (status.complete) {
			console.log(status.message);
			++statusCompleteCount;
			break;
		}
	}

	await getCfnOutput(`DocTran-${instanceName}-app`);
};

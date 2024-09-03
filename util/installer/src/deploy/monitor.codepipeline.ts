import {
	CloudFormationClient,
	ListStacksCommand,
	ListStackResourcesCommand,
	DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

import {
	CodePipelineClient,
	GetPipelineStateCommand,
} from "@aws-sdk/client-codepipeline";

const client = new CloudFormationClient();
const findStack = async (suffix: string) => {
	const command = new ListStacksCommand({});
	const response = await client.send(command);
	const foundStack = response.StackSummaries?.find((stack) => {
		return (
			stack.StackName?.startsWith("DocTran") &&
			stack.StackName?.endsWith(suffix)
		);
	});
	if (!foundStack) {
		throw new Error("No stack found");
	}
	return foundStack.StackName;
};

const findPipeline = async (stack: string) => {
	const command = new ListStackResourcesCommand({
		StackName: stack,
	});
	const response = await client.send(command);
	const foundResource = response.StackResourceSummaries?.find((resource) => {
		return resource.ResourceType === "AWS::CodePipeline::Pipeline";
	});
	if (!foundResource?.PhysicalResourceId) {
		throw new Error("No pipeline found");
	}
	return foundResource.PhysicalResourceId;
};

const getCodepipelineStatus = async (pipeline: string) => {
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

export const monitorCodepipeline = async () => {
	const stackName = await findStack("pipeline");
	if (!stackName) throw new Error("Stack required");
	const pipeline = await findPipeline(stackName);
	if (!pipeline) throw new Error("Pipeline required");

	console.log(
		"\nThe pipeline is now deploying the app. This can take up to 30 minutes. The status will be checked every 1 minute.\n"
	);
	let statusComplete = false;
	while (!statusComplete) {
		console.log(
			new Date(Date.now()).toLocaleString(),
			" - Checking pipeline status...",
			pipeline
		);
		const status = await getCodepipelineStatus(pipeline);
		statusComplete = status.complete;
		console.log(status.message);
		if (statusComplete) break;
		await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
	}

	const appStack = await findStack("app");
	if (!appStack) throw new Error("Stack required");
	await getCfnOutput(appStack);
};

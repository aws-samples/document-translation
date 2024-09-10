import {
	Macie2Client,
	EnableMacieCommand,
	EnableMacieCommandOutput,
	GetMacieSessionCommand,
	GetMacieSessionCommandOutput,
} from "@aws-sdk/client-macie2";
import {
	CloudWatchLogsClient,
	CreateLogGroupCommand,
	CreateLogGroupCommandOutput,
	DescribeLogGroupsCommand,
	DescribeLogGroupsCommandOutput,
} from "@aws-sdk/client-cloudwatch-logs";

const isMacieEnabled = async () => {
	const client = new Macie2Client({ region: process.env.AWS_REGION });
	try {
		const input = {};
		const command = new GetMacieSessionCommand(input);
		const response: GetMacieSessionCommandOutput = await client.send(command);
		if (response.status === "ENABLED") {
			return true;
		}
		return false;
	} catch (err) {
		// Do nothing
		// Expected to fail when Macie is not enabled
		return false;
	}
};

const enableMacie = async () => {
	const client = new Macie2Client({ region: process.env.AWS_REGION });
	try {
		const input = {};
		const command = new EnableMacieCommand(input);
		const response: EnableMacieCommandOutput = await client.send(command);
		return response;
	} catch (err) {
		console.log(err);
	}
};

const isLogGroupExists = async (logGroupName: string) => {
	const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION });
	try {
		const input = {
			logGroupNamePrefix: logGroupName,
		};
		const command = new DescribeLogGroupsCommand(input);
		const response: DescribeLogGroupsCommandOutput = await client.send(command);
		if (response.logGroups && response.logGroups.length > 0) {
			return true;
		}
		return false;
	} catch (err) {
		console.log(err);
	}
};

const createLogGroup = async (logGroupName: string) => {
	const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION });
	try {
		const input = {
			logGroupName: logGroupName,
		};
		const command = new CreateLogGroupCommand(input);
		const response: CreateLogGroupCommandOutput = await client.send(command);
		return response;
	} catch (err) {
		console.log(err);
	}
};

export const prereqTranslation = async () => {
	if (!(await isMacieEnabled())) {
		await enableMacie();
	}
	const logGroupName = "/aws/macie/classificationjobs";
	if (!(await isLogGroupExists(logGroupName))) {
		await createLogGroup(logGroupName);
	}
};

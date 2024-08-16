import { Macie2Client, EnableMacieCommand } from "@aws-sdk/client-macie2";
import {
	CloudWatchLogsClient,
	CreateLogGroupCommand,
} from "@aws-sdk/client-cloudwatch-logs";

const enableMacie = async () => {
	const client = new Macie2Client({ region: process.env.AWS_REGION });
	try {
		const input = {};
		const command = new EnableMacieCommand(input);
		const response = await client.send(command);
		return response;
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
		const response = await client.send(command);
		return response;
	} catch (err) {
		console.log(err);
	}
};

export const prereqTranslation = async () => {
	await enableMacie();
	await createLogGroup("/aws/macie/classificationjobs");
};

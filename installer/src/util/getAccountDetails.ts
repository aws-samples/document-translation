import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

export const getAccountId = async (): Promise<string> => {
	const stsClient = new STSClient();
	const command = new GetCallerIdentityCommand({});
	const response = await stsClient.send(command);

	if (!response.Account) throw new Error("Unable to determine Account ID");

	const accountPattern = /^\d{12}$/;
	if (!accountPattern.test(response.Account)) {
		throw new Error(`Invalid Account ID: ${response.Account}`);
	}

	return response.Account;
};

export const getRegionId = async (): Promise<string> => {
	const region = process.env.AWS_REGION;

	if (!region)
		throw new Error(
			"Unable to determine Region. Expect environment var of 'AWS_REGION'. Can be manually set with 'export AWS_REGION=xx-yyyy-x'."
		);

	const regionPattern = /^[a-z]{2}-[a-z]+-\d+$/;
	if (!regionPattern.test(region)) {
		throw new Error(`Invalid AWS Region: ${region}`);
	}

	return region;
};

import { getAccountId, getRegionId } from "./util/getAccountDetails";

export interface AwsConfig {
	account: string;
	region: string;
}

export const getAwsConfig = async (): Promise<AwsConfig> => {
	const awsConfig = {
		account: await getAccountId(),
		region: await getRegionId(),
	};
	return awsConfig;
};

const main = async () => console.log(await getAwsConfig());
if (require.main === module) main();

import { exec } from "child_process";

export const prereqCdk = () => {
	if (process.env.AWS_ACCOUNT_ID && process.env.AWS_REGION) {
		const bootstrapCommand = `npx --yes cdk@2.152.0 bootstrap aws://${process.env.AWS_ACCOUNT_ID}/${process.env.AWS_REGION}`;
		exec(bootstrapCommand, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
			console.log(`stdout: ${stdout}`);
			console.error(`stderr: ${stderr}`);
		});
	}
};

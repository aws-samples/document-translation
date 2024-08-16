import { input, confirm } from "@inquirer/prompts";

export type webOptions = {
	webUi: boolean;
	customDomain?: boolean;
	customDomainName?: string;
	customDomainArn?: string;
};

const showInstruction = () => {
	console.log(`
# Web UI Configuration
Prerequisites for custom domain name: https://aws-samples.github.io/document-translation/docs/shared/prerequisites/domain/
Post Install for custom domain name: https://aws-samples.github.io/document-translation/docs/shared/post-install/domain/
	`);
};

export const getWebOptions = async (): Promise<webOptions> => {
	showInstruction();
	const theme = {
		prefix: "Shared Web: ",
	};

	const answers: webOptions = {
		webUi: await confirm({
			message: "Web UI",
			default: true,
			theme,
		}),
	};

	if (answers.webUi) {
		answers.customDomain = await confirm({
			message: "Custom Domain",
			default: false,
			theme,
		});
	}

	if (answers.customDomain) {
		answers.customDomainName = await input({
			message: "Custom Domain Name (doctran.example.com)",
			required: true,
			theme,
		});
		answers.customDomainArn = await input({
			message: "Custom Domain Certificate Arn (arn:aws:acm:...)",
			required: true,
			validate: (value) => {
				if (value.startsWith("arn:aws:acm:")) {
					return true;
				}
				return "Invalid ARN";
			},
			theme,
		});
	}

	return answers;
};

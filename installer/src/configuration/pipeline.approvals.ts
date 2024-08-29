import { input, confirm } from "@inquirer/prompts";
import { PipelineApprovalOptions } from "./options";

const theme = {
	prefix: "Pipeline - Source: ",
};

const showInstruction = () => {
	console.log(`
# Pipeline - Approvals
GitHub is used at the source code repository.
Requirements: 1) GitHub Account. 2) GitHub Access Token.
If using the upstream AWS-Samples respository then a classic token with "public_repo" and no expiration will work. 
Prerequisite: https://aws-samples.github.io/document-translation/docs/shared/configuration/source-service/github/
	`);
};

export const getPipelineApprovalOptions =
	async (): Promise<PipelineApprovalOptions> => {
		showInstruction();

		const answers: PipelineApprovalOptions = {
			pipeline_approvals_preCdkSynth_enable: await confirm({
				message: "Enable",
				default: true,
				theme,
			}),
		};

		if (answers.pipeline_approvals_preCdkSynth_enable) {
			answers.pipeline_approvals_preCdkSynth_email = await input({
				message: "Email",
				required: true,
				theme,
			});
		}

		return answers;
	};

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
Prerequisite: https://aws-samples.github.io/document-translation/docs/shared/prerequisites/github-token/
	`);
};

export const getPipelineApprovalOptions =
	async (): Promise<PipelineApprovalOptions> => {
		showInstruction();

		const answers: PipelineApprovalOptions = {
			pipeline: {
				approvals: {
					preCdkSynth: {
						enable: await confirm({
							message: "Enable",
							default: true,
							theme,
						}),
					},
				},
			},
		};

		if (answers.pipeline.approvals.preCdkSynth.enable) {
			answers.pipeline.approvals.preCdkSynth.email = await input({
				message: "Email",
				required: true,
				theme,
			});
		}

		return answers;
	};

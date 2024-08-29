import { input, select } from "@inquirer/prompts";
import { PipelineSourceOptions } from "./options";
import {
	SecretsManagerClient,
	CreateSecretCommand,
} from "@aws-sdk/client-secrets-manager";

type secretsManagerError = {
	$fault: string;
	$metadata: {
		httpStatusCode: number;
		requestId: string;
		extendedRequestId: string | undefined;
		cfId: string | undefined;
		attempts: number;
		totalRetryDelay: number;
	};
	__type: string;
};

const createAwsSecret = async (name: string, secret: string) => {
	const client = new SecretsManagerClient();
	try {
		const data = await client.send(
			new CreateSecretCommand({
				Name: name,
				SecretString: secret,
				ForceOverwriteReplicaSecret: true,
			})
		);
		return data;
	} catch (err) {
		const error: secretsManagerError = err as secretsManagerError;
		if (error.__type === "ResourceExistsException") {
			throw new Error(
				// `Secret already exists in AWS SecretsManager: ${name}.\nIf this token is old and no longer required it can be deleted (this is irreversable).\nDelete command: 'aws secretsmanager delete-secret --secret-id ${name}'.\nYou can view the contents of the secret to check its value.\nReveal command: 'aws secretsmanager get-secret-value --secret-id ${name}'. `
				`Secret already exists in AWS SecretsManager: ${name}. `
			);
		} else {
			throw new Error(
				`Error creating secret in AWS SecretsManager: ${name}: ${err}`
			);
		}
	}
};

type githubBranchInfo = {
	name: string;
	commit: {
		sha: string;
		url: string;
	};
	protected: boolean;
	protection: {
		enabled: boolean;
		required_status_checks: {
			enforcement_level: string;
			contexts: string[];
			checks: string[];
		};
	};
	protection_url: string;
};

// get the branches for a github repo without an API key
const getGithubBranches = async (
	repoOwner: string,
	repoName: string,
	token: string
): Promise<string[]> => {
	// get the branches for a github repo without an API key
	const url = `https://api.github.com/repos/${repoOwner}/${repoName}/branches`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const jsonData = await response.json();
	if (Array.isArray(jsonData)) {
		const data: githubBranchInfo[] = jsonData;
		return data.map((branch: any) => branch.name);
	} else {
		throw new Error("Unexpected response format");
	}
};

type branchChoices = {
	name: string;
	value: string;
};

const getGitHubReleaseBranches = async (
	repoOwner: string,
	repoName: string,
	token: string
): Promise<branchChoices[]> => {
	const branches = await getGithubBranches(repoOwner, repoName, token);
	const releaseBranches = branches.filter((branch: string) =>
		branch.startsWith("release/")
	);

	releaseBranches.sort().reverse();
	const choices: branchChoices[] = releaseBranches.map((branch: string) => ({
		name: branch,
		value: branch,
	}));

	return choices;
};

const canTokenRepoHook = async (token: string): Promise<boolean> => {
	const url = `https://api.github.com/authorizations`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const scopes = response.headers.get("x-oauth-scopes");
	if (scopes && scopes.includes("repo_hook")) {
		return true;
	}
	return false;
};

const usePeriodicChecksInCodepipeline = (
	owner: string,
	name: string
): boolean => {
	if (owner === "aws-samples" && name === "document-translation") {
		console.log("Pointed at upstream. Using periodic checks in codepipeline");
		return true;
	} else {
		console.log("Pointed at fork. Using repo hooks to codepipeline");
		return false;
	}
};

const theme = {
	prefix: "Pipeline - Source: ",
};

const showInstruction = () => {
	console.log(`
# Pipeline - Source Configuration
GitHub is used at the source code repository.
Requirements: 1) GitHub Account. 2) GitHub Access Token.
If using the upstream AWS-Samples respository then a classic token with "public_repo" and no expiration will work. 
Prerequisite: https://aws-samples.github.io/document-translation/docs/shared/configuration/source-service/github/
	`);
};

export const getPipelineSourceOptions = async (
	instanceName: string
): Promise<PipelineSourceOptions> => {
	showInstruction();

	let answers: PipelineSourceOptions = {
		pipeline_source_repoOwner: await input({
			message: "Repo Owner (github.com/<OWNER>/<NAME>)",
			required: true,
			default: "aws-samples",
			theme,
		}),
		pipeline_source_repoName: await input({
			message: "Repo Name (github.com/<OWNER>/<NAME>)",
			required: true,
			default: "document-translation",
			theme,
		}),
		pipeline_source_repoBranch: "",
		pipeline_source_repoHookEnable: false,
		pipeline_source_repoPeriodicChecksEnable: true,
		pipeline_source_repoTokenName: "",
	};

	const repoToken: string = await input({
		message: "Token",
		required: true,
		theme,
	});

	const timestamp = Math.floor(Date.now() / 1000);
	answers.pipeline_source_repoTokenName = `doctran-${instanceName}-oauth-token-${timestamp}`;
	createAwsSecret(answers.pipeline_source_repoTokenName, repoToken);

	answers.pipeline_source_repoBranch = await select({
		message: "Release",
		choices: await getGitHubReleaseBranches(
			answers.pipeline_source_repoOwner,
			answers.pipeline_source_repoName,
			repoToken
		),
		theme,
	});

	answers.pipeline_source_repoPeriodicChecksEnable =
		usePeriodicChecksInCodepipeline(
			answers.pipeline_source_repoOwner,
			answers.pipeline_source_repoName
		);
	answers.pipeline_source_repoHookEnable = await canTokenRepoHook(repoToken);

	return answers;
};

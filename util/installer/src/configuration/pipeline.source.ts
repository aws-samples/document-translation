import { confirm, input, select } from "@inquirer/prompts";
import { PipelineSourceOptions } from "./options";
import {
	SecretsManagerClient,
	CreateSecretCommand,
	GetSecretValueCommand,
	PutSecretValueCommand,
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

const getAwsSecretValue = async (name: string) => {
	const client = new SecretsManagerClient();
	try {
		const data = await client.send(
			new GetSecretValueCommand({ SecretId: name })
		);
		return data.SecretString;
	} catch (err) {
		const error: secretsManagerError = err as secretsManagerError;
		if (error.__type === "ResourceNotFoundException") {
			console.log(`Secret not found in AWS SecretsManager: ${name}. `);
		} else {
			throw new Error(
				`Error getting secret in AWS SecretsManager: ${name}: ${err}`
			);
		}
	}
};

const updateAwsSecret = async (name: string, secret: string) => {
	const client = new SecretsManagerClient();
	try {
		const data = await client.send(
			new PutSecretValueCommand({
				SecretId: name,
				SecretString: secret,
			})
		);
		return data;
	} catch (err) {
		const error: secretsManagerError = err as secretsManagerError;
		if (error.__type === "ResourceNotFoundException") {
			throw new Error(`Secret not found in AWS SecretsManager: ${name}. `);
		} else {
			throw new Error(
				`Error updating secret in AWS SecretsManager: ${name}: ${err}`
			);
		}
	}
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
			throw new Error(`Secret already exists in AWS SecretsManager: ${name}. `);
		} else {
			throw new Error(
				`Error creating secret in AWS SecretsManager: ${name}: ${err}`
			);
		}
	}
};

const handleRepoToken = async (name: string) => {
	const secretValue = await getAwsSecretValue(name);

	if (secretValue) {
		const useExistingSecret = await confirm({
			message: `Secret ${name} already exists. Do you want to use it?`,
			default: true,
			theme,
		});

		if (useExistingSecret) {
			return secretValue;
		} else {
			const repoToken = await input({
				message: "Enter the repository token:",
				theme,
			});
			await updateAwsSecret(name, repoToken);
			return repoToken;
		}
	}
	const repoToken = await input({
		message: "Enter the repository token:",
		theme,
	});
	await createAwsSecret(name, repoToken);
	return repoToken;
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
		pipeline: {
			source: {
				repoOwner: await input({
					message: "Repo Owner (github.com/<OWNER>/<NAME>)",
					required: true,
					default: "aws-samples",
					theme,
				}),
				repoName: await input({
					message: "Repo Name (github.com/<OWNER>/<NAME>)",
					required: true,
					default: "document-translation",
					theme,
				}),
				repoBranch: "",
				repoHookEnable: false,
				repoPeriodicChecksEnable: true,
				repoTokenName: "",
			},
		},
	};

	const repoToken = await handleRepoToken(
		`doctran-${instanceName}-oauth-token`
	);

	answers.pipeline.source.repoBranch = await select({
		message: "Release",
		choices: await getGitHubReleaseBranches(
			answers.pipeline.source.repoOwner,
			answers.pipeline.source.repoName,
			repoToken
		),
		theme,
	});

	answers.pipeline.source.repoPeriodicChecksEnable =
		usePeriodicChecksInCodepipeline(
			answers.pipeline.source.repoOwner,
			answers.pipeline.source.repoName
		);
	answers.pipeline.source.repoHookEnable = await canTokenRepoHook(repoToken);

	return answers;
};
